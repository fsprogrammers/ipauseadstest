// src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const res = await api.post("/auth/register", { fullName, email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (error) {
      setErr(error.response?.data?.error || error.response?.data?.message || "Registration failed");
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
        <h1>Create account</h1>
        <p className="muted">Get access to the analytics dashboard</p>

        {err && <div className="alert">{err}</div>}

        <form onSubmit={submit} className="auth-form">
          <label>Full name</label>
          <input value={fullName} onChange={(e)=>setFullName(e.target.value)} placeholder="Jane Doe" required minLength={3} />
          <label>Email</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@company.com" type="email" required />
          <label>Password</label>
          <div className="password-input-wrapper">
            <input 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              placeholder="Choose a password" 
              type={showPassword ? "text" : "password"} 
              required 
              minLength={8} 
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              )}
            </button>
          </div>
          <button className="btn primary" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
        </form>

        <div className="auth-footer">
          <Link to="/login">Already registered? Sign in</Link>
        </div>
      </div>
    </div>
  );
}
