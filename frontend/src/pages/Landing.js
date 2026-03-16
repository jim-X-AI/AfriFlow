// FILE: frontend/src/pages/Landing.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  if (user) {
    navigate('/my-trades');
    return null;
  }

  const handleDemoLogin = async (email) => {
    setLoading(true);
    setError('');
    try {
      await login(email, 'demo1234');
      navigate('/my-trades');
    } catch (e) {
      setError('Demo login failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/my-trades');
    } catch (e) {
      setError('Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Nav */}
      <nav className="px-8 py-5 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">AF</span>
          </div>
          <span className="font-bold text-white text-xl">AfriFlow</span>
        </div>
        <span className="text-xs text-gray-600 border border-border px-3 py-1 rounded-full">
          Hackathon POC
        </span>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left — Hero */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-20 py-16">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 w-fit mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 pulse-soft" />
            <span className="text-brand-400 text-xs font-medium">Pan-African Trade Trust Infrastructure</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Trade with confidence<br />
            <span className="text-brand-500">across Africa.</span>
          </h1>

          <p className="text-gray-400 text-lg max-w-xl leading-relaxed mb-12">
            AfriFlow is the trust layer for African cross-border commerce.
            Verified identities. Protected escrow. AI-powered reputation that compounds with every trade.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mb-12">
            {[
              { icon: '🔐', label: 'Smart Escrow' },
              { icon: '🤖', label: 'AI Dispute Resolution' },
              { icon: '📊', label: 'Trust Score Engine' },
              { icon: '🌍', label: 'Cross-Border Ready' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 bg-panel border border-border rounded-full px-4 py-2 text-sm text-gray-300">
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-8">
            {[
              { value: '$145T', label: 'Informal B2B market' },
              { value: '$120B', label: 'Trade finance gap' },
              { value: '54', label: 'African countries' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-brand-400">{s.value}</p>
                <p className="text-xs text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Login */}
        <div className="lg:w-[480px] flex items-center justify-center px-8 py-16">
          <div className="w-full max-w-md space-y-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">Demo Login</h2>
              <p className="text-gray-500 text-sm mt-1">Choose a role to experience the full trade flow</p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Amaka */}
            <button
              onClick={() => handleDemoLogin('amaka@amakaclothing.ng')}
              disabled={loading}
              className="w-full bg-panel border border-border hover:border-brand-500 rounded-2xl p-5 text-left transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-lg">
                  AC
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">Amaka Clothing Co.</p>
                    <span className="text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full">Buyer</span>
                  </div>
                  <p className="text-sm text-gray-500">Lagos, Nigeria · Textile & Fashion Retail</p>
                  <p className="text-xs text-gray-600 mt-0.5">amaka@amakaclothing.ng</p>
                </div>
                <div className="text-gray-600 group-hover:text-brand-400 transition-colors text-xl">→</div>
              </div>
            </button>

            {/* Kwame */}
            <button
              onClick={() => handleDemoLogin('kwame@kwametextiles.gh')}
              disabled={loading}
              className="w-full bg-panel border border-border hover:border-brand-500 rounded-2xl p-5 text-left transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-lg">
                  KA
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">Kwame Asante Textiles</p>
                    <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">Supplier</span>
                  </div>
                  <p className="text-sm text-gray-500">Accra, Ghana · Fabric & Textile Supply</p>
                  <p className="text-xs text-gray-600 mt-0.5">kwame@kwametextiles.gh</p>
                </div>
                <div className="text-gray-600 group-hover:text-brand-400 transition-colors text-xl">→</div>
              </div>
            </button>

            {loading && (
              <div className="flex justify-center py-2">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-brand-500 rounded-full dot-bounce" />
                  <div className="w-2 h-2 bg-brand-500 rounded-full dot-bounce" />
                  <div className="w-2 h-2 bg-brand-500 rounded-full dot-bounce" />
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => setShowManual(!showManual)}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                {showManual ? 'Hide' : 'Manual login'}
              </button>
            </div>

            {showManual && (
              <form onSubmit={handleManualLogin} className="card space-y-4">
                <input
                  className="input"
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Password"
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button type="submit" className="btn-primary w-full text-center" disabled={loading}>
                  Login
                </button>
              </form>
            )}

            <p className="text-center text-xs text-gray-700">
              Password for both accounts: <span className="font-mono text-gray-500">demo1234</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}