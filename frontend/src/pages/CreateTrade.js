// FILE: frontend/src/pages/CreateTrade.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { ScoreRing, DisputeBadge } from '../components/TrustScoreBar';

const RELEASE_CONDITIONS = [
  { value: 'buyer_confirms', label: 'Buyer Confirms Delivery', desc: 'Funds release when buyer manually confirms receipt.' },
  { value: 'timed_auto_release', label: 'Timed Auto-Release', desc: 'Supplier uploads proof. Funds release after 48hrs if no dispute.' },
  { value: 'inspector_verification', label: 'Inspector Verification', desc: 'A neutral inspector confirms goods before release. For high-value trades.' },
];

export default function CreateTrade() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSupplier = searchParams.get('supplier');

  const [users, setUsers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierProfile, setSupplierProfile] = useState(null);
  const [form, setForm] = useState({
    supplier_id: preselectedSupplier || '',
    description: '',
    quantity: '',
    amount: '',
    currency: 'NGN',
    delivery_days: '14',
    release_condition: 'timed_auto_release',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/profile/all').then(res => setUsers(res.data.users));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (form.supplier_id) {
      api.get(`/profile/${form.supplier_id}`).then(res => {
        setSelectedSupplier(res.data.user);
        setSupplierProfile(res.data.trust_score);
      });
    }
  }, [form.supplier_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/trades', {
        ...form,
        supplier_id: parseInt(form.supplier_id),
        amount: parseFloat(form.amount),
        delivery_days: parseInt(form.delivery_days),
      });
      navigate(`/trade/${res.data.trade.id}`);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create trade.');
    } finally {
      setLoading(false);
    }
  };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">New Trade Agreement</h1>
        <p className="text-gray-500 text-sm mt-1">Set terms and lock escrow to protect both parties.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Supplier */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-white">Select Supplier</h2>
            <select
              className="input"
              value={form.supplier_id}
              onChange={e => update('supplier_id', e.target.value)}
              required
            >
              <option value="">Choose a verified supplier...</option>
              {users.filter(u => u.user.id !== user?.id).map(u => (
                <option key={u.user.id} value={u.user.id}>
                  {u.user.business_name} — {u.user.location}
                  {u.user.products_traded?.length > 0 ? ` · ${u.user.products_traded.slice(0,2).join(', ')}` : ''}
                  {` (Score: ${Math.round(u.trust_score?.overall_score || 50)}/100)`}
                </option>
              ))}
            </select>
          </div>

          {/* Goods */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-white">Goods Details</h2>
            <div>
              <label className="label">Description of Goods</label>
              <input
                className="input"
                placeholder="e.g. Ankara fabric — mixed colours and prints"
                value={form.description}
                onChange={e => update('description', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Quantity</label>
              <input
                className="input"
                placeholder="e.g. 500 metres"
                value={form.quantity}
                onChange={e => update('quantity', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Amount</label>
                <input
                  className="input"
                  type="number"
                  placeholder="280000"
                  value={form.amount}
                  onChange={e => update('amount', e.target.value)}
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="label">Currency</label>
                <select className="input" value={form.currency} onChange={e => update('currency', e.target.value)}>
                  <option value="NGN">NGN — Nigerian Naira</option>
                  <option value="GHS">GHS — Ghanaian Cedi</option>
                  <option value="KES">KES — Kenyan Shilling</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="ZAR">ZAR — South African Rand</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Delivery Window (days)</label>
              <input
                className="input"
                type="number"
                value={form.delivery_days}
                onChange={e => update('delivery_days', e.target.value)}
                min="1"
                max="90"
                required
              />
            </div>
          </div>

          {/* Release condition */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-white">Escrow Release Condition</h2>
            <div className="space-y-3">
              {RELEASE_CONDITIONS.map(rc => (
                <label
                  key={rc.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all
                    ${form.release_condition === rc.value
                      ? 'border-brand-500 bg-brand-900/20'
                      : 'border-border hover:border-gray-600'}`}
                >
                  <input
                    type="radio"
                    name="release_condition"
                    value={rc.value}
                    checked={form.release_condition === rc.value}
                    onChange={e => update('release_condition', e.target.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{rc.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{rc.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !form.supplier_id}
            className="btn-primary w-full text-center disabled:opacity-50"
          >
            {loading ? 'Creating Trade...' : 'Create Trade Agreement →'}
          </button>
        </form>

        {/* Supplier preview */}
        <div className="space-y-4">
          {selectedSupplier && supplierProfile ? (
            <div className="card space-y-4 fade-in">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Supplier Profile</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold">
                  {selectedSupplier.avatar_initials}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{selectedSupplier.business_name}</p>
                  <p className="text-xs text-gray-500">{selectedSupplier.location}</p>
                  {selectedSupplier.products_traded?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedSupplier.products_traded.slice(0, 3).map(p => (
                        <span key={p} className="text-xs bg-border text-gray-400 px-1.5 py-0.5 rounded">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <ScoreRing score={supplierProfile.overall_score} size={80} />
                <div className="space-y-2 flex-1 ml-4">
                  <div className="text-xs">
                    <span className="text-gray-500">Delivery: </span>
                    <span className="text-white font-medium">{Math.round(supplierProfile.delivery_accuracy)}%</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">Trades: </span>
                    <span className="text-white font-medium">{supplierProfile.total_trades}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">Disputes: </span>
                    <DisputeBadge label={supplierProfile.dispute_rate} />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/profile/${selectedSupplier.id}`)}
                className="btn-ghost w-full text-center text-xs"
              >
                View Full Profile →
              </button>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-3">🤝</div>
              <p className="text-gray-500 text-sm">Select a supplier to preview their Trust Profile</p>
            </div>
          )}

          {/* Summary */}
          {form.amount && (
            <div className="card space-y-3 fade-in">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Summary</h3>
              <div className="space-y-2 text-sm">
                <Row label="Amount" value={`${form.currency} ${parseFloat(form.amount || 0).toLocaleString()}`} />
                <Row label="Delivery" value={`${form.delivery_days} days`} />
                <Row label="Release" value={RELEASE_CONDITIONS.find(r => r.value === form.release_condition)?.label} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}