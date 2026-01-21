import React, { useState } from 'react';
import API from '../services/api.js';
import { notifications } from '@thresho/core';
import { useNavigate } from 'react-router-dom';
import SubmitConfirmModal from '../modals/SubmitConfirmModal.jsx';

export default function TxForm() {
  const navigate = useNavigate();
  const [source, setSource] = useState('');
  const [dest, setDest] = useState('');
  const [amount, setAmount] = useState('10');
  const [asset, setAsset] = useState('XLM');
  const [memo, setMemo] = useState('');
  const [level, setLevel] = useState('med');
  const [category, setCategory] = useState('vendors');
  const [created, setCreated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  function openConfirm(e) {
    e.preventDefault();
    setDraft({ source, dest, amount, asset, memo, level, category });
    setConfirmOpen(true);
  }

  async function submitDraft(d) {
    setLoading(true);
    try {
      const { data } = await API.post('/tx/propose', { sourcePublicKey: d.source, destinationPublicKey: d.dest, amount: d.amount, asset: d.asset, memo: d.memo, level: d.level, category: d.category });
      setCreated(data);
      notifications.success('Transaction proposed successfully!');
      setConfirmOpen(false);
      setTimeout(() => navigate('/tx/pending'), 1200);
    } catch (e) {
      notifications.error(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ marginBottom: 8 }}>Propose Transaction</h1>
      <p style={{ color: 'var(--secondary-text)', marginBottom: 24 }}>
        Create a new transaction that requires approval from authorized signers
      </p>

      <form onSubmit={openConfirm} className="card">
        <div className="card-body" style={{ display: 'grid', gap: 20 }}>
          <div>
            <label>Source Public Key</label>
            <input 
              value={source} 
              onChange={e => setSource(e.target.value)} 
              placeholder="GABC..."
              required
            />
            <div style={{ fontSize: 12, color: 'var(--secondary-text)', marginTop: 4 }}>
              The Stellar account sending the payment
            </div>
          </div>

          <div>
            <label>Destination Public Key</label>
            <input 
              value={dest} 
              onChange={e => setDest(e.target.value)} 
              placeholder="GDEF..."
              required
            />
            <div style={{ fontSize: 12, color: 'var(--secondary-text)', marginTop: 4 }}>
              The Stellar account receiving the payment
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div>
              <label>Amount</label>
              <input 
                type="number" 
                step="0.0000001"
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                placeholder="10.00"
                required
              />
            </div>
            <div>
              <label>Asset</label>
              <input 
                value={asset} 
                onChange={e => setAsset(e.target.value)} 
                placeholder="XLM"
              />
            </div>
          </div>

          <div>
            <label>Memo (Optional)</label>
            <input 
              value={memo} 
              onChange={e => setMemo(e.target.value)} 
              placeholder="Payment description"
              maxLength="28"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Approval Level</label>
              <select value={level} onChange={e => setLevel(e.target.value)}>
                <option value="low">Low</option>
                <option value="med">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="vendors">Vendors</option>
                <option value="payroll">Payroll</option>
                <option value="ops">Operations</option>
                <option value="misc">Miscellaneous</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Creating...' : '📝 Propose Transaction'}
            </button>
            <button type="button" onClick={() => navigate('/')} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </form>

      {created && (
        <div className="alert alert-success" style={{ marginTop: 24 }}>
          ✓ Transaction created with ID: <span style={{ fontFamily: 'monospace' }}>{created.id}</span>
        </div>
      )}

      <div className="alert alert-info" style={{ marginTop: 16 }}>
        <strong>ℹ️ Note:</strong> This transaction will be added to the pending queue and require approval from authorized signers before execution.
      </div>

      <SubmitConfirmModal 
        open={confirmOpen} 
        draft={draft} 
        loading={loading}
        onConfirm={submitDraft}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
