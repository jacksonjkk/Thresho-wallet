import React from 'react';

export default function RuleConfirmModal({ open, rule, onConfirm, onCancel, loading }) {
  if (!open || !rule) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Confirm Rule Update</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-row"><span className="label">Rule</span><span className="value">{rule.name}</span></div>
          <div className="modal-row"><span className="label">Value</span><span className="value">{rule.value}</span></div>
          <div className="alert alert-info" style={{ marginTop: 12 }}>
            This will call the Soroban rules contract to update enforcement parameters.
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={() => onConfirm(rule)} disabled={loading}>
            {loading ? 'Updating...' : 'Update Rule'}
          </button>
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
