# FILE: backend/models.py

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    business_name = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    country = db.Column(db.String(100), nullable=False, default='Nigeria')
    business_type = db.Column(db.String(200), nullable=False, default='General Trade')
    phone = db.Column(db.String(50))
    trade_id = db.Column(db.String(20), unique=True)
    verified = db.Column(db.Boolean, default=True)
    avatar_initials = db.Column(db.String(4))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'business_name': self.business_name,
            'location': self.location,
            'country': self.country,
            'business_type': self.business_type,
            'phone': self.phone,
            'trade_id': self.trade_id,
            'verified': self.verified,
            'avatar_initials': self.avatar_initials or self.business_name[:2].upper(),
            'created_at': self.created_at.isoformat()
        }


class Trade(db.Model):
    __tablename__ = 'trades'

    id = db.Column(db.Integer, primary_key=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    quantity = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='NGN')
    delivery_days = db.Column(db.Integer, nullable=False)
    release_condition = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), default='pending_acceptance')
    tracking_number = db.Column(db.String(200))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    STATUS_LABELS = {
        'pending_acceptance': 'Pending Acceptance',
        'accepted': 'Accepted',
        'funded': 'Funded',
        'in_transit': 'In Transit',
        'delivered': 'Delivered',
        'settled': 'Settled',
        'disputed': 'Disputed',
        'refunded': 'Refunded'
    }

    STATUS_ORDER = ['pending_acceptance', 'accepted', 'funded', 'in_transit', 'delivered', 'settled']

    def to_dict(self):
        return {
            'id': self.id,
            'buyer_id': self.buyer_id,
            'supplier_id': self.supplier_id,
            'description': self.description,
            'quantity': self.quantity,
            'amount': self.amount,
            'currency': self.currency,
            'delivery_days': self.delivery_days,
            'release_condition': self.release_condition,
            'status': self.status,
            'status_label': self.STATUS_LABELS.get(self.status, self.status),
            'tracking_number': self.tracking_number,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class TrustScore(db.Model):
    __tablename__ = 'trust_scores'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    overall_score = db.Column(db.Float, default=50.0)
    payment_reliability = db.Column(db.Float, default=50.0)
    delivery_accuracy = db.Column(db.Float, default=50.0)
    dispute_rate_value = db.Column(db.Float, default=0.0)
    corridor_experience_value = db.Column(db.Float, default=0.0)
    total_trades = db.Column(db.Integer, default=0)
    total_disputes = db.Column(db.Integer, default=0)
    disputes_won = db.Column(db.Integer, default=0)
    previous_score = db.Column(db.Float, default=50.0)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def get_dispute_rate_label(self):
        if self.total_trades == 0:
            return 'None'
        rate = self.total_disputes / max(self.total_trades, 1)
        if rate == 0:
            return 'None'
        elif rate < 0.05:
            return 'Very Low'
        elif rate < 0.10:
            return 'Low'
        elif rate < 0.20:
            return 'Medium'
        else:
            return 'High'

    def get_corridor_label(self):
        if self.total_trades == 0:
            return 'None'
        elif self.total_trades < 5:
            return 'Emerging'
        elif self.total_trades < 15:
            return 'Growing'
        elif self.total_trades < 30:
            return 'Medium'
        else:
            return 'Experienced'

    def to_dict(self):
        return {
            'overall_score': round(self.overall_score, 1),
            'previous_score': round(self.previous_score, 1),
            'payment_reliability': round(self.payment_reliability, 1),
            'delivery_accuracy': round(self.delivery_accuracy, 1),
            'dispute_rate': self.get_dispute_rate_label(),
            'dispute_rate_value': round(self.dispute_rate_value, 1),
            'corridor_experience': self.get_corridor_label(),
            'corridor_experience_value': round(self.corridor_experience_value, 1),
            'total_trades': self.total_trades,
            'total_disputes': self.total_disputes,
            'disputes_won': self.disputes_won,
            'updated_at': self.updated_at.isoformat()
        }


class EscrowAccount(db.Model):
    __tablename__ = 'escrow_accounts'

    id = db.Column(db.Integer, primary_key=True)
    trade_id = db.Column(db.Integer, db.ForeignKey('trades.id'), unique=True, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='NGN')
    status = db.Column(db.String(50), default='awaiting_deposit')
    merchant_code = db.Column(db.String(50), default='MX153376')
    pay_item_id = db.Column(db.String(50), default='5558761')
    reference = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'trade_id': self.trade_id,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status,
            'merchant_code': self.merchant_code,
            'pay_item_id': self.pay_item_id,
            'reference': self.reference,
            'created_at': self.created_at.isoformat()
        }


class Dispute(db.Model):
    __tablename__ = 'disputes'

    id = db.Column(db.Integer, primary_key=True)
    trade_id = db.Column(db.Integer, db.ForeignKey('trades.id'), nullable=False)
    raised_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reason = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='pending_evidence')
    ai_confidence = db.Column(db.Float)
    ai_finding = db.Column(db.Text)
    ai_recommendation = db.Column(db.Text)
    ai_resolution_type = db.Column(db.String(50))
    resolution = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'trade_id': self.trade_id,
            'raised_by': self.raised_by,
            'reason': self.reason,
            'description': self.description,
            'status': self.status,
            'ai_confidence': self.ai_confidence,
            'ai_finding': self.ai_finding,
            'ai_recommendation': self.ai_recommendation,
            'ai_resolution_type': self.ai_resolution_type,
            'resolution': self.resolution,
            'created_at': self.created_at.isoformat()
        }


class Evidence(db.Model):
    __tablename__ = 'evidence'

    id = db.Column(db.Integer, primary_key=True)
    dispute_id = db.Column(db.Integer, db.ForeignKey('disputes.id'), nullable=False)
    submitted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    evidence_type = db.Column(db.String(50), default='text')
    content = db.Column(db.Text)
    file_path = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'dispute_id': self.dispute_id,
            'submitted_by': self.submitted_by,
            'evidence_type': self.evidence_type,
            'content': self.content,
            'file_path': self.file_path,
            'created_at': self.created_at.isoformat()
        }


class TradeHistory(db.Model):
    __tablename__ = 'trade_history'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    trade_id = db.Column(db.Integer, db.ForeignKey('trades.id'), nullable=False)
    event_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'trade_id': self.trade_id,
            'event_type': self.event_type,
            'description': self.description,
            'created_at': self.created_at.isoformat()
        }