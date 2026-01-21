import React from 'react';

export default function SubmitConfirmModal({ open, draft, onConfirm, onCancel, loading }) {
  if (!open || !draft) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Confirm Proposal</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-row"><span className="label">Amount</span><span className="value">{draft.amount} {draft.asset}</span></div>
          <div className="modal-row"><span className="label">From</span><span className="value code">{draft.source}</span></div>
          <div className="modal-row"><span className="label">To</span><span className="value code">{draft.dest}</span></div>
          {draft.memo && (<div className="modal-row"><span className="label">Memo</span><span className="value">{draft.memo}</span></div>)}
          <div className="modal-row"><span className="label">Level</span><span className="value badge badge-info">{draft.level}</span></div>
          <div className="modal-row"><span className="label">Category</span><span className="value">{draft.category}</span></div>
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={() => onConfirm(draft)} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Proposal'}
          </button>
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
