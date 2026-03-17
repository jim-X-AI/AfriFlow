// FILE: frontend/src/pages/DeliveryConfirmation.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function DeliveryConfirmation() {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    api.get(`/trades/${tradeId}`).then(res => setData(res.data));
  }, [tradeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await api.post(`/trades/${tradeId}/confirm`);
      setConfirmed(true);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!data) return null;
  const { trade, supplier } = data;

  if (confirmed) return (
    <div className="max-w-lg mx-auto px-6 py-8 fade-in">
      <div className="card text-center space-y-5">
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-bold text-white">Delivery Confirmed</h2>
        <p className="text-gray-400">
          {trade.currency} {trade.amount?.toLocaleString()} has been released to {supplier?.business_name}.
        </p>
        <div className="bg-surface rounded-xl p-4 text-sm text-gray-400">
          Both Trust Profiles have been updated. This trade is permanently recorded.
        </div>
        <button onClick={() => navigate(`/trade/${tradeId}/complete`)} className="btn-primary w-full text-center">
          View Score Update →
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-6 py-8 fade-in space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Goods Arrived?</h1>
        <p className="text-gray-500 text-sm mt-1">Confirm receipt to release funds to supplier.</p>
      </div>

      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-gray-400">Trade</h2>
        <p className="text-white font-medium">{trade.description}</p>
        <p className="text-gray-500 text-sm">{trade.quantity}</p>
        {trade.tracking_number && (
          <div className="bg-surface rounded-xl p-3">
            <p className="text-xs text-gray-500">Tracking</p>
            <p className="font-mono text-sm text-brand-400">{trade.tracking_number}</p>
          </div>
        )}
        <div className="border-t border-border pt-3 flex justify-between items-center">
          <span className="text-gray-400">Escrow amount</span>
          <span className="text-xl font-bold text-brand-400">
            {trade.currency} {trade.amount?.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button onClick={handleConfirm} disabled={loading} className="btn-primary w-full text-center py-4">
          {loading ? 'Confirming...' : '✓ Confirm Delivery & Release Funds'}
        </button>
        <button
          onClick={() => navigate(`/trade/${tradeId}/dispute`)}
          className="btn-secondary w-full text-center"
        >
          ⚠️ Raise a Dispute
        </button>
      </div>

      <p className="text-center text-xs text-gray-600">
        Once confirmed, funds release immediately. This action cannot be undone.
      </p>
    </div>
  );
}