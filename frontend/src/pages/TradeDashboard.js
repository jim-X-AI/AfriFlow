// FILE: frontend/src/pages/TradeDashboard.js

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import TradeCard from '../components/TradeCard';
import { ScoreRing } from '../components/TrustScoreBar';

export default function TradeDashboard() {
  const { tradeId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const fetch = useCallback(() => {
    api.get(`/trades/${tradeId}`)
      .then(res => setData(res.data))
      .catch(() => navigate('/my-trades'))
      .finally(() => setLoading(false));
  }, [tradeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [fetch]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await api.post(`/trades/${tradeId}/accept`);
      fetch();
    } finally {
      setAccepting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!data) return null;

  const { trade, escrow, dispute, buyer, supplier, buyer_trust, supplier_trust } = data;
  const isBuyer = user?.id === trade.buyer_id;
  const isSupplier = user?.id === trade.supplier_id;

  const getActions = () => {
    const actions = [];

    if (trade.status === 'pending_acceptance' && isSupplier) {
      actions.push(
        <button key="accept" onClick={handleAccept} disabled={accepting} className="btn-primary">
          {accepting ? 'Accepting...' : 'Accept Trade'}
        </button>
      );
    }

    if (trade.status === 'accepted' && isBuyer) {
      actions.push(
        <button key="deposit" onClick={() => navigate(`/trade/${tradeId}/deposit`)} className="btn-primary">
          Deposit {trade.currency} {trade.amount?.toLocaleString()} to Escrow →
        </button>
      );
    }

    if (trade.status === 'funded' && isSupplier) {
      actions.push(
        <button key="ship" onClick={() => navigate(`/trade/${tradeId}/shipment`)} className="btn-primary">
          Upload Shipment Proof →
        </button>
      );
    }

    if (trade.status === 'in_transit' && isBuyer) {
      actions.push(
        <button key="confirm" onClick={() => navigate(`/trade/${tradeId}/confirm`)} className="btn-primary">
          Confirm Delivery →
        </button>,
        <button key="dispute" onClick={() => navigate(`/trade/${tradeId}/dispute`)} className="btn-secondary">
          Raise Dispute
        </button>
      );
    }

    if (trade.status === 'disputed' && dispute && !dispute.ai_confidence) {
      actions.push(
        <button key="review" onClick={() => navigate(`/dispute/${dispute.id}/review`)} className="btn-primary">
          View AI Dispute Review →
        </button>
      );
    }

    if (trade.status === 'settled') {
      actions.push(
        <button key="complete" onClick={() => navigate(`/trade/${tradeId}/complete`)} className="btn-primary">
          View Settlement & Score Update →
        </button>
      );
    }

    return actions;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 fade-in space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trade Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Trade #{trade.id} · Updated live every 5s</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-400">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-soft" />
          Live
        </div>
      </div>

      {/* Trade Card */}
      <TradeCard trade={trade} buyer={buyer} supplier={supplier} escrow={escrow} />

      {/* Actions */}
      {getActions().length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Your Actions</h2>
          <div className="flex flex-wrap gap-3">
            {getActions()}
          </div>
        </div>
      )}

      {/* Trust scores side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TrustPanel
          user={buyer}
          trust={buyer_trust}
          role="Buyer"
          isSelf={isBuyer}
          onViewProfile={() => navigate(`/profile/${buyer?.id}`)}
        />
        <TrustPanel
          user={supplier}
          trust={supplier_trust}
          role="Supplier"
          isSelf={isSupplier}
          onViewProfile={() => navigate(`/profile/${supplier?.id}`)}
        />
      </div>

      {/* Dispute panel */}
      {dispute && (
        <div className="card border border-red-800/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-red-400">⚠️ Active Dispute</h2>
            <span className={`status-badge text-xs ${
              dispute.status === 'auto_resolved' ? 'bg-green-900/40 text-green-400' :
              dispute.status === 'ai_reviewing' ? 'bg-blue-900/40 text-blue-400' :
              'bg-red-900/40 text-red-400'
            }`}>
              {dispute.status?.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-1"><span className="text-white">Reason:</span> {dispute.reason}</p>
          {dispute.description && <p className="text-sm text-gray-500">{dispute.description}</p>}

          {dispute.ai_confidence && (
            <div className="mt-4 p-4 bg-surface rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">AI Confidence</span>
                <span className={`font-bold ${dispute.ai_confidence >= 85 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {dispute.ai_confidence}%
                </span>
              </div>
              <p className="text-sm text-gray-300">{dispute.ai_finding}</p>
              <p className="text-sm text-brand-400 font-medium">{dispute.ai_recommendation}</p>
            </div>
          )}

          {!dispute.ai_confidence && (
            <button
              onClick={() => navigate(`/dispute/${dispute.id}/review`)}
              className="btn-primary mt-4 text-sm"
            >
              Run AI Dispute Review →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TrustPanel({ user, trust, role, isSelf, onViewProfile }) {
  if (!user) return null;
  return (
    <div className={`card ${isSelf ? 'border-brand-500/30' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400">{role} {isSelf ? '(You)' : ''}</h3>
        <button onClick={onViewProfile} className="text-xs text-brand-400 hover:text-brand-300">
          View Profile →
        </button>
      </div>
      <div className="flex items-center gap-4">
        <ScoreRing score={trust?.overall_score || 50} size={70} />
        <div>
          <p className="font-semibold text-white">{user.business_name}</p>
          <p className="text-xs text-gray-500">{user.location}</p>
          <p className="text-xs text-gray-600 mt-1">{trust?.total_trades || 0} completed trades</p>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="card h-40 animate-pulse" />)}
    </div>
  );
}