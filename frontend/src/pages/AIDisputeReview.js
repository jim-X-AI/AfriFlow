// FILE: frontend/src/pages/AIDisputeReview.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

const ANALYSIS_STEPS = [
  { key: 'terms', label: 'Reading trade agreement terms' },
  { key: 'buyer', label: 'Reviewing buyer evidence' },
  { key: 'supplier', label: 'Reviewing supplier evidence' },
  { key: 'history', label: 'Checking similar dispute history' },
  { key: 'profiles', label: 'Evaluating trust profiles' },
  { key: 'confidence', label: 'Computing confidence score' },
];

export default function AIDisputeReview() {
  const { disputeId } = useParams();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [analysing, setAnalysing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [result, setResult] = useState(null);
  const [tradeId, setTradeId] = useState(null);

  useEffect(() => {
    api.get(`/disputes/${disputeId}`).then(res => {
      setDispute(res.data.dispute);
      setEvidence(res.data.evidence);
      setTradeId(res.data.dispute.trade_id);
      if (res.data.dispute.ai_confidence) {
        setResult({
          confidence: res.data.dispute.ai_confidence,
          finding: res.data.dispute.ai_finding,
          recommendation: res.data.dispute.ai_recommendation,
          resolution_type: res.data.dispute.ai_resolution_type,
        });
      }
    });
  }, [disputeId]);

  const runReview = async () => {
    setAnalysing(true);
    setCurrentStep(0);

    // Animate through analysis steps
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setCurrentStep(i);
      await delay(600 + Math.random() * 400);
    }

    try {
      const res = await api.post(`/disputes/${disputeId}/review`);
      setResult(res.data.ai_result);
      setDispute(res.data.dispute);
    } catch (e) {
      alert('AI review failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setAnalysing(false);
      setCurrentStep(ANALYSIS_STEPS.length);
    }
  };

  if (!dispute) return null;

  const isAutoResolved = result && result.confidence >= 85;
  const resolutionColor = result?.resolution_type === 'release_to_supplier'
    ? 'text-green-400' : result?.resolution_type === 'refund_to_buyer'
    ? 'text-blue-400' : 'text-yellow-400';

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 fade-in space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-red-400 bg-red-900/30 px-2 py-0.5 rounded-full">
            Dispute #{dispute.id}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">AI Dispute Review</h1>
        <p className="text-gray-500 text-sm mt-1">
          AI reads all evidence and produces a confidence-rated finding.
        </p>
      </div>

      {/* Dispute summary */}
      <div className="card space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Dispute Reason</p>
        <p className="font-medium text-white">{dispute.reason}</p>
        {dispute.description && (
          <p className="text-sm text-gray-400">{dispute.description}</p>
        )}
      </div>

      {/* Evidence submitted */}
      {evidence.length > 0 && (
        <div className="card space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Evidence Submitted ({evidence.length})</p>
          {evidence.map((e, i) => (
            <div key={i} className="bg-surface rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-brand-400 bg-brand-900/20 px-2 py-0.5 rounded-full">
                  Party {e.submitted_by === dispute.raised_by ? 'Disputing' : 'Responding'}
                </span>
                <span className="text-xs text-gray-600 capitalize">{e.evidence_type?.replace(/_/g, ' ')}</span>
              </div>
              <p className="text-sm text-gray-300">{e.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* AI Analysis */}
      {!result && (
        <div className="card space-y-5">
          {!analysing ? (
            <div className="text-center space-y-4 py-4">
              <div className="text-5xl">🤖</div>
              <div>
                <h3 className="font-semibold text-white">AI Arbitrator Ready</h3>
                <p className="text-gray-500 text-sm mt-1">
                  The AI will read all evidence, compare trust profiles, and issue a confidence-rated finding.
                </p>
              </div>
              <button onClick={runReview} className="btn-primary px-8">
                Run AI Analysis →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-brand-500 rounded-full dot-bounce" />
                  <div className="w-2 h-2 bg-brand-500 rounded-full dot-bounce" />
                  <div className="w-2 h-2 bg-brand-500 rounded-full dot-bounce" />
                </div>
                <span className="text-brand-400 font-medium text-sm">AI Reviewing Dispute...</span>
              </div>
              <div className="space-y-2">
                {ANALYSIS_STEPS.map((step, i) => (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0
                      ${i < currentStep ? 'bg-green-500 text-white' :
                        i === currentStep ? 'bg-brand-500 text-white pulse-soft' :
                        'bg-border text-gray-600'}`}>
                      {i < currentStep ? '✓' : i === currentStep ? '•' : ''}
                    </div>
                    <span className={`text-sm transition-colors
                      ${i < currentStep ? 'text-green-400' :
                        i === currentStep ? 'text-white' : 'text-gray-600'}`}>
                      {step.label}
                    </span>
                    {i < currentStep && (
                      <span className="text-xs text-green-600 ml-auto">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`card space-y-5 fade-in ${isAutoResolved ? 'border-green-800/40' : 'border-yellow-800/40'}`}>
          {/* Confidence */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">AI Confidence</p>
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-bold ${isAutoResolved ? 'text-green-400' : 'text-yellow-400'}`}>
                  {result.confidence}%
                </span>
                <span className={`status-badge text-xs ${isAutoResolved
                  ? 'bg-green-900/40 text-green-400'
                  : 'bg-yellow-900/40 text-yellow-400'}`}>
                  {isAutoResolved ? 'AUTO-RESOLVED ✓' : 'ESCALATED TO HUMAN'}
                </span>
              </div>
            </div>
            <div className="w-20 h-20">
              <ConfidenceRing value={result.confidence} />
            </div>
          </div>

          {/* Confidence bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>0%</span>
              <span className="text-yellow-600">85% threshold</span>
              <span>100%</span>
            </div>
            <div className="h-3 bg-surface rounded-full relative overflow-hidden">
              <div
                className={`h-full rounded-full progress-fill ${result.confidence >= 85 ? 'bg-green-500' : 'bg-yellow-500'}`}
                style={{ width: `${result.confidence}%` }}
              />
              <div className="absolute top-0 bottom-0 w-px bg-yellow-600/50" style={{ left: '85%' }} />
            </div>
          </div>

          {/* Finding */}
          <div className="bg-surface rounded-xl p-4 space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide">AI Finding</p>
            <p className="text-sm text-gray-200 leading-relaxed">{result.finding}</p>
          </div>

          {/* Recommendation */}
          <div className="bg-surface rounded-xl p-4 space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Recommendation</p>
            <p className={`font-semibold ${resolutionColor}`}>
              {result.recommendation}
            </p>
          </div>

          {/* Resolution type */}
          <div className="flex items-center gap-3 p-4 bg-surface rounded-xl">
            <span className="text-2xl">
              {result.resolution_type === 'release_to_supplier' ? '💰' :
               result.resolution_type === 'refund_to_buyer' ? '↩️' : '👤'}
            </span>
            <div>
              <p className="text-xs text-gray-500">Resolution</p>
              <p className={`font-semibold capitalize ${resolutionColor}`}>
                {result.resolution_type?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {/* Reasoning steps */}
          {result.reasoning_steps?.length > 0 && (
            <details className="group">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 transition-colors">
                View AI reasoning steps ({result.reasoning_steps.length})
              </summary>
              <div className="mt-3 space-y-2">
                {result.reasoning_steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                    <span className="text-brand-600 mt-0.5 flex-shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          <button onClick={() => navigate(`/trade/${tradeId}`)} className="btn-primary w-full text-center">
            Back to Trade →
          </button>
        </div>
      )}
    </div>
  );
}

function ConfidenceRing({ value }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 85 ? '#22c55e' : value >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
      <circle cx="40" cy="40" r={radius} fill="none" stroke="#2a2d3e" strokeWidth="7" />
      <circle
        cx="40" cy="40" r={radius}
        fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
      />
    </svg>
  );
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}