import React, { useState } from 'react';

export default function WalletConnectModal({ open, onConnectFreighter, onConnectManual, onClose }) {
  const [manualKey, setManualKey] = useState('');
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Connect Wallet</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gap: 12 }}>
          <p style={{ color: 'var(--secondary-text)' }}>
            Choose an external wallet to connect. Keys stay in your wallet; we never custody private keys.
          </p>
          <button className="btn-primary" onClick={onConnectFreighter}>Connect Freighter</button>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, marginTop: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Or paste a public key (read-only)</div>
            <input
              value={manualKey}
              onChange={e => setManualKey(e.target.value)}
              placeholder="G..."
              style={{ width: '100%', padding: 10, border: '1px solid var(--border-color)', borderRadius: 8 }}
            />
            <button
              className="btn-secondary"
              style={{ marginTop: 8 }}
              onClick={() => onConnectManual && onConnectManual(manualKey)}
            >
              Connect read-only
            </button>
            <p style={{ color: 'var(--secondary-text)', fontSize: 12, marginTop: 6 }}>
              Read-only mode can view balances and signers; signing still requires Freighter.
            </p>
          </div>
          <button className="btn-secondary" disabled title="Lobstr deeplink not implemented">
            Lobstr (coming soon)
          </button>
        </div>
      </div>
    </div>
  );
}
