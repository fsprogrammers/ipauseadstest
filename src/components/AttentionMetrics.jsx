import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './AttentionMetrics.css';

export default function AttentionMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [programBreakdown, setProgramBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [summaryRes, programsRes] = await Promise.all([
        api.get('/a2ar/attention-metrics/summary'),
        api.get('/a2ar/attention-metrics/by-program')
      ]);
      
      setMetrics(summaryRes.data);
      setProgramBreakdown(programsRes.data.programs || []);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to load attention metrics');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (label) => {
    const colors = {
      'Exceptional': '#4caf50',
      'Strong': '#66bb6a',
      'Average': '#ffa726',
      'Fair': '#ff7043',
      'Low': '#ef5350',
      'N/A': '#9e9e9e'
    };
    return colors[label] || '#9e9e9e';
  };

  const getTierBgColor = (label) => {
    const colors = {
      'Exceptional': 'rgba(76, 175, 80, 0.1)',
      'Strong': 'rgba(102, 187, 106, 0.1)',
      'Average': 'rgba(255, 167, 38, 0.1)',
      'Fair': 'rgba(255, 112, 67, 0.1)',
      'Low': 'rgba(239, 83, 80, 0.1)',
      'N/A': 'rgba(158, 158, 158, 0.1)'
    };
    return colors[label] || 'rgba(158, 158, 158, 0.1)';
  };

  if (loading) {
    return (
      <div className="attention-metrics">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading attention metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attention-metrics">
        <div className="error-state">
          <p>{error}</p>
          <button className="btn primary" onClick={fetchMetrics}>Retry</button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="attention-metrics">
      <header className="metrics-header">
        <h2>Attention Metrics Dashboard</h2>
        <p>Comprehensive viewer engagement analysis</p>
      </header>

      {/* Three Main Metrics - LEVELS ONLY (No percentages/seconds per client spec) */}
      <div className="metrics-grid">
        {/* A2AR Card - Level Only */}
        <div className="metric-card" style={{ borderTopColor: getTierColor(metrics.a2ar?.label) }}>
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>A2AR</h3>
            <p className="metric-subtitle">Attention-to-Action Rate</p>
            
            <div 
              className="metric-tier metric-level-badge-large"
              style={{ 
                backgroundColor: getTierColor(metrics.a2ar?.label),
                color: 'white'
              }}
            >
              Level {metrics.a2ar?.tier || 0}: {metrics.a2ar?.label || 'N/A'}
            </div>

            <div className="metric-tooltip">
              Measures conversion rate from ad exposure to QR scan
            </div>
          </div>
        </div>

        {/* ASV Card - Level Only */}
        <div className="metric-card" style={{ borderTopColor: getTierColor(metrics.asv?.label) }}>
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <h3>ASV</h3>
            <p className="metric-subtitle">Attention Scan Velocity</p>
            
            <div 
              className="metric-tier metric-level-badge-large"
              style={{ 
                backgroundColor: getTierColor(metrics.asv?.label),
                color: 'white'
              }}
            >
              Level {metrics.asv?.tier || 0}: {metrics.asv?.label || 'N/A'}
            </div>

            <div className="metric-tooltip">
              Measures response speed. Faster scanning indicates stronger attention.
            </div>
          </div>
        </div>

        {/* ACI Card - Level Only */}
        <div className="metric-card" style={{ borderTopColor: getTierColor(metrics.aci?.label) }}>
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <h3>ACI</h3>
            <p className="metric-subtitle">Attention Composite Index</p>
            
            <div 
              className="metric-tier metric-level-badge-large"
              style={{ 
                backgroundColor: getTierColor(metrics.aci?.label),
                color: 'white'
              }}
            >
              Level {metrics.aci?.level || 0}: {metrics.aci?.label || 'N/A'}
            </div>

            <div className="metric-tooltip">
              Combined attention performance score based on A2AR and ASV
            </div>
          </div>
        </div>
      </div>

      {/* Tier Reference Tables */}
      <div className="tier-tables">
        <div className="tier-table-section">
          <h3>A2AR Tier Reference</h3>
          <table className="tier-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Label</th>
                <th>Range</th>
              </tr>
            </thead>
            <tbody>
              <tr className={metrics.a2ar?.tier === 1 ? 'active' : ''}>
                <td>1</td>
                <td>Low</td>
                <td>0.2% - 0.4%</td>
              </tr>
              <tr className={metrics.a2ar?.tier === 2 ? 'active' : ''}>
                <td>2</td>
                <td>Fair</td>
                <td>0.5% - 0.7%</td>
              </tr>
              <tr className={metrics.a2ar?.tier === 3 ? 'active' : ''}>
                <td>3</td>
                <td>Average</td>
                <td>0.8% - 1.5%</td>
              </tr>
              <tr className={metrics.a2ar?.tier === 4 ? 'active' : ''}>
                <td>4</td>
                <td>Strong</td>
                <td>1.6% - 2.5%</td>
              </tr>
              <tr className={metrics.a2ar?.tier === 5 ? 'active' : ''}>
                <td>5</td>
                <td>Exceptional</td>
                <td>2.6%+</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="tier-table-section">
          <h3>ASV Tier Reference</h3>
          <table className="tier-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Label</th>
                <th>Range</th>
              </tr>
            </thead>
            <tbody>
              <tr className={metrics.asv?.tier === 1 ? 'active' : ''}>
                <td>1</td>
                <td>Low</td>
                <td>&gt; 40 sec</td>
              </tr>
              <tr className={metrics.asv?.tier === 2 ? 'active' : ''}>
                <td>2</td>
                <td>Fair</td>
                <td>20-40 sec</td>
              </tr>
              <tr className={metrics.asv?.tier === 3 ? 'active' : ''}>
                <td>3</td>
                <td>Average</td>
                <td>10-20 sec</td>
              </tr>
              <tr className={metrics.asv?.tier === 4 ? 'active' : ''}>
                <td>4</td>
                <td>Strong</td>
                <td>5-10 sec</td>
              </tr>
              <tr className={metrics.asv?.tier === 5 ? 'active' : ''}>
                <td>5</td>
                <td>Exceptional</td>
                <td>&lt; 5 sec</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="tier-table-section">
          <h3>ACI Level Reference</h3>
          <table className="tier-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Label</th>
                <th>Range</th>
              </tr>
            </thead>
            <tbody>
              <tr className={metrics.aci?.level === 1 ? 'active' : ''}>
                <td>1</td>
                <td>Low</td>
                <td>2-3</td>
              </tr>
              <tr className={metrics.aci?.level === 2 ? 'active' : ''}>
                <td>2</td>
                <td>Fair</td>
                <td>4-5</td>
              </tr>
              <tr className={metrics.aci?.level === 3 ? 'active' : ''}>
                <td>3</td>
                <td>Average</td>
                <td>6-7</td>
              </tr>
              <tr className={metrics.aci?.level === 4 ? 'active' : ''}>
                <td>4</td>
                <td>Strong</td>
                <td>8-9</td>
              </tr>
              <tr className={metrics.aci?.level === 5 ? 'active' : ''}>
                <td>5</td>
                <td>Exceptional</td>
                <td>9-10</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Program Breakdown - LEVELS ONLY (No percentages/seconds per client spec) */}
      {programBreakdown.length > 0 && (
        <div className="program-breakdown">
          <h3>Performance by Program</h3>
          <div className="program-table-container">
            <table className="program-table">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Publisher</th>
                  <th>A2AR</th>
                  <th>ASV</th>
                  <th>ACI</th>
                </tr>
              </thead>
              <tbody>
                {programBreakdown.map((program, index) => (
                  <tr key={index}>
                    <td><strong>{program.programTitle}</strong></td>
                    <td>{program.publisher}</td>
                    <td>
                      <span 
                        className="tier-badge"
                        style={{ backgroundColor: getTierColor(program.a2arLabel) }}
                      >
                        Level {program.a2arTier}: {program.a2arLabel}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="tier-badge"
                        style={{ backgroundColor: getTierColor(program.asvLabel) }}
                      >
                        Level {program.asvTier || 0}: {program.asvLabel || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="tier-badge"
                        style={{ backgroundColor: getTierColor(program.aciLabel) }}
                      >
                        Level {program.aciLevel || 0}: {program.aciLabel || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
