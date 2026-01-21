import React from 'react';

// Placeholder; real history would come via Horizon or backend indexing
export default function History() {
  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>Transaction History</h1>
      <p style={{ color: 'var(--secondary-text)', marginBottom: 24 }}>
        View past transactions and their approval history
      </p>

      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📜</div>
        <h3>Coming Soon</h3>
        <p style={{ color: 'var(--secondary-text)', marginTop: 8, maxWidth: 500, margin: '8px auto 24px' }}>
          Transaction history will show all past proposals, approvals, rejections, and executions with full audit trails from Horizon and the backend.
        </p>
        <div className="alert alert-info" style={{ textAlign: 'left' }}>
          <strong>Planned Features:</strong>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>Complete transaction timeline</li>
            <li>Approval chain visualization</li>
            <li>Filter by status, date, and amount</li>
            <li>Export to CSV for accounting</li>
            <li>Search by transaction ID or public key</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
