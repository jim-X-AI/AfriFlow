// FILE: frontend/src/components/TrustScoreBar.js

import React from 'react';

export function ScoreRing({ score, size = 100 }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#2a2d3e" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white leading-none">{Math.round(score)}</span>
        <span className="text-xs text-gray-500">/ 100</span>
      </div>
    </div>
  );
}

export function MetricBar({ label, value, max = 100, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const pct = Math.min(100, (value / max) * 100);
  const barColor = value >= 80 ? colors.green : value >= 60 ? colors.yellow : colors.red;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} progress-fill`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function DisputeBadge({ label }) {
  const colors = {
    None: 'bg-green-900/40 text-green-400',
    'Very Low': 'bg-green-900/40 text-green-400',
    Low: 'bg-yellow-900/40 text-yellow-400',
    Medium: 'bg-orange-900/40 text-orange-400',
    High: 'bg-red-900/40 text-red-400',
  };

  return (
    <span className={`status-badge ${colors[label] || colors['Medium']}`}>
      {label}
    </span>
  );
}

export function CorridorBadge({ label }) {
  const colors = {
    None: 'bg-gray-800 text-gray-400',
    Emerging: 'bg-blue-900/40 text-blue-400',
    Growing: 'bg-brand-900/40 text-brand-400',
    Medium: 'bg-brand-800/40 text-brand-300',
    Experienced: 'bg-purple-900/40 text-purple-400',
  };

  return (
    <span className={`status-badge ${colors[label] || colors['Medium']}`}>
      {label}
    </span>
  );
}