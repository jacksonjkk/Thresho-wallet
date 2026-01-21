import React, { useState } from 'react';
import API from '../services/api.js';
import { notifications } from '@thresho/core';
import { getPublicKey } from '../services/wallet.js';

export default function Wallet() {
  const [pub, setPub] = useState('');
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadFromFreighter() {
    try {
      const key = await getPublicKey();
      setPub(key);
      await loadInfo(key);
    } catch (e) {
      notifications.error(e.message);
    }
  }

  async function loadInfo(key = pub) {
    if (!key) {
      notifications.error('Please enter or connect a public key');
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.get(`/wallet/${key}/balances`);
      setInfo(data);
      notifications.success('Wallet info loaded');
    } catch (e) {
      notifications.error(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>Wallet Management</h1>
      <p style={{ color: 'var(--secondary-text)', marginBottom: 24 }}>
        View signers, thresholds, and account configuration
      </p>

      <div className="card mb-24">
        <div className="card-body">
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label>Public Key</label>
              <input 
                value={pub} 
                onChange={e => setPub(e.target.value)} 
                placeholder="GABC..."
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => loadInfo()} className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Loading...' : '🔍 Load Wallet Info'}
              </button>
              <button onClick={loadFromFreighter} className="btn-secondary" disabled={loading}>
                Connect Freighter
              </button>
            </div>
          </div>
        </div>
      </div>

      {info && (
        <>
          {/* Thresholds Card */}
          <div className="card mb-24">
            <div className="card-header">
              <h3 className="card-title">Account Thresholds</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <div className="flex-between mb-8">
                    <span style={{ fontWeight: 500 }}>Low Operations</span>
                    <span className="badge badge-info">{info.thresholds.low}</span>
                  </div>
                  <div className="threshold-bar">
                    <div className="threshold-bar-fill" style={{ width: `${(info.thresholds.low / 3) * 100}%` }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--secondary-text)', marginTop: 4 }}>
                    Manage data, bump sequence
                  </div>
                </div>

                <div>
                  <div className="flex-between mb-8">
                    <span style={{ fontWeight: 500 }}>Medium Operations</span>
                    <span className="badge badge-warning">{info.thresholds.med}</span>
                  </div>
                  <div className="threshold-bar">
                    <div className="threshold-bar-fill" style={{ width: `${(info.thresholds.med / 3) * 100}%` }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--secondary-text)', marginTop: 4 }}>
                    Payments, path payments, manage offers
                  </div>
                </div>

                <div>
                  <div className="flex-between mb-8">
                    <span style={{ fontWeight: 500 }}>High Operations</span>
                    <span className="badge badge-danger">{info.thresholds.high}</span>
                  </div>
                  <div className="threshold-bar">
                    <div className="threshold-bar-fill" style={{ width: `${(info.thresholds.high / 3) * 100}%` }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--secondary-text)', marginTop: 4 }}>
                    Set options, change trust, allow trust, account merge
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Signers Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Authorized Signers</h3>
              <span className="badge badge-info">{info.thresholds.signers.length} signers</span>
            </div>
            <div className="card-body">
              <ul className="signer-list">
                {info.thresholds.signers.map(s => (
                  <li key={s.key} className="signer-item">
                    <span className="signer-key">{s.key}</span>
                    <span className="signer-weight">Weight: {s.weight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {!info && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👛</div>
          <h3>No Wallet Loaded</h3>
          <p style={{ color: 'var(--secondary-text)', marginTop: 8 }}>
            Enter a public key or connect your Freighter wallet to view signers and thresholds
          </p>
        </div>
      )}
    </div>
  );
}
