import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import api from '../services/api';
import './PublisherOnboarding.css';

export default function PublisherOnboarding() {
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [currentPublisher, setCurrentPublisher] = useState(null);
  const [newPublisher, setNewPublisher] = useState({
    publisher_id: '',
    publisher_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    company_address: '',
    platform_type: 'CTV',
    active_campaigns: [],
    notes: ''
  });

  // Fetch publishers from API
  const fetchPublishers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/v1/admin/publishers');
      setPublishers(res.data.publishers || []);
    } catch (error) {
      console.error('Error fetching publishers:', error);
      if (error.response?.status === 403) {
        alert('Admin access required to view publishers');
      } else {
        alert('Failed to load publishers');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load publishers on mount
  useEffect(() => {
    fetchPublishers();
  }, []);

  // Handle form submission - Create publisher via API
  const handleCreatePublisher = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await api.post('/v1/admin/publishers', {
        publisher_id: newPublisher.publisher_id || undefined,
        publisher_name: newPublisher.publisher_name,
        contact_name: newPublisher.contact_name,
        contact_email: newPublisher.contact_email,
        contact_phone: newPublisher.contact_phone || undefined,
        company_address: newPublisher.company_address || undefined,
        platform_type: newPublisher.platform_type,
        notes: newPublisher.notes || undefined,
        active_campaigns: newPublisher.active_campaigns.length > 0 ? newPublisher.active_campaigns : undefined
      });

      // Show credentials modal with returned data
      setCurrentPublisher({
        ...res.data.publisher,
        api_key: res.data.credentials.api_key,
        webhook_secret: res.data.credentials.webhook_secret
      });

      setShowCredentialsModal(true);
      setShowCreateModal(false);

      // Refresh publishers list
      fetchPublishers();

      // Reset form
      setNewPublisher({
        publisher_id: '',
        publisher_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        company_address: '',
        platform_type: 'CTV',
        active_campaigns: [],
        notes: ''
      });

    } catch (error) {
      console.error('Error creating publisher:', error);
      alert(error.response?.data?.message || 'Failed to create publisher');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate PDF documentation
  const generatePDF = (publisher) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Helper function for adding text
    const addText = (text, size = 12, style = 'normal') => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.text(text, 20, yPos);
      yPos += size / 2 + 5;
    };

    const addSection = (title) => {
      yPos += 5;
      doc.setFillColor(102, 126, 234);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 20, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 12;
    };

    // Header
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('iPauseAds', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Publisher Integration Guide', pageWidth / 2, 30, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos = 50;

    // Publisher Information
    addSection('PUBLISHER INFORMATION');
    addText(`Publisher Name: ${publisher.publisher_name}`, 12, 'bold');
    addText(`Publisher ID: ${publisher.publisher_id}`, 10);
    addText(`Contact: ${publisher.contact_name}`, 10);
    addText(`Email: ${publisher.contact_email}`, 10);
    addText(`Status: ${publisher.status.toUpperCase()}`, 10);
    addText(`Created: ${new Date(publisher.created_at).toLocaleDateString()}`, 10);

    // API Credentials
    addSection('API CREDENTIALS');
    doc.setTextColor(255, 0, 0);
    addText('CONFIDENTIAL - DO NOT SHARE PUBLICLY', 10, 'bold');
    doc.setTextColor(0, 0, 0);
    
    addText('API Key:', 11, 'bold');
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(publisher.api_key, 20, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    addText('Webhook Secret:', 11, 'bold');
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(publisher.webhook_secret, 20, yPos);
    yPos += 15;

    // API Endpoint
    addSection('API ENDPOINT');
    doc.setFont('helvetica', 'normal');
    addText('Production URL:', 11, 'bold');
    doc.setFont('courier', 'normal');
    addText('https://api.ipauseads.com/v1/events', 10);

    // Authentication
    addSection('AUTHENTICATION');
    doc.setFont('helvetica', 'normal');
    addText('Include in request headers:', 11);
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.text('Authorization: Bearer ' + publisher.api_key.substring(0, 20) + '...', 20, yPos);
    yPos += 8;
    doc.text('Content-Type: application/json', 20, yPos);
    yPos += 8;
    doc.text('Idempotency-Key: <unique-uuid>', 20, yPos);
    yPos += 15;

    // New page for event types
    doc.addPage();
    yPos = 20;

    // Event Types
    addSection('EVENT TYPES');
    
    doc.setFont('helvetica', 'bold');
    addText('1. Pause Impression Event', 12);
    doc.setFont('helvetica', 'normal');
    addText('Send when pause ad is displayed on screen.', 10);
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    const pauseExample = `{
  "event_type": "pause_impression",
  "event_id": "evt_unique_123",
  "event_time_utc": "2025-12-24T12:00:00Z",
  "publisher": {
    "publisher_id": "${publisher.publisher_id}",
    "publisher_name": "${publisher.publisher_name}"
  },
  "session": {
    "ipause_opportunity_id": "opp_xyz789"
  },
  "content": {
    "title": "Show Title",
    "season": "1",
    "episode": "1"
  },
  "ad": {
    "campaign_id": "cmp_123",
    "brand": "Brand Name"
  }
}`;
    
    const lines = pauseExample.split('\n');
    lines.forEach(line => {
      doc.text(line, 20, yPos);
      yPos += 4;
    });
    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    addText('2. QR Conversion Event', 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    addText('Send when user scans QR code.', 10);
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    const convExample = `{
  "event_type": "qr_conversion",
  "event_id": "evt_conv_456",
  "event_time_utc": "2025-12-24T12:00:30Z",
  "publisher": {
    "publisher_id": "${publisher.publisher_id}"
  },
  "session": {
    "ipause_opportunity_id": "opp_xyz789"
  },
  "conversion": {
    "conversion_type": "qr_scan",
    "result": "success"
  }
}`;
    
    convExample.split('\n').forEach(line => {
      doc.text(line, 20, yPos);
      yPos += 4;
    });

    // New page for important notes
    doc.addPage();
    yPos = 20;

    addSection('IMPORTANT NOTES');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    const notes = [
      '* Use the SAME ipause_opportunity_id in both pause and conversion events',
      '* This ID links the pause moment to the conversion',
      '* Each event_id must be unique',
      '* Always include Idempotency-Key to prevent duplicate billing',
      '* Store API credentials securely (use environment variables)',
      '* Never commit credentials to version control'
    ];
    
    notes.forEach(note => {
      doc.text(note, 20, yPos);
      yPos += 8;
    });

    yPos += 10;

    // Support Information
    addSection('SUPPORT & RESOURCES');
    doc.setFont('helvetica', 'normal');
    addText('Technical Support:', 11, 'bold');
    addText('Email: support@ipauseads.com', 10);
    
    addText('Integration Team:', 11, 'bold');
    addText(`Contact: ${publisher.contact_name}`, 10);
    addText(`Email: ${publisher.contact_email}`, 10);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Generated by iPauseAds Platform', pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

    // Save PDF
    doc.save(`iPauseAds_Integration_${publisher.publisher_name.replace(/\s+/g, '_')}.pdf`);
  };

  // Copy to clipboard
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  // Delete publisher via API
  const handleDelete = async (publisherId) => {
    if (!window.confirm('Are you sure you want to revoke this publisher? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/v1/admin/publishers/${publisherId}`, {
        data: { reason: 'Deleted by admin' }
      });
      alert('Publisher revoked successfully');
      fetchPublishers();
    } catch (error) {
      console.error('Error deleting publisher:', error);
      alert(error.response?.data?.message || 'Failed to delete publisher');
    }
  };

  // View credentials - fetch from API to get full details
  const handleViewCredentials = async (publisher) => {
    try {
      const res = await api.get(`/v1/admin/publishers/${publisher.publisher_id}`);
      setCurrentPublisher(res.data.publisher);
      setShowCredentialsModal(true);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      alert('Failed to load credentials');
    }
  };

  // Toggle publisher status via API
  const handleToggleStatus = async (publisherId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    try {
      await api.patch(`/v1/admin/publishers/${publisherId}/status`, {
        status: newStatus,
        reason: `Status toggled by admin`
      });
      fetchPublishers();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="publisher-onboarding">
      <header className="onboarding-header">
        <div>
          <h1>Publisher Onboarding</h1>
          <p>Manage publisher integrations and API credentials</p>
        </div>
        <button 
          className="btn primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Publisher
        </button>
      </header>

      {/* Publishers List */}
      <div className="publishers-section">
        <h2>Publishers ({publishers.length})</h2>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading publishers...</p>
          </div>
        ) : publishers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📡</div>
            <h3>No Publishers Yet</h3>
            <p>Create your first publisher integration to get started.</p>
            <button className="btn primary" onClick={() => setShowCreateModal(true)}>
              Create Publisher
            </button>
          </div>
        ) : (
          <div className="publishers-grid">
            {publishers.map(publisher => (
              <div key={publisher.publisher_id} className="publisher-card">
                <div className="publisher-header">
                  <div>
                    <h3>{publisher.publisher_name}</h3>
                    <p className="publisher-id">{publisher.publisher_id}</p>
                  </div>
                  <span 
                    className={`status-badge ${publisher.status}`}
                    onClick={() => handleToggleStatus(publisher.publisher_id, publisher.status)}
                    title="Click to toggle status"
                  >
                    {publisher.status}
                  </span>
                </div>

                <div className="publisher-details">
                  <div className="detail-row">
                    <span className="label">Contact:</span>
                    <span className="value">{publisher.contact_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Email:</span>
                    <span className="value">{publisher.contact_email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Platform:</span>
                    <span className="value">{publisher.platform_type}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Created:</span>
                    <span className="value">{new Date(publisher.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="publisher-actions">
                  <button 
                    className="btn secondary small"
                    onClick={() => handleViewCredentials(publisher)}
                  >
                    🔑 Credentials
                  </button>
                  <button 
                    className="btn secondary small"
                    onClick={() => generatePDF(publisher)}
                  >
                    📄 Download PDF
                  </button>
                  <button 
                    className="btn danger small"
                    onClick={() => handleDelete(publisher.publisher_id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Publisher Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <h2>Create New Publisher</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </header>

            <form onSubmit={handleCreatePublisher} className="publisher-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Publisher Name *</label>
                  <input
                    type="text"
                    value={newPublisher.publisher_name}
                    onChange={e => setNewPublisher({...newPublisher, publisher_name: e.target.value})}
                    placeholder="Netflix, Hulu, Tubi, etc."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Publisher ID (optional)</label>
                  <input
                    type="text"
                    value={newPublisher.publisher_id}
                    onChange={e => setNewPublisher({...newPublisher, publisher_id: e.target.value})}
                    placeholder="pub_netflix (auto-generated if empty)"
                  />
                  <small>Leave empty to auto-generate from publisher name</small>
                </div>

                <div className="form-group">
                  <label>Contact Name *</label>
                  <input
                    type="text"
                    value={newPublisher.contact_name}
                    onChange={e => setNewPublisher({...newPublisher, contact_name: e.target.value})}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contact Email *</label>
                  <input
                    type="email"
                    value={newPublisher.contact_email}
                    onChange={e => setNewPublisher({...newPublisher, contact_email: e.target.value})}
                    placeholder="api-team@publisher.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    value={newPublisher.contact_phone}
                    onChange={e => setNewPublisher({...newPublisher, contact_phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="form-group">
                  <label>Platform Type *</label>
                  <select
                    value={newPublisher.platform_type}
                    onChange={e => setNewPublisher({...newPublisher, platform_type: e.target.value})}
                    required
                  >
                    <option value="CTV">Connected TV (CTV)</option>
                    <option value="Mobile">Mobile Apps</option>
                    <option value="Web">Web Platform</option>
                    <option value="FAST">FAST Channel</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Company Address</label>
                  <input
                    type="text"
                    value={newPublisher.company_address}
                    onChange={e => setNewPublisher({...newPublisher, company_address: e.target.value})}
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Notes (Internal)</label>
                  <textarea
                    value={newPublisher.notes}
                    onChange={e => setNewPublisher({...newPublisher, notes: e.target.value})}
                    placeholder="Any internal notes about this publisher..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Publisher & Generate Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Display Modal */}
      {showCredentialsModal && currentPublisher && (
        <div className="modal-overlay" onClick={() => setShowCredentialsModal(false)}>
          <div className="modal-content credentials-modal" onClick={e => e.stopPropagation()}>
            <header className="modal-header success">
              <div>
                <h2>Publisher Credentials</h2>
                <p>{currentPublisher.publisher_name}</p>
              </div>
              <button className="close-btn" onClick={() => setShowCredentialsModal(false)}>×</button>
            </header>

            <div className="alert warning">
              <strong>⚠️ IMPORTANT:</strong> Save these credentials securely! 
              Share only with authorized personnel.
            </div>

            <div className="credentials-section">
              <h3>Publisher Information</h3>
              <div className="credential-item">
                <label>Publisher ID:</label>
                <div className="credential-value">
                  <code>{currentPublisher.publisher_id}</code>
                  <button 
                    className="btn-copy"
                    onClick={() => copyToClipboard(currentPublisher.publisher_id, 'Publisher ID')}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div className="credential-item">
                <label>Publisher Name:</label>
                <div className="credential-value">
                  <span>{currentPublisher.publisher_name}</span>
                </div>
              </div>
            </div>

            <div className="credentials-section">
              <h3>API Credentials</h3>
              
              <div className="credential-item">
                <label>API Key:</label>
                <div className="credential-value">
                  <code className="secret">{currentPublisher.api_key}</code>
                  <button 
                    className="btn-copy"
                    onClick={() => copyToClipboard(currentPublisher.api_key, 'API Key')}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div className="credential-item">
                <label>Webhook Secret:</label>
                <div className="credential-value">
                  <code className="secret">{currentPublisher.webhook_secret}</code>
                  <button 
                    className="btn-copy"
                    onClick={() => copyToClipboard(currentPublisher.webhook_secret, 'Webhook Secret')}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="credentials-section">
              <h3>API Endpoint</h3>
              <div className="credential-item">
                <label>Production:</label>
                <div className="credential-value">
                  <code>https://api.ipauseads.com/v1/events</code>
                  <button 
                    className="btn-copy"
                    onClick={() => copyToClipboard('https://api.ipauseads.com/v1/events', 'Production URL')}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="credentials-actions">
              <button 
                className="btn primary large"
                onClick={() => generatePDF(currentPublisher)}
              >
                📄 Download Complete Documentation (PDF)
              </button>
              <button 
                className="btn secondary"
                onClick={() => setShowCredentialsModal(false)}
              >
                Done
              </button>
            </div>

            <div className="next-steps">
              <h3>📋 Next Steps:</h3>
              <ol>
                <li>Download the PDF documentation</li>
                <li>Send credentials securely to publisher contact: <strong>{currentPublisher.contact_email}</strong></li>
                <li>Schedule integration call with publisher team</li>
                <li>Provide test campaigns for integration testing</li>
                <li>Verify integration before production launch</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
