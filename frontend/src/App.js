// FILE: frontend/src/App.js

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Landing from './pages/Landing';
import TrustProfile from './pages/TrustProfile';
import CreateTrade from './pages/CreateTrade';
import TradeDashboard from './pages/TradeDashboard';
import EscrowDeposit from './pages/EscrowDeposit';
import ShipmentUpload from './pages/ShipmentUpload';
import DeliveryConfirmation from './pages/DeliveryConfirmation';
import DisputeSubmission from './pages/DisputeSubmission';
import AIDisputeReview from './pages/AIDisputeReview';
import TrustScoreUpdate from './pages/TrustScoreUpdate';
import MyTrades from './pages/MyTrades';
import Navbar from './components/Navbar';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-brand-500 rounded-full dot-bounce" />
        <div className="w-2 h-2 bg-brand-500 rounded-full dot-bounce" />
        <div className="w-2 h-2 bg-brand-500 rounded-full dot-bounce" />
      </div>
    </div>
  );
  return user ? children : <Navigate to="/" />;
}

function AppLayout({ children }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-surface">
      {user && <Navbar />}
      <main className={user ? 'pt-16' : ''}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/profile/:userId" element={
              <PrivateRoute><TrustProfile /></PrivateRoute>
            } />
            <Route path="/trade/create" element={
              <PrivateRoute><CreateTrade /></PrivateRoute>
            } />
            <Route path="/trade/:tradeId" element={
              <PrivateRoute><TradeDashboard /></PrivateRoute>
            } />
            <Route path="/trade/:tradeId/deposit" element={
              <PrivateRoute><EscrowDeposit /></PrivateRoute>
            } />
            <Route path="/trade/:tradeId/shipment" element={
              <PrivateRoute><ShipmentUpload /></PrivateRoute>
            } />
            <Route path="/trade/:tradeId/confirm" element={
              <PrivateRoute><DeliveryConfirmation /></PrivateRoute>
            } />
            <Route path="/trade/:tradeId/dispute" element={
              <PrivateRoute><DisputeSubmission /></PrivateRoute>
            } />
            <Route path="/dispute/:disputeId/review" element={
              <PrivateRoute><AIDisputeReview /></PrivateRoute>
            } />
            <Route path="/trade/:tradeId/complete" element={
              <PrivateRoute><TrustScoreUpdate /></PrivateRoute>
            } />
            <Route path="/my-trades" element={
              <PrivateRoute><MyTrades /></PrivateRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}