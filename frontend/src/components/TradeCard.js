// FILE: frontend/src/components/TradeCard.js

import React from 'react';

const STATUS_CONFIG = {
  pending_acceptance: { label: 'Pending Acceptance', color: 'text-yellow-400', bg: 'bg-yellow-900/30', dot: 'bg-yellow-400', step: 0 },
  accepted:           { label: 'Accepted',           color: 'text-blue-400',   bg: 'bg-blue-900/30',   dot: 'bg-blue-400',   step: 1 },
  funded:             { label: 'Funded',              color: 'text-brand-400',  bg: 'bg-brand-900/30',  dot: 'bg-brand-400',  step: 2 },
  in_transit:         { label: 'In Transit',          color: 'text-purple-400', bg: 'bg-purple-900/30', dot: 'bg-purple-400', step: 3 },
  delivered:          { label: 'Delivered',           color: 'text-teal-400',   bg: 'bg-teal-900/30',   dot: 'bg-teal-400',   step: 4 },
  settled:            { label: 'Settled ✓',           color: 'text-green-400',  bg: 'bg-green-900/30',  dot: 'bg-green-400',  step: 5 },
  disputed:           { label: 'Disputed',            color: 'text-red-400',    bg: 'bg-red-900/30',    dot: 'bg-red-400',    step: -1 },
  refunded:           { label: 'Refunded',            color: 'text-gray-400',   bg: 'bg-gray-800',      dot: 'bg-gray-400',   step: -1 },
};

const STEPS = ['Funded', 'Awaiting Shipment', 'In Transit', 'Delivered', 'Settled'];

export default function TradeCard({ trade, buyer, supplier, escrow }) {
  const config = STATUS_CONFIG[trade.status] || STATUS_CONFIG['pending_acceptance'];
  const currentStep = config.step;

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-white text-lg">{trade.description}</h3>
          <p className="text-gray-500 text-sm mt-0.5">
            {trade.quantity} · Trade #{trade.id}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
          <div className={`w-2 h-2 rounded-full ${config.dot} pulse-soft`} />
          <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="flex gap-4">
        <div className="flex-1 bg-surface rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Trade Value</p>
          <p className="text-2xl font-bold text-white">
            {trade.currency} {trade.amount?.toLocaleString()}
          </p>
        </div>
        <div className="flex-1 bg-surface rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Escrow Status</p>
          <p className="text-lg font-semibold text-brand-400 capitalize">
            {escrow?.status?.replace(/_/g, ' ') || '—'}
          </p>
        </div>
      </div>

      {/* Parties */}
      <div className="flex items-center gap-3">
        <PartyChip role="Buyer" business={buyer} />
        <div className="flex-1 h-px bg-border relative">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
            <span className="text-xs text-gray-600 bg-panel px-2">→</span>
          </div>
        </div>
        <PartyChip role="Supplier" business={supplier} />
      </div>

      {/* Progress bar (for active trades only) */}
      {trade.status !== 'disputed' && trade.status !== 'refunded' && (
        <div>
          <div className="flex justify-between mb-2">
            {STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${i < currentStep ? 'bg-green-500 border-green-500 text-white' :
                    i === currentStep ? 'bg-brand-500 border-brand-500 text-white' :
                    'bg-surface border-border text-gray-600'}`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className={`text-xs text-center leading-tight hidden md:block
                  ${i <= currentStep ? 'text-gray-400' : 'text-gray-700'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tracking */}
      {trade.tracking_number && (
        <div className="bg-surface rounded-xl p-3 flex items-center gap-3">
          <span className="text-lg">📦</span>
          <div>
            <p className="text-xs text-gray-500">Tracking Number</p>
            <p className="text-sm font-mono text-brand-400">{trade.tracking_number}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PartyChip({ role, business }) {
  if (!business) return null;
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-400">
        {business.avatar_initials || business.business_name?.slice(0,2).toUpperCase()}
      </div>
      <div>
        <p className="text-xs text-gray-500">{role}</p>
        <p className="text-sm font-medium text-white leading-tight">{business.business_name}</p>
        <p className="text-xs text-gray-600">{business.location}</p>
      </div>
    </div>
  );
}