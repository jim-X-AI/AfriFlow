// FILE: frontend/src/pages/TrustProfile.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { ScoreRing, MetricBar, DisputeBadge, CorridorBadge } from '../components/TrustScoreBar';

export default function TrustProfile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser?.id === parseInt(userId);

  useEffect(() => {
    api.get(`/profile/${userId}`)
      .then(res => setData(res.data))
      .catch(() => navigate('/my-trades'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingScreen />;
  if (!data) return null;

  const { user, trust_score: t, trade_history } = data;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 fade-in">
      {/* Header Card */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar + Info */}
          <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-2xl">
              {user.avatar_initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{user.business_name}</h1>
                {user.verified && (
                  <span className="bg-green-900/40 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
                    ✓ Verified
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm">{user.name}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>📍 {user.location}</span>
                <span>·</span>
                <span>🏢 {user.business_type}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-xs text-brand-400 bg-brand-900/20 px-2 py-0.5 rounded">
                  {user.trade_id}
                </span>
                {user.phone && (
                  <span className="text-xs text-gray-600">{user.phone}</span>
                )}
              </div>
            </div>
          </div>

          {/* Score Ring */}
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={t.overall_score} size={110} />
            <p className="text-xs text-gray-500">Trust Score</p>
            {t.previous_score && t.overall_score !== t.previous_score && (
              <div className={`text-xs font-medium ${t.overall_score > t.previous_score ? 'text-green-400' : 'text-red-400'}`}>
                {t.overall_score > t.previous_score ? '↑' : '↓'} from {Math.round(t.previous_score)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="card space-y-5">
        <h2 className="font-semibold text-white">Score Breakdown</h2>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <MetricBar label="Payment Reliability" value={t.payment_reliability} />
            <MetricBar label="Delivery Accuracy" value={t.delivery_accuracy} />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Dispute Rate</p>
              <DisputeBadge label={t.dispute_rate} />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Corridor Experience</p>
              <CorridorBadge label={t.corridor_experience} />
            </div>
          </div>
        </div>

        {/* Trade stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <Stat value={t.total_trades} label="Completed Trades" />
          <Stat value={t.total_disputes} label="Disputes Raised" />
          <Stat value={t.disputes_won} label="Disputes Won" />
        </div>
      </div>

      {/* Trade History */}
      {trade_history?.length > 0 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white">Trade History</h2>
          <div className="space-y-3">
            {trade_history.map(event => (
              <HistoryRow key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Action */}
      {!isOwnProfile && (
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/trade/create?supplier=${userId}`)}
            className="btn-primary flex-1 text-center"
          >
            Start a Trade with {user.business_name}
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function HistoryRow({ event }) {
  const icons = {
    trade_created: '📝',
    trade_accepted: '✅',
    escrow_funded: '🔐',
    goods_shipped: '📦',
    delivery_confirmed: '✓',
    funds_released: '💰',
    dispute_raised: '⚠️',
    dispute_resolved: '⚖️',
    trust_updated: '📊',
    trade_settled: '🏆',
    dispute_won: '🏅',
    default: '•',
  };

  const icon = icons[event.event_type] || icons.default;
  const date = new Date(event.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className="flex items-start gap-3">
      <span className="text-sm mt-0.5">{icon}</span>
      <div className="flex-1">
        <p className="text-sm text-gray-300">{event.description}</p>
        <p className="text-xs text-gray-600 mt-0.5">{date}</p>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="card h-32 animate-pulse bg-panel" />
      ))}
    </div>
  );
}