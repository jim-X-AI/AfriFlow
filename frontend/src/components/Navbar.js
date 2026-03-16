// FILE: frontend/src/components/Navbar.js

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-panel border-b border-border h-16 flex items-center px-6">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/my-trades" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">AF</span>
          </div>
          <span className="font-bold text-white text-lg">AfriFlow</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-6">
          <Link to="/my-trades" className="text-gray-400 hover:text-white text-sm transition-colors">
            My Trades
          </Link>
          <Link to="/trade/create" className="text-gray-400 hover:text-white text-sm transition-colors">
            New Trade
          </Link>
          {user && (
            <Link to={`/profile/${user.id}`} className="text-gray-400 hover:text-white text-sm transition-colors">
              My Profile
            </Link>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold text-white">
                  {user.avatar_initials || user.business_name?.slice(0,2).toUpperCase()}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white leading-none">{user.business_name}</p>
                  <p className="text-xs text-gray-500">{user.location}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-border"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}