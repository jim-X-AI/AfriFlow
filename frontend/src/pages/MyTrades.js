// FILE: frontend/src/pages/MyTrades.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { ScoreRing } from '../components/TrustScoreBar';

const STATUS_CONFIG = {
  pending_acceptance: { color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  accepted:           { color: 'text-blue-400',   bg: 'bg-blue-900/20'   },
  funded:             { color: 'text-brand-400',  bg: 'bg-brand-900/20'  },
  in_transit:         { color: 'text-purple-400', bg: 'bg-purple-900/20' },
  delivered:          { color: 'text-teal-400',   bg: 'bg-teal-900/20'   },
  settled:            { color: 'text-green-400',  bg: 'bg-green-900/20'  },
  disputed:           { color: 'text-red-400',    bg: 'bg-red-900/20'    },
  refunded:           { color: 'text-gray-400',   bg: 'bg-gray-800'      },
};

export default function MyTrades() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState({ as_buyer: [], as_supplier: [] });
  const [trust, setTrust] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/trades/my'),
      user && api.get(`/trust/${user.id}`),
      api.get('/profile/all'),
    ]).then(([t, s, u]) => {
      setTrades(t.data);
      if (s) setTrust(s.data);
      setUsers(u.data.users);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  const allTrades = [
    ...trades.as_buyer.map(t => ({ ...t, role: 'buyer' })),
    ...trades.as_supplier.map(t => ({ ...t, role: 'supplier' })),
  ].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  if (loading) return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-4">
      {[1,2,3].map(i => <div key={i} className="card h-20 animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6 fade-in">
      {/* Welcome + Score */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">{user?.business_name} · {user?.location}</p>
            <p className="text-xs text-gray-600 mt-1 font-mono">{user?.trade_id}</p>
          </div>
          {trust && (
            <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/profile/${user?.id}`)}>
              <div className="text-right">
                <p className="text-xs text-gray-500">Your Trust Score</p>
                <p className="text-xs text-gray-600">{trust.total_trades} trades completed</p>
              </div>
              <ScoreRing score={trust.overall_score} size={70} />
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction icon="📝" label="New Trade" onClick={() => navigate('/trade/create')} primary />
        <QuickAction icon="👤" label="My Profile" onClick={() => navigate(`/profile/${user?.id}`)} />
        {users.slice(0,2).map(u => (
          <QuickAction
            key={u.user.id}
            icon={u.user.avatar_initials}
            label={`View ${u.user.business_name.split(' ')[0]}`}
            onClick={() => navigate(`/profile/${u.user.id}`)}
            isInitials
          />
        ))}
      </div>

      {/* Trades */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Your Trades</h2>
          <span className="text-xs text-gray-600">{allTrades.length} total</span>
        </div>

        {allTrades.length === 0 ? (
          <div className="card text-center py-12 space-y-3">
            <div className="text-5xl">🤝</div>
            <p className="text-gray-400">No trades yet.</p>
            <button onClick={() => navigate('/trade/create')} className="btn-primary mx-auto">
              Start Your First Trade →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {allTrades.map(trade => (
              <TradeRow key={`${trade.role}-${trade.id}`} trade={trade} onClick={() => navigate(`/trade/${trade.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TradeRow({ trade, onClick }) {
  const cfg = STATUS_CONFIG[trade.status] || STATUS_CONFIG.pending_acceptance;
  return (
    <button onClick={onClick} className="w-full card hover:border-gray-600 transition-all text-left">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-white truncate">{trade.description}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
              {trade.status?.replace(/_/g, ' ')}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
              trade.role === 'buyer' ? 'bg-blue-900/30 text-blue-400' : 'bg-green-900/30 text-green-400'
            }`}>
              {trade.role}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{trade.quantity}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <p className="font-semibold text-white">{trade.currency} {trade.amount?.toLocaleString()}</p>
          <p className="text-xs text-gray-600">
            {new Date(trade.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>
    </button>
  );
}

function QuickAction({ icon, label, onClick, primary, isInitials }) {
  return (
    <button
      onClick={onClick}
      className={`card flex flex-col items-center justify-center py-4 gap-2 hover:border-brand-500/50 transition-all
        ${primary ? 'border-brand-500/30 bg-brand-900/10' : ''}`}
    >
      <div className={`text-xl ${isInitials ? 'w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm' : ''}`}>
        {icon}
      </div>
      <span className="text-xs text-gray-400">{label}</span>
    </button>
  );
}