// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import BillingCenter from "./pages/BillingCenter";
import WalletActivity from "./pages/WalletActivity";
import SpotlightDashboard from "./pages/SpotlightDashboard";
import PublisherOnboarding from "./pages/PublisherOnboarding";
import QRLanding from "./pages/QRLanding";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* QR Landing Page - Public, no auth required */}
        <Route path="/qr/:qrId" element={<QRLanding />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div className="app-shell">
              <Navbar />
              <Dashboard />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/billing" element={
          <ProtectedRoute>
            <div className="app-shell">
              <Navbar />
              <BillingCenter />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/wallet-activity" element={
          <ProtectedRoute>
            <div className="app-shell">
              <Navbar />
              <WalletActivity />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/spotlight" element={
          <ProtectedRoute>
            <div className="app-shell">
              <Navbar />
              <SpotlightDashboard />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/user-management" element={
          <ProtectedRoute>
            <div className="app-shell">
              <Navbar />
              <UserManagement />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/publisher-onboarding" element={
          <ProtectedRoute>
            <div className="app-shell">
              <Navbar />
              <PublisherOnboarding />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
