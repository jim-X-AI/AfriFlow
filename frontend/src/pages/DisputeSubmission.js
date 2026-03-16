// FILE: frontend/src/pages/DisputeSubmission.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

const DISPUTE_REASONS = [
  'Goods arrived damaged',
  'Goods not delivered',
  'Wrong goods received',
  'Goods do not match description',
  'Partial delivery only',
  'Quality significantly below agreed standard',
  'Other',
];

export default function DisputeSubmission() {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const [trade, setTrade] = useState(null);
  const [step, setStep] = useState(1);
  const [dispute, setDispute] = useState(null);
  const [form, setForm] = useState({ reason: '', description: '' });
  const [evidence, setEvidence] = useState({ evidence_type: 'text', content: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/trades/${tradeId}`).then(res => setTrade(res.data.trade));
  }, [tradeId]);

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/trades/${tradeId}/dispute`, form);
      setDispute(res.data.dispute);
      setStep(2);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to raise dispute.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/disputes/${dispute.id}/evidence`, evidence);
      setStep(3);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to submit evidence.');
    } finally {
      setLoading(false);
    }
  };

  if (!trade) return null;

  return (
    <div className="max-w-lg mx-auto px-6 py-8 fade-in space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <React.Fragment key={s}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${s < step ? 'bg-green-500 text-white' : s === step ? 'bg-brand-500 text-white' : 'bg-border text-gray-600'}`}>
              {s < step ? '✓' : s}
            </div>
            {s < 3 && <div className={`flex-1 h-px ${s < step ? 'bg-green-500' : 'bg-border'}`} />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <>
          <div>
            <h1 className="text-2xl font-bold text-white">Raise a Dispute</h1>
            <p className="text-gray-500 text-sm mt-1">Describe what went wrong with this trade.</p>
          </div>
          <form onSubmit={handleRaiseDispute} className="card space-y-4">
            <div>
              <label className="label">Reason</label>
              <select
                className="input"
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                required
              >
                <option value="">Select a reason...</option>
                {DISPUTE_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input resize-none"
                rows={4}
                placeholder="Describe the issue in detail. The more specific you are, the better the AI can assess your case."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                required
              />
            </div>
            <button type="submit" disabled={loading || !form.reason} className="btn-primary w-full text-center">
              {loading ? 'Submitting...' : 'Raise Dispute →'}
            </button>
          </form>
        </>
      )}

      {step === 2 && dispute && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-orange-400 text-sm font-medium bg-orange-900/30 px-2 py-0.5 rounded-full">Dispute #{dispute.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Submit Your Evidence</h1>
            <p className="text-gray-500 text-sm mt-1">
              The AI will read all evidence from both parties before making a finding.
            </p>
          </div>
          <form onSubmit={handleSubmitEvidence} className="card space-y-4">
            <div>
              <label className="label">Evidence Type</label>
              <select
                className="input"
                value={evidence.evidence_type}
                onChange={e => setEvidence(v => ({ ...v, evidence_type: e.target.value }))}
              >
                <option value="text">Written Description</option>
                <option value="tracking">Tracking Information</option>
                <option value="photo_description">Photo Description</option>
                <option value="communication">Communication Record</option>
              </select>
            </div>
            <div>
              <label className="label">Your Evidence</label>
              <textarea
                className="input resize-none"
                rows={5}
                placeholder={
                  evidence.evidence_type === 'tracking'
                    ? 'Paste tracking number and delivery status...'
                    : evidence.evidence_type === 'photo_description'
                    ? 'Describe what the photos show: condition of goods, packaging, visible damage...'
                    : 'Describe your evidence in detail. Include dates, amounts, specific items affected...'
                }
                value={evidence.content}
                onChange={e => setEvidence(v => ({ ...v, content: e.target.value }))}
                required
              />
            </div>
            <div className="border border-dashed border-border rounded-xl p-4 text-center text-gray-600 text-sm">
              📎 File upload available in production build
            </div>
            <button type="submit" disabled={loading || !evidence.content} className="btn-primary w-full text-center">
              {loading ? 'Submitting...' : 'Submit Evidence →'}
            </button>
          </form>
        </>
      )}

      {step === 3 && (
        <div className="card text-center space-y-5">
          <div className="text-5xl">⚖️</div>
          <h2 className="text-2xl font-bold text-white">Evidence Submitted</h2>
          <p className="text-gray-400 text-sm">
            The other party can now submit their evidence. Once both sides have submitted, the AI will analyze the case.
          </p>
          <div className="bg-surface rounded-xl p-4 text-sm text-gray-400 text-left">
            <p className="font-medium text-white mb-2">What happens next:</p>
            <ul className="space-y-1 text-xs">
              <li>• Other party submits their evidence</li>
              <li>• AI reads and analyzes all evidence</li>
              <li>• Confidence ≥85% → auto-resolved in minutes</li>
              <li>• Confidence &lt;85% → human arbitrator reviews</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(`/dispute/${dispute.id}/review`)} className="btn-primary flex-1 text-center">
              Run AI Review Now →
            </button>
            <button onClick={() => navigate(`/trade/${tradeId}`)} className="btn-secondary flex-1 text-center">
              Back to Trade
            </button>
          </div>
        </div>
      )}
    </div>
  );
}