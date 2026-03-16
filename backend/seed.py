# FILE: backend/seed.py
#
# Seeds demo accounts and pre-existing trade history for hackathon demo.
# Amaka (Buyer, Lagos) and Kwame (Supplier, Accra) are pre-loaded.

from models import db, User, Trade, TrustScore, EscrowAccount, TradeHistory
import datetime


def seed_demo_data():
    """Idempotent seed — only seeds if users don't exist."""

    if User.query.filter_by(email='amaka@amakaclothing.ng').first():
        print("[Seed] Demo data already exists. Skipping.")
        return

    print("[Seed] Seeding demo data...")

    # ── AMAKA (Buyer, Lagos) ─────────────────
    amaka = User(
        name='Amaka Okonkwo',
        email='amaka@amakaclothing.ng',
        business_name='Amaka Clothing Co.',
        location='Lagos, Nigeria',
        country='Nigeria',
        business_type='Textile & Fashion Retail',
        phone='+234 801 234 5678',
        trade_id='AFR-NG-00142',
        verified=True,
        avatar_initials='AC'
    )
    amaka.set_password('demo1234')
    db.session.add(amaka)

    # ── KWAME (Supplier, Accra) ──────────────
    kwame = User(
        name='Kwame Asante',
        email='kwame@kwametextiles.gh',
        business_name='Kwame Asante Textiles',
        location='Accra, Ghana',
        country='Ghana',
        business_type='Fabric & Textile Supply',
        phone='+233 244 567 890',
        trade_id='AFR-GH-00087',
        verified=True,
        avatar_initials='KA'
    )
    kwame.set_password('demo1234')
    db.session.add(kwame)

    db.session.flush()

    # ── KWAME'S PRE-EXISTING TRUST SCORE ────
    # Represents 31 completed trades before this demo
    kwame_trust = TrustScore(
        user_id=kwame.id,
        overall_score=87.0,
        previous_score=86.0,
        payment_reliability=84.0,
        delivery_accuracy=94.0,
        dispute_rate_value=6.4,
        corridor_experience_value=78.0,
        total_trades=31,
        total_disputes=2,
        disputes_won=2
    )
    db.session.add(kwame_trust)

    # ── AMAKA'S STARTING TRUST SCORE ────────
    amaka_trust = TrustScore(
        user_id=amaka.id,
        overall_score=74.0,
        previous_score=72.0,
        payment_reliability=78.0,
        delivery_accuracy=71.0,
        dispute_rate_value=0.0,
        corridor_experience_value=35.0,
        total_trades=9,
        total_disputes=0,
        disputes_won=0
    )
    db.session.add(amaka_trust)

    db.session.flush()

    # ── KWAME'S HISTORICAL TRADE HISTORY ────
    past_events = [
        ('trade_settled', 'Completed trade: 200m Kente cloth → Buyer in Lagos'),
        ('trade_settled', 'Completed trade: 500m Ankara fabric → Buyer in Abidjan'),
        ('trade_settled', 'Completed trade: 350m Wax print → Buyer in Nairobi'),
        ('trade_settled', 'Completed trade: 150m Kente → Buyer in Lagos'),
        ('trade_settled', 'Completed trade: 600m Mixed fabrics → Buyer in Dakar'),
        ('dispute_won', 'Dispute resolved in your favour — transit damage case'),
        ('trade_settled', 'Completed trade: 250m Ankara → Buyer in Accra'),
        ('trust_updated', 'Trust Score increased to 87/100'),
    ]

    base_date = datetime.datetime.utcnow() - datetime.timedelta(days=180)
    for i, (event_type, description) in enumerate(past_events):
        entry = TradeHistory(
            user_id=kwame.id,
            trade_id=1,
            event_type=event_type,
            description=description,
            created_at=base_date + datetime.timedelta(days=i * 12)
        )
        db.session.add(entry)

    # ── AMAKA'S HISTORICAL TRADE HISTORY ────
    amaka_events = [
        ('trade_settled', 'Completed trade: 100m Ankara fabric from Accra supplier'),
        ('trade_settled', 'Completed trade: 80m Lace fabric from Lagos supplier'),
        ('trade_settled', 'Completed trade: 200m Cotton blend → supplier in Kano'),
        ('trust_updated', 'Trust Score updated to 74/100'),
    ]

    for i, (event_type, description) in enumerate(amaka_events):
        entry = TradeHistory(
            user_id=amaka.id,
            trade_id=1,
            event_type=event_type,
            description=description,
            created_at=base_date + datetime.timedelta(days=i * 20)
        )
        db.session.add(entry)

    db.session.commit()
    print(f"[Seed] Created: Amaka (ID: {amaka.id}) and Kwame (ID: {kwame.id})")
    print("[Seed] Demo data ready.")
    print("[Seed] Login: amaka@amakaclothing.ng / demo1234")
    print("[Seed] Login: kwame@kwametextiles.gh / demo1234")