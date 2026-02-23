import React from 'react';
import { Link } from 'react-router-dom';
import './BillingCenter.css';

export default function BillingCenter() {
  return (
    <div className="billing-center-empty">
      <div className="empty-state">
        <div className="construction-icon">🚧</div>
        <h1>Coming Soon</h1>
        <p>We are working on this feature.</p>
        <p>Currently not available.</p>
        <Link to="/dashboard" className="btn primary">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
