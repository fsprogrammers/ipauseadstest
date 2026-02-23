import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './WalletActivity.css';

export default function WalletActivity() {
  const [wallet, setWallet] = useState({ balance: 0, brand: '', dailyCap: 0, costPerConversion: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletRes, transactionsRes] = await Promise.all([
        api.get('/api/wallet'),
        api.get('/api/wallet/transactions')
      ]);

      setWallet(walletRes.data.wallet || { balance: 0, brand: '', dailyCap: 0, costPerConversion: 0 });
      setTransactions(transactionsRes.data.transactions || []);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      alert('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);

    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await api.post('/api/wallet/deposit', { amount });
      alert(`Successfully added $${amount} to wallet`);
      setDepositAmount('');
      setShowDepositModal(false);
      fetchWalletData();
    } catch (error) {
      console.error('Deposit error:', error);
      alert(error.response?.data?.error || 'Failed to deposit funds');
    }
  };

  if (loading) {
    return <div className="loading">Loading wallet activity...</div>;
  }

  return (
    <div className="wallet-activity-page">
      <header className="page-header">
        <div>
          <h1>💰 Wallet Activity</h1>
          <p className="subtitle">Manage your balance and view transaction history</p>
        </div>
        <Link to="/dashboard" className="btn secondary">← Back to Dashboard</Link>
      </header>

      <div className="wallet-info-card">
        <div className="wallet-details">
          <div className="detail-row">
            <span className="label">Brand:</span>
            <span className="value">{wallet.brand || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Balance:</span>
            <span className="value balance">${Number(wallet.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="detail-row">
            <span className="label">Daily Cap:</span>
            <span className="value">${Number(wallet.dailyCap || 0).toLocaleString()}</span>
          </div>
          <div className="detail-row">
            <span className="label">Cost per Conversion:</span>
            <span className="value">${Number(wallet.costPerConversion || 5).toFixed(2)}</span>
          </div>
        </div>
        <button
          className="btn primary add-funds-btn"
          onClick={() => setShowDepositModal(true)}
        >
          Add Funds
        </button>
      </div>

      <div className="ledger-section">
        <h2>Transaction Ledger (Immutable)</h2>
        <p className="ledger-note">⚠️ This is a permanent record. Transactions cannot be edited or deleted.</p>

        <div className="table-container">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event</th>
                <th>Campaign</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                    No transactions yet
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx._id}>
                    <td>{new Date(tx.createdAt).toLocaleString()}</td>
                    <td>{formatEventType(tx.type)}</td>
                    <td>{tx.referenceType || 'N/A'}</td>
                    <td className={tx.amount >= 0 ? 'positive-amount' : 'negative-amount'}>
                      {tx.amount >= 0 ? '+' : '-'}${Math.abs(Number(tx.amount)).toFixed(2)}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(tx.type)}`}>
                        {getStatusLabel(tx.type)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Funds to Wallet</h2>
            <form onSubmit={handleDeposit}>
              <div className="form-group">
                <label>Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                  autoFocus
                />
              </div>
              <div className="quick-amounts">
                <button type="button" onClick={() => setDepositAmount('100')}>$100</button>
                <button type="button" onClick={() => setDepositAmount('500')}>$500</button>
                <button type="button" onClick={() => setDepositAmount('1000')}>$1,000</button>
                <button type="button" onClick={() => setDepositAmount('5000')}>$5,000</button>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setShowDepositModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Add Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatEventType(type) {
  const types = {
    deposit: 'Deposit',
    conversion_fee: 'Verified Conversion',
    refund: 'Refund',
    fraud: 'Fraud Flag (Auto-Excluded)'
  };
  return types[type] || type;
}

function getStatusClass(type) {
  if (type === 'deposit' || type === 'refund') return 'success';
  if (type === 'conversion_fee') return 'settled';
  if (type === 'fraud') return 'blocked';
  return '';
}

function getStatusLabel(type) {
  if (type === 'deposit') return 'Success';
  if (type === 'conversion_fee') return 'Settled';
  if (type === 'fraud') return 'Blocked';
  if (type === 'refund') return 'Success';
  return 'Pending';
}
