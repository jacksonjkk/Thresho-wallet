import React, { useEffect, useState } from 'react';
import API from '../services/api.js';
import { getPublicKey, isFreighterAvailable } from '../services/wallet.js';
import { notifications } from '@thresho/core';
import QRCode from 'qrcode.react';
import WalletConnectModal from '../modals/WalletConnectModal.jsx';

export default function Dashboard() {
  const [pub, setPub] = useState('');
  const [balances, setBalances] = useState([]);
  const [thresholds, setThresholds] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  async function connect() {
    setLoading(true);
    try {
      const ok = await isFreighterAvailable();
      if (!ok) {
        notifications.error('Freighter not detected. Ensure the extension is enabled for this site (localhost:3000/5173) then reload.');
        return;
      }
      const key = await getPublicKey();
      setPub(key);
      const { data } = await API.get(`/wallet/${key}/balances`);
      setBalances(data.balances);
      setThresholds(data.thresholds);
      notifications.success('Wallet connected!');
    } catch (e) {
      notifications.error(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  async function connectManual(manualKey) {
    const key = manualKey?.trim();
    if (!key || !/^G[A-Z2-7]{55}$/.test(key)) {
      notifications.error('Enter a valid Stellar public key (starts with G, 56 chars).');
      return;
    }
    setLoading(true);
    try {
      setPub(key);
      const { data } = await API.get(`/wallet/${key}/balances`);
      setBalances(data.balances);
      setThresholds(data.thresholds);
      notifications.success('Connected in read-only mode. To sign, connect Freighter.');
      setConnectOpen(false);
    } catch (e) {
      notifications.error(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  function openConnect() { setConnectOpen(true); }
  function closeConnect() { setConnectOpen(false); }

  return (
    <div style={{ maxWidth: 1000 }}>
      <div className="flex-between mb-24">
        <h1>Dashboard</h1>
        <button onClick={openConnect} className="btn-primary" disabled={loading}>
          {loading ? 'Connecting...' : (pub ? '✓ Connected' : '🔗 Connect Wallet')}
        </button>
      </div>

      {!pub ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <img src="/logo.png" alt="Thresho Logo" style={{ width: 250, height: 250, marginBottom: 16, borderRadius: 10 }} />
          <h3>Connect Your Stellar Wallet</h3>
          <p style={{ color: 'var(--secondary-text)', marginTop: 8, marginBottom: 24 }}>
            Connect Freighter to view your balances, thresholds, and manage transactions
          </p>
          <button onClick={openConnect} className="btn-primary" disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Freighter Wallet'}
          </button>
        </div>
      ) : (
        <>
          {/* Balance Card */}
          {balances.length > 0 && (
            <div className="balance-card mb-24">
              <div className="balance-label">Total Balance</div>
              <div className="balance-amount">
                {balances.find(b => b.asset === 'XLM')?.balance || '0.00'} <span style={{ fontSize: 24, opacity: 0.9 }}>XLM</span>
              </div>
            </div>
          )}

          <div className="two-col" style={{ marginBottom: 24 }}>
            {/* Account Details Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Account Address</h3>
              </div>
              <div className="card-body">
                <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 12, color: 'var(--secondary-text)', marginBottom: 16 }}>
                  {pub}
                </div>
                <div className="qr-container">
                  <QRCode value={pub} size={128} />
                </div>
              </div>
            </div>

            {/* Thresholds Card */}
            {thresholds && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Account Thresholds</h3>
                </div>
                <div className="card-body">
                  <div style={{ marginBottom: 16 }}>
                    <div className="flex-between mb-8">
                      <span style={{ fontWeight: 500 }}>Low</span>
                      <span className="badge badge-info">{thresholds.low}</span>
                    </div>
                    <div className="threshold-bar">
                      <div className="threshold-bar-fill" style={{ width: `${(thresholds.low / 3) * 100}%` }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div className="flex-between mb-8">
                      <span style={{ fontWeight: 500 }}>Medium</span>
                      <span className="badge badge-warning">{thresholds.med}</span>
                    </div>
                    <div className="threshold-bar">
                      <div className="threshold-bar-fill" style={{ width: `${(thresholds.med / 3) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex-between mb-8">
                      <span style={{ fontWeight: 500 }}>High</span>
                      <span className="badge badge-danger">{thresholds.high}</span>
                    </div>
                    <div className="threshold-bar">
                      <div className="threshold-bar-fill" style={{ width: `${(thresholds.high / 3) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Balances Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Asset Balances</h3>
            </div>
            <div className="card-body">
              {balances.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {balances.map((b, i) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < balances.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <span style={{ fontWeight: 500 }}>{b.asset}</span>
                      <span style={{ color: 'var(--primary-blue)', fontWeight: 500 }}>{b.balance}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--secondary-text)', textAlign: 'center', padding: 24 }}>No assets found</p>
              )}
            </div>
          </div>

          {/* Signers Card */}
          {thresholds?.signers && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header">
                <h3 className="card-title">Authorized Signers</h3>
                <span className="badge badge-info">{thresholds.signers.length} signers</span>
              </div>
              <div className="card-body">
                <ul className="signer-list">
                  {thresholds.signers.map((s, i) => (
                    <li key={i} className="signer-item">
                      <span className="signer-key">{s.key.slice(0, 8)}...{s.key.slice(-8)}</span>
                      <span className="signer-weight">Weight: {s.weight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
      <WalletConnectModal 
        open={connectOpen}
        onConnectFreighter={() => { closeConnect(); connect(); }}
        onConnectManual={connectManual}
        onClose={closeConnect}
      />
    </div>
  );
}
