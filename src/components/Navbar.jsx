// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await api.get("/api/wallet");
        setWallet(res.data.wallet || null);
      } catch (err) {
        console.error("Failed to fetch wallet summary", err);
      }
    };

    fetchWallet();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: '#ef4444',
      manager: '#3b82f6',
      sales_person: '#10b981',
      viewer: '#6b7280'
    };
    return colors[role] || '#6b7280';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      manager: 'Manager',
      sales_person: 'Sales',
      viewer: 'Viewer'
    };
    return labels[role] || role;
  };

  return (
    <header className="nav">
      <div className="nav-left">
        <div className="brand">iPauseAds</div>
        <button
          className="btn ghost"
          onClick={() => navigate("/dashboard")}
          style={{ marginLeft: 12 }}
        >
          📊 Dashboard
        </button>
        <button
          className="btn ghost"
          onClick={() => navigate("/spotlight")}
          style={{ marginLeft: 8 }}
        >
          🎯 Spotlight
        </button>
        <button
          className="btn ghost"
          onClick={() => navigate("/billing")}
          style={{ marginLeft: 8 }}
        >
          💳 Billing Center
        </button>
        <div className="wallet-button-container">
          <button
            className="btn ghost wallet-btn"
            onClick={() => navigate("/wallet-activity")}
            style={{ marginLeft: 8 }}
          >
            💰 Wallet
          </button>
          <div className="wallet-hover-popup">
            <h4>💰 Wallet</h4>
            <p><strong>Brand:</strong> {user?.brand || wallet?.brand || 'N/A'}</p>
            <p><strong>Balance:</strong> ${wallet?.balance != null ? Number(wallet.balance).toLocaleString() : '0.00'}</p>
            <p><strong>Daily Cap:</strong> ${wallet?.dailyCap != null ? Number(wallet.dailyCap).toLocaleString() : '0'}</p>
            <p><strong>Cost/Conv:</strong> ${wallet?.costPerConversion != null ? Number(wallet.costPerConversion).toFixed(2) : '5.00'}</p>
          </div>
        </div>
        {user?.role === 'admin' && (
          <>
            <button 
              className="btn ghost" 
              onClick={() => navigate("/user-management")}
              style={{ marginLeft: 8 }}
            >
              👥 User Management
            </button>
            <button 
              className="btn ghost" 
              onClick={() => navigate("/publisher-onboarding")}
              style={{ marginLeft: 8 }}
            >
              🔗 Publishers
            </button>
          </>
        )}
      </div>

      <div className="nav-right">
        <div className="user">
          {user?.fullName || 'User'}
          {user?.role && (
            <span 
              style={{
                marginLeft: 8,
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                color: '#fff',
                backgroundColor: getRoleBadgeColor(user.role)
              }}
            >
              {getRoleLabel(user.role)}
            </span>
          )}
        </div>
        <button className="btn" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
