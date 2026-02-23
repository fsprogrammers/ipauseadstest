// src/pages/SpotlightDashboard.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './SpotlightDashboard.css';

export default function SpotlightDashboard() {
  const [pauseMoments, setPauseMoments] = useState([]);
  const [a2arMetrics, setA2arMetrics] = useState(null);
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    publisher: '',
    contentType: '',
    converted: ''
  });
  const [publishers, setPublishers] = useState([]);

  useEffect(() => {
    fetchSpotlightData();
    fetchPublishers();
  }, []);

  const fetchSpotlightData = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (filters.publisher) params.append('publisher', filters.publisher);
      if (filters.contentType) params.append('contentType', filters.contentType);
      if (filters.converted) params.append('converted', filters.converted);

      const [momentsRes, a2arRes] = await Promise.all([
        api.get(`/api/pause/moments?${params.toString()}`),
        api.get('/api/a2ar/summary')
      ]);

      setPauseMoments(momentsRes.data.moments || []);
      setA2arMetrics(a2arRes.data);
    } catch (error) {
      console.error('Error fetching spotlight data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublishers = async () => {
    try {
      const res = await api.get('/api/pause/publishers');
      setPublishers(res.data.publishers || []);
    } catch (error) {
      console.error('Error fetching publishers:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchSpotlightData();
  };

  const generateTestData = async () => {
    try {
      const res = await api.post('/api/pause/test');
      alert(res.data.message || 'Test data generated!');
      fetchSpotlightData();
      fetchPublishers();
    } catch (error) {
      console.error('Error generating test data:', error);
      alert('Failed to generate test data');
    }
  };

  const formatPlaybackTime = (ms) => {
    if (!ms) return '--:--';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getA2ARColor = (label) => {
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

  if (loading) {
    return (
      <div className="spotlight-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading Spotlight...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="spotlight-dashboard">
      <header className="spotlight-header">
        <div>
          <h1>📺 Spotlight - Pause Moments</h1>
          <p>Verified pause events and A2AR tracking</p>
        </div>
        <div className="header-actions">
          <button onClick={generateTestData} className="btn secondary">
            🧪 Generate Test Data
          </button>
          <button onClick={fetchSpotlightData} className="btn secondary">
            ↻ Refresh
          </button>
        </div>
      </header>

      {/* A2AR Metrics Section */}
      <div className="a2ar-section">
        <h2>Attention-to-Action Rate (A2AR)</h2>

        <div className="a2ar-metrics-grid">
          <div className="a2ar-metric-card">
            <label>Pause Opportunities</label>
            <div className="metric-value">{a2arMetrics?.a2ar?.pauseOpportunities || 0}</div>
            <p className="metric-description">Total verified pause events</p>
          </div>

          <div className="a2ar-metric-card">
            <label>QR Scans</label>
            <div className="metric-value">{a2arMetrics?.a2ar?.qrDownloads || 0}</div>
            <p className="metric-description">Pauses that led to scans</p>
          </div>

          <div className="a2ar-metric-card">
            <label>Verified Conversions</label>
            <div className="metric-value">{a2arMetrics?.a2ar?.qrDownloads || 0}</div>
            <p className="metric-description">Pauses that led to conversions</p>
          </div>

          <div className="a2ar-metric-card highlight">
            <label>A2AR</label>
            <div className="metric-value large" style={{ color: getA2ARColor(a2arMetrics?.a2ar?.label) }}>
              {a2arMetrics?.a2ar?.percentage || '0.00'}%
            </div>
            <div className="tier-badge" style={{ background: getA2ARColor(a2arMetrics?.a2ar?.label) }}>
              {a2arMetrics?.a2ar?.label || 'Low'}
            </div>
          </div>
        </div>

        {/* A2AR Tier Chart */}
        <div className="a2ar-tier-chart">
          <h3>Industry Benchmark</h3>
          <table className="tier-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>A2AR %</th>
                <th>Industry Interpretation</th>
              </tr>
            </thead>
            <tbody>
              <tr className={a2arMetrics?.a2ar?.label === 'Low' ? 'active-tier' : ''}>
                <td>1. Low</td>
                <td>0.2% – 0.4%</td>
                <td>Below standard CTV response</td>
              </tr>
              <tr className={a2arMetrics?.a2ar?.label === 'Fair' ? 'active-tier' : ''}>
                <td>2. Fair</td>
                <td>0.5% – 0.7%</td>
                <td>Matches typical QR CTV ads</td>
              </tr>
              <tr className={a2arMetrics?.a2ar?.label === 'Average' ? 'active-tier' : ''}>
                <td>3. Average</td>
                <td>0.8% – 1.5%</td>
                <td>Healthy baseline</td>
              </tr>
              <tr className={a2arMetrics?.a2ar?.label === 'Strong' ? 'active-tier' : ''}>
                <td>4. Strong</td>
                <td>1.6% – 2.5%</td>
                <td>Clear advantage</td>
              </tr>
              <tr className={a2arMetrics?.a2ar?.label === 'Exceptional' ? 'active-tier' : ''}>
                <td>5. Exceptional</td>
                <td>2.6%+</td>
                <td>Rare, premium, context-perfect</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-row">
          <div className="filter-group">
            <label>Publisher</label>
            <select
              value={filters.publisher}
              onChange={(e) => handleFilterChange('publisher', e.target.value)}
            >
              <option value="">All Publishers</option>
              {publishers.map((pub) => (
                <option key={pub} value={pub}>{pub}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Content Type</label>
            <select
              value={filters.contentType}
              onChange={(e) => handleFilterChange('contentType', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="on-demand">On-Demand</option>
              <option value="live">Live TV</option>
              <option value="vod">VOD</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Conversion Status</label>
            <select
              value={filters.converted}
              onChange={(e) => handleFilterChange('converted', e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Converted</option>
              <option value="false">Not Converted</option>
            </select>
          </div>

          <button className="btn primary" onClick={applyFilters}>
            Apply Filters
          </button>
        </div>
      </div>

      {/* Pause Moment Cards */}
      <div className="moment-cards-section">
        <h2>Pause Moments ({pauseMoments.length} total)</h2>

        <div className="moment-cards-grid">
          {pauseMoments.length === 0 ? (
            <div className="empty-state">
              <p>No pause moments recorded yet.</p>
              <p>Moments will appear here when viewers pause content.</p>
              <button className="btn primary" onClick={generateTestData}>
                Generate Test Data
              </button>
            </div>
          ) : (
            pauseMoments.map((moment) => (
              <div
                key={moment._id}
                className={`moment-card ${moment.conversionOccurred ? 'converted' : ''}`}
                onClick={() => setSelectedMoment(moment)}
              >
                <div className="moment-header">
                  <span className="publisher-badge">{moment.publisher}</span>
                  {moment.conversionOccurred && (
                    <span className="conversion-badge">✓ Converted</span>
                  )}
                </div>

                <h3 className="program-title">{moment.programTitle}</h3>

                {(moment.season || moment.episode) && (
                  <p className="episode-info">
                    S{moment.season} E{moment.episode}
                    {moment.episodeTitle && ` - ${moment.episodeTitle}`}
                  </p>
                )}

                <div className="moment-metadata">
                  <div className="metadata-item">
                    <span className="label">⏰ Paused At:</span>
                    <span className="value">
                      {new Date(moment.pauseTimestamp).toLocaleString()}
                    </span>
                  </div>

                  {moment.playbackPositionMs && (
                    <div className="metadata-item">
                      <span className="label">📍 Position:</span>
                      <span className="value">
                        {formatPlaybackTime(moment.playbackPositionMs)}
                        {moment.playbackPercentage && ` (${moment.playbackPercentage}%)`}
                      </span>
                    </div>
                  )}

                  {moment.contentType && (
                    <div className="metadata-item">
                      <span className="label">📺 Type:</span>
                      <span className="value">
                        {moment.contentType === 'live' ? 'Live TV' : 'On-Demand'}
                      </span>
                    </div>
                  )}

                  {moment.genre && (
                    <div className="metadata-item">
                      <span className="label">🎭 Genre:</span>
                      <span className="value">{moment.genre}</span>
                    </div>
                  )}

                  {moment.rating && (
                    <div className="metadata-item">
                      <span className="label">🔞 Rating:</span>
                      <span className="value">{moment.rating}</span>
                    </div>
                  )}

                  {moment.platform && (
                    <div className="metadata-item">
                      <span className="label">📱 Platform:</span>
                      <span className="value">{moment.platform}</span>
                    </div>
                  )}
                </div>

                <div className="moment-footer">
                  <span className="session-id">
                    Session: {moment.sessionId?.substring(0, 16)}...
                  </span>
                  <button className="btn-view-details">View Details →</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Moment Details Modal */}
      {selectedMoment && (
        <div className="modal-overlay" onClick={() => setSelectedMoment(null)}>
          <div className="modal-content moment-detail-modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div>
                <h2>{selectedMoment.programTitle}</h2>
                <p>{selectedMoment.publisher} • {selectedMoment.platform || 'Unknown Platform'}</p>
              </div>
              <button className="close-btn" onClick={() => setSelectedMoment(null)}>✕</button>
            </header>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-section">
                  <h3>Content Details</h3>
                  <dl>
                    <dt>Program:</dt>
                    <dd>{selectedMoment.programTitle}</dd>

                    {selectedMoment.season && (
                      <>
                        <dt>Season:</dt>
                        <dd>{selectedMoment.season}</dd>
                      </>
                    )}

                    {selectedMoment.episode && (
                      <>
                        <dt>Episode:</dt>
                        <dd>{selectedMoment.episode}</dd>
                      </>
                    )}

                    {selectedMoment.episodeTitle && (
                      <>
                        <dt>Episode Title:</dt>
                        <dd>{selectedMoment.episodeTitle}</dd>
                      </>
                    )}

                    <dt>Genre:</dt>
                    <dd>{selectedMoment.genre || 'N/A'}</dd>

                    <dt>Rating:</dt>
                    <dd>{selectedMoment.rating || 'N/A'}</dd>

                    <dt>Type:</dt>
                    <dd>{selectedMoment.contentType === 'live' ? 'Live TV' : 'On-Demand'}</dd>
                  </dl>
                </div>

                <div className="detail-section">
                  <h3>Pause Event Details</h3>
                  <dl>
                    <dt>Publisher:</dt>
                    <dd>{selectedMoment.publisher}</dd>

                    <dt>App:</dt>
                    <dd>{selectedMoment.appName || 'N/A'}</dd>

                    <dt>Platform:</dt>
                    <dd>{selectedMoment.platform || 'N/A'}</dd>

                    <dt>Pause Time:</dt>
                    <dd>{new Date(selectedMoment.pauseTimestamp).toLocaleString()}</dd>

                    {selectedMoment.playbackPositionMs && (
                      <>
                        <dt>Playback Position:</dt>
                        <dd>{formatPlaybackTime(selectedMoment.playbackPositionMs)}</dd>
                      </>
                    )}

                    {selectedMoment.playbackPercentage && (
                      <>
                        <dt>Progress:</dt>
                        <dd>{selectedMoment.playbackPercentage}% complete</dd>
                      </>
                    )}

                    <dt>Session ID:</dt>
                    <dd style={{ fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {selectedMoment.sessionId}
                    </dd>
                  </dl>
                </div>

                <div className="detail-section">
                  <h3>Engagement Status</h3>
                  <dl>
                    <dt>QR Scan:</dt>
                    <dd>
                      {selectedMoment.scanId ? (
                        <span className="badge-success">✓ Yes</span>
                      ) : (
                        <span className="badge-neutral">— No scan detected</span>
                      )}
                    </dd>

                    <dt>Conversion:</dt>
                    <dd>
                      {selectedMoment.conversionOccurred ? (
                        <span className="badge-success">✓ Converted</span>
                      ) : (
                        <span className="badge-neutral">— No conversion</span>
                      )}
                    </dd>

                    {selectedMoment.qrCodeId && (
                      <>
                        <dt>QR Campaign:</dt>
                        <dd><span className="qr-badge">{selectedMoment.qrCodeId}</span></dd>
                      </>
                    )}
                  </dl>
                </div>
              </div>

              <div className="verification-notice">
                <strong>✓ Verified Pause Event</strong>
                <p>
                  This pause occurred at the specified moment in {selectedMoment.programTitle} and 
                  produced {selectedMoment.conversionOccurred ? 'a conversion' : 'engagement'}. 
                  All data is contextual, not personal.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn secondary" onClick={() => setSelectedMoment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
