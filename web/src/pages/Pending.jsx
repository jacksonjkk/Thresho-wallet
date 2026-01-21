import React, { useEffect, useState } from 'react';
import API from '../services/api.js';
import { notifications } from '@thresho/core';
import { getPublicKey, signXDR } from '../services/wallet.js';
import { startPoller } from '../services/poller.js';
import TxApprovalModal from '../modals/TxApprovalModal.jsx';

export default function Pending() {
  const [items, setItems] = useState([]);
  const [pub, setPub] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await API.get('/tx/pending');
      setItems(data);
    } catch (e) {
      notifications.error(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    load();
    const stop = startPoller(load, 12000);
    return stop;
  }, []);

  async function connect() {
    try {
      const k = await getPublicKey();
      setPub(k);
      notifications.success('Wallet connected for approvals');
    } catch (e) {
      notifications.error(e.message);
    }
  }

  async function approve(id, xdr) {
    if (!pub) {
      notifications.error('Please connect wallet first');
      return;
    }
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const signed = await signXDR(xdr, { network: 'TESTNET' });
      await API.post(`/tx/${id}/approve`, { signedXDR: signed, signerPublicKey: pub });
      notifications.success('Approval submitted!');
      load();
    } catch (e) {
      notifications.error(e.response?.data?.error || e.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  }

  async function reject(id) {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await API.post(`/tx/${id}/reject`);
      notifications.success('Transaction rejected');
      load();
    } catch (e) {
      notifications.error(e.response?.data?.error || e.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  }

  function openModal(tx) {
    setSelected(tx);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelected(null);
  }

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h1>Pending Transactions</h1>
          <p style={{ color: 'var(--secondary-text)', marginTop: 4 }}>
            Review and approve transactions awaiting signature
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={connect} className={pub ? 'btn-success' : 'btn-primary'}>
            {pub ? '✓ Wallet Connected' : '🔗 Connect for Approvals'}
          </button>
          <button onClick={load} className="btn-secondary" disabled={loading}>
            {loading ? '...' : '🔄'}
          </button>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 16, color: 'var(--secondary-text)' }}>Loading transactions...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <h3>No Pending Transactions</h3>
          <p style={{ color: 'var(--secondary-text)', marginTop: 8 }}>
            All transactions have been processed or no transactions are waiting for approval
          </p>
        </div>
      ) : (
        <div className="tx-list">
          {items.map(it => {
            const isLoading = actionLoading[it.id];
            const status = it.status === 'submitted' ? 'success' : 
                          it.status === 'rejected' ? 'danger' : 'pending';
            return (
              <div key={it.id} className="tx-item">
                <div className="tx-item-header">
                  <div>
                    <div className="tx-item-title">
                      {it.amount} {it.asset}
                    </div>
                    <div className="tx-item-meta">
                      ID: <span style={{ fontFamily: 'monospace' }}>{it.id}</span> • Level: <span className="badge badge-info">{it.level}</span>
                    </div>
                  </div>
                  <span className={`badge badge-${status}`}>
                    {it.status}
                  </span>
                </div>

                <div className="tx-item-body">
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--secondary-text)', marginBottom: 4 }}>Destination</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>
                      {it.destinationPublicKey}
                    </div>
                  </div>

                  {it.memo && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: 'var(--secondary-text)', marginBottom: 4 }}>Memo</div>
                      <div>{it.memo}</div>
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--secondary-text)', marginBottom: 8 }}>
                      Approvals: {it.approvals?.length || 0}
                    </div>
                    {it.approvals && it.approvals.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {it.approvals.map((a, i) => (
                          <span key={i} className="badge badge-success" style={{ fontFamily: 'monospace', fontSize: 10 }}>
                            {a.signerPublicKey.slice(0, 6)}...{a.signerPublicKey.slice(-4)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {it.status === 'pending' && (
                    <div className="tx-actions">
                      <button 
                        onClick={() => openModal(it)} 
                        className="btn-primary"
                        disabled={isLoading}
                      >
                        Review
                      </button>
                      <button 
                        onClick={() => approve(it.id, it.xdr)} 
                        className="btn-success"
                        disabled={isLoading || !pub}
                      >
                        {isLoading ? '...' : '✓ Quick Approve'}
                      </button>
                      <button 
                        onClick={() => reject(it.id)} 
                        className="btn-danger"
                        disabled={isLoading}
                      >
                        {isLoading ? '...' : '✗ Reject'}
                      </button>
                    </div>
                  )}

                  {it.status === 'submitted' && (
                    <div className="alert alert-success">
                      ✓ Transaction successfully submitted to Stellar network
                    </div>
                  )}

                  {it.status === 'rejected' && (
                    <div className="alert alert-error">
                      ✗ Transaction was rejected and will not be executed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TxApprovalModal
        open={modalOpen}
        tx={selected}
        loading={selected ? actionLoading[selected.id] : false}
        onApprove={(tx) => approve(tx.id, tx.xdr)}
        onReject={(tx) => reject(tx.id)}
        onClose={closeModal}
      />
    </div>
  );
}
