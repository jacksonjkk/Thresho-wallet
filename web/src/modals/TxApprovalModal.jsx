import React from 'react';

export default function TxApprovalModal({ open, tx, onApprove, onReject, onClose, loading }) {
  if (!open || !tx) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Review Transaction</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-row">
            <span className="label">Amount</span>
            <span className="value">{tx.amount} {tx.asset}</span>
          </div>
          <div className="modal-row">
            <span className="label">From</span>
            <span className="value code">{tx.sender}</span>
          </div>
          <div className="modal-row">
            <span className="label">To</span>
            <span className="value code">{tx.dest}</span>
          </div>
          {tx.memo && (
            <div className="modal-row">
              <span className="label">Memo</span>
              <span className="value">{tx.memo}</span>
            </div>
          )}
          <div className="modal-row">
            <span className="label">Threshold Level</span>
            <span className="value badge badge-warning">{tx.level || 'med'}</span>
          </div>
          <div className="modal-row">
            <span className="label">Approvals</span>
            <span className="value">{tx.approvals?.length || 0}</span>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-success" onClick={() => onApprove(tx)} disabled={loading}>
            {loading ? 'Approving...' : 'Approve & Sign'}
          </button>
          <button className="btn-danger" onClick={() => onReject(tx)} disabled={loading}>
            {loading ? 'Rejecting...' : 'Reject'}
          </button>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Close</button>
        </div>
      </div>
    </div>
  );
}
