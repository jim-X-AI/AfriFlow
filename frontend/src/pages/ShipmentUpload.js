// FILE: frontend/src/pages/ShipmentUpload.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function ShipmentUpload() {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const [trade, setTrade] = useState(null);
  const [form, setForm] = useState({ tracking_number: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get(`/trades/${tradeId}`).then(res => setTrade(res.data.trade));
  }, [tradeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/trades/${tradeId}/shipment`, form);
      setDone(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="max-w-lg mx-auto px-6 py-8 fade-in">
      <div className="card text-center space-y-5">
        <div className="text-5xl">📦</div>
        <h2 className="text-2xl font-bold text-white">Shipment Confirmed</h2>
        <p className="text-gray-400">The buyer has been notified. They have {trade?.delivery_days} days to confirm delivery or raise a dispute.</p>
        {form.tracking_number && (
          <div className="bg-surface rounded-xl p-4">
            <p className="text-xs text-gray-500">Tracking</p>
            <p className="font-mono text-brand-400 font-medium">{form.tracking_number}</p>
          </div>
        )}
        <button onClick={() => navigate(`/trade/${tradeId}`)} className="btn-primary w-full text-center">
          Back to Trade →
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-6 py-8 fade-in space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Confirm Shipment</h1>
        <p className="text-gray-500 text-sm mt-1">The buyer can see funds are secured. Ship with confidence.</p>
      </div>

      <div className="card bg-green-900/10 border-green-800/30">
        <p className="text-sm text-green-400">
          ✓ Escrow funds are locked and waiting for you upon delivery confirmation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Tracking Number</label>
          <input
            className="input"
            placeholder="e.g. GH-LAG-2024-8821"
            value={form.tracking_number}
            onChange={e => setForm(f => ({ ...f, tracking_number: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Shipment Notes (optional)</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Any notes about packaging, handling, or delivery instructions..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>
        <div className="border border-dashed border-border rounded-xl p-6 text-center text-gray-600">
          <p className="text-sm">📎 Photo/document upload</p>
          <p className="text-xs mt-1">Attach packaging photo or waybill to strengthen your delivery proof</p>
          <p className="text-xs text-gray-700 mt-1">(File upload available in production build)</p>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full text-center">
          {loading ? 'Submitting...' : 'Confirm Shipment →'}
        </button>
      </form>
    </div>
  );
}