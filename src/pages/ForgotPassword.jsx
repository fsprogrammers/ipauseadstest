// src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Video Background */}
      <video 
        className="auth-video-bg" 
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <div className="auth-video-overlay"></div>

      <div className="auth-card">
        <h1>Reset Password</h1>
        <p className="muted">
          {success 
            ? "Check your email for reset instructions" 
            : "Enter your email to receive password reset instructions"
          }
        </p>

        {error && <div className="alert">{error}</div>}

        {success ? (
          <div style={{ 
            background: '#d1fae5', 
            color: '#065f46', 
            padding: 16, 
            borderRadius: 8,
            marginTop: 16,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Email Sent!</div>
            <div style={{ fontSize: 14 }}>
              We've sent password reset instructions to <strong>{email}</strong>
            </div>
            <div style={{ fontSize: 13, marginTop: 8, opacity: 0.8 }}>
              Please check your inbox and spam folder.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
            <button className="btn primary" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="auth-footer" style={{ marginTop: 16 }}>
          <Link to="/login">← Back to Login</Link>
          {success && (
            <>
              <span> • </span>
              <Link to="/login">Try logging in</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
