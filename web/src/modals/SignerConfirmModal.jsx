import React from 'react';

export default function SignerConfirmModal({ open, signer, action, onConfirm, onCancel, loading }) {
  if (!open || !signer) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{action === 'add' ? 'Add Signer' : 'Remove Signer'}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-row"><span className="label">Public Key</span><span className="value code">{signer.key}</span></div>
          <div className="modal-row"><span className="label">Weight</span><span className="value">{signer.weight}</span></div>
          <div className="alert alert-warning" style={{ marginTop: 12 }}>
            This will require a threshold-changing transaction on Stellar.
          </div>
        </div>
        <div className="modal-actions">
          <button className={action === 'add' ? 'btn-success' : 'btn-danger'} onClick={() => onConfirm(signer)} disabled={loading}>
            {loading ? 'Submitting...' : (action === 'add' ? 'Add Signer' : 'Remove Signer')}
          </button>
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
