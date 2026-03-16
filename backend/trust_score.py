# FILE: backend/trust_score.py
#
# Rule-based Trust Score Engine
# Architecture allows drop-in replacement with ML model (XGBoost/LightGBM).
# ML model replaces compute_signals() and score_from_signals() only.
# All persistence logic remains unchanged.

from models import db, User, Trade, TrustScore, Dispute, Evidence
import datetime


# ─────────────────────────────────────────
# SIGNAL WEIGHTS
# These weights are the primary tuning surface.
# In ML version, a trained model replaces these.
# ─────────────────────────────────────────

WEIGHTS = {
    'payment_reliability': 0.35,
    'delivery_accuracy':   0.35,
    'dispute_penalty':     0.15,
    'dispute_win_bonus':   0.10,
    'volume_bonus':        0.05,
}

SCORE_MIN = 10.0
SCORE_MAX = 100.0


def compute_signals(user_id: int) -> dict:
    """
    Extract behavioral signals from trade history.
    Returns normalized signal values 0–100 and raw counts.
    This function is the ML model injection point.
    """

    # All settled trades involving this user
    settled_trades = Trade.query.filter(
        (Trade.buyer_id == user_id) | (Trade.supplier_id == user_id)
    ).filter(Trade.status.in_(['settled', 'refunded'])).all()

    total_trades = len(settled_trades)

    # All trades (including active) for volume signal
    all_trades = Trade.query.filter(
        (Trade.buyer_id == user_id) | (Trade.supplier_id == user_id)
    ).all()

    disputes = Dispute.query.join(Trade, Dispute.trade_id == Trade.id).filter(
        (Trade.buyer_id == user_id) | (Trade.supplier_id == user_id)
    ).all()

    total_disputes = len(disputes)
    disputes_won = sum(
        1 for d in disputes
        if d.ai_resolution_type == 'release_to_supplier' and
        Trade.query.get(d.trade_id).supplier_id == user_id
        or d.ai_resolution_type == 'refund_to_buyer' and
        Trade.query.get(d.trade_id).buyer_id == user_id
    )

    # ── Payment Reliability ──────────────────
    # Measures buyer behavior: how quickly they fund escrow
    buyer_trades = [t for t in settled_trades if t.buyer_id == user_id]
    if buyer_trades:
        payment_reliability = min(100, 60 + (len(buyer_trades) * 2))
    elif total_trades > 0:
        payment_reliability = 70
    else:
        payment_reliability = 50

    # ── Delivery Accuracy ────────────────────
    # Measures supplier behavior: goods delivered as described
    supplier_trades = [t for t in settled_trades if t.supplier_id == user_id]
    supplier_disputes = [
        d for d in disputes
        if Trade.query.get(d.trade_id).supplier_id == user_id
    ]
    if supplier_trades:
        clean_deliveries = len(supplier_trades) - len(supplier_disputes)
        delivery_accuracy = min(100, (clean_deliveries / len(supplier_trades)) * 100)
        delivery_accuracy = max(delivery_accuracy, 40)
    elif total_trades > 0:
        delivery_accuracy = 72
    else:
        delivery_accuracy = 50

    # ── Dispute Rate ─────────────────────────
    dispute_rate = (total_disputes / max(total_trades, 1)) * 100 if total_trades > 0 else 0

    # ── Corridor Experience ──────────────────
    # Unique corridors proxy: combination of buyer/supplier country pairs in trades
    corridor_experience = min(100, total_trades * 3.5)

    # ── Volume/Frequency Bonus ───────────────
    volume_score = min(100, len(all_trades) * 4)

    return {
        'payment_reliability': round(payment_reliability, 2),
        'delivery_accuracy': round(delivery_accuracy, 2),
        'dispute_rate': round(dispute_rate, 2),
        'corridor_experience': round(corridor_experience, 2),
        'volume_score': round(volume_score, 2),
        'total_trades': total_trades,
        'total_disputes': total_disputes,
        'disputes_won': disputes_won,
    }


def score_from_signals(signals: dict) -> float:
    """
    Compute composite 0–100 score from behavioral signals.
    ML model replaces this with model.predict(feature_vector).
    """
    base = (
        signals['payment_reliability'] * WEIGHTS['payment_reliability'] +
        signals['delivery_accuracy'] * WEIGHTS['delivery_accuracy']
    )

    dispute_penalty = signals['dispute_rate'] * WEIGHTS['dispute_penalty']
    dispute_win_bonus = (signals['disputes_won'] / max(signals['total_disputes'], 1)) * 10 \
        if signals['total_disputes'] > 0 else 0

    volume_bonus = signals['volume_score'] * WEIGHTS['volume_bonus']

    raw_score = base - dispute_penalty + dispute_win_bonus + volume_bonus

    # Apply trade volume floor: new businesses start conservative
    if signals['total_trades'] == 0:
        raw_score = min(raw_score, 55)
    elif signals['total_trades'] < 3:
        raw_score = min(raw_score, 70)

    return round(max(SCORE_MIN, min(SCORE_MAX, raw_score)), 1)


def calculate_and_update_trust_score(user_id: int) -> dict:
    """
    Compute and persist updated trust score for a user.
    Called after every completed trade or dispute resolution.
    Returns serialized score dict.
    """
    signals = compute_signals(user_id)
    new_score = score_from_signals(signals)

    trust = TrustScore.query.filter_by(user_id=user_id).first()
    if not trust:
        trust = TrustScore(user_id=user_id)
        db.session.add(trust)

    trust.previous_score = trust.overall_score
    trust.overall_score = new_score
    trust.payment_reliability = signals['payment_reliability']
    trust.delivery_accuracy = signals['delivery_accuracy']
    trust.dispute_rate_value = signals['dispute_rate']
    trust.corridor_experience_value = signals['corridor_experience']
    trust.total_trades = signals['total_trades']
    trust.total_disputes = signals['total_disputes']
    trust.disputes_won = signals['disputes_won']
    trust.updated_at = datetime.datetime.utcnow()

    db.session.commit()
    return trust.to_dict()


def get_trust_profile(user_id: int) -> dict:
    """Return trust score dict for user, computing if missing."""
    trust = TrustScore.query.filter_by(user_id=user_id).first()
    if not trust:
        return calculate_and_update_trust_score(user_id)
    return trust.to_dict()