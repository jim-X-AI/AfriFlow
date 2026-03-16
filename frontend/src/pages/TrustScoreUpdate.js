// FILE: frontend/src/pages/TrustScoreUpdate.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { ScoreRing } from '../components/TrustScoreBar';

export default function TrustScoreUpdate() {
  const { tradeId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [trust, setTrust] = useState(null);
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    api.get(`/trades/${tradeId}`).then(res => setData(res.data));
    if (user) {
      api.get(`/trust/${user.id}`).then(res => setTrust(res.data));
    }
  }, [tradeId, user?.id]);

  useEffect(() => {
    const t = setTimeout(() => setShowScore(true), 800);
    return () => clearTimeout(t);
  }, []);

  if (!data || !trust) return null;
  const { trade, supplier, buyer } = data;
  const isBuyer = user?.id === trade.buyer_id;
  const partner = isBuyer ? supplier : buyer;
  const delta = trust.overall_score - trust.previous_score;

  return (
    <div className="max-w-lg mx-auto px-6 py-8 fade-in space-y-5">
      <div className="card text-center space-y-6">
        <div className="space-y-2">
          <div className="text-4xl">🏆</div>
          <h1 className="text-2xl font-bold text-white">Trade Complete</h1>
          <p className="text-gray-500 text-sm">
            This trade is permanently recorded on your Trust Profile.
          </p>
        </div>

        {/* Score update */}
        {showScore && (
          <div className="fade-in space-y-4">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-2">Previous</p>
                <div className="opacity-50">
                  <ScoreRing score={trust.previous_score} size={80} />
                </div>
              </div>
              <div className="text-brand-400 text-2xl font-bold">→</div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-2 font-medium">New Score</p>
                <ScoreRing score={trust.overall_score} size={80} />
              </div>
            </div>

            {delta !== 0 && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold
                ${delta > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)} points
                {delta > 0 ? ' — Reputation growing' : ' — Needs improvement'}
              </div>
            )}
          </div>
        )}

        {/* Trade summary */}
        <div className="bg-surface rounded-xl p-4 text-left space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Trade Recorded</p>
          <p className="text-sm text-white font-medium">{trade.description}</p>
          <p className="text-xs text-gray-500">
            {trade.currency} {trade.amount?.toLocaleString()} · with {partner?.business_name}
          </p>
          <p className="text-xs text-green-400">
            ✓ Permanently stored · Cannot be modified
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`/profile/${user?.id}`)}
            className="btn-secondary text-sm text-center"
          >
            My Profile
          </button>
          <button
            onClick={() => navigate('/trade/create')}
            className="btn-primary text-sm text-center"
          >
            New Trade →
          </button>
        </div>
      </div>
    </div>
  );
}