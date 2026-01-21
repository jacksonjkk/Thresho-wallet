import React, { useEffect, useState } from 'react';
import { fetchRulesState } from '../services/soroban.js';
import RuleConfirmModal from '../modals/RuleConfirmModal.jsx';
import { notifications } from '@thresho/core';

export default function Rules() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingRule, setPendingRule] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchRulesState();
      setState(data);
    } catch (e) {
      notifications.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openRule(rule) {
    setPendingRule(rule);
    setModalOpen(true);
  }

  function closeRule() {
    setModalOpen(false);
    setPendingRule(null);
  }

  async function confirmRule(rule) {
    notifications.info('Rule update would call Soroban contract (stubbed)');
    closeRule();
  }

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>Smart Contract Rules</h1>
      <p style={{ color: 'var(--secondary-text)', marginBottom: 24 }}>
        Optional Soroban smart contract integration for advanced transaction controls
      </p>

      <div className="card mb-24">
        <div className="card-header">
          <h3 className="card-title">Current Rule State</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
          </div>
        </div>
        <div className="card-body">
          {state ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="modal-row"><span className="label">Daily Limit</span><span className="value">{state.limits?.daily || '—'}</span></div>
              <div className="modal-row"><span className="label">Per Tx Limit</span><span className="value">{state.limits?.perTx || '—'}</span></div>
              <div className="modal-row"><span className="label">Lock Until</span><span className="value">{state.locks?.until || 'none'}</span></div>
              <div className="modal-row"><span className="label">Freeze</span><span className="value">{state.freeze ? 'Enabled' : 'Disabled'}</span></div>
              <div className="modal-row"><span className="label">Updated</span><span className="value">{state.updatedAt ? new Date(state.updatedAt).toLocaleString() : '—'}</span></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn-primary" onClick={() => openRule({ name: 'Daily Limit', value: state.limits?.daily || 'set value' })}>Update Limit</button>
                <button className="btn-secondary" onClick={() => openRule({ name: 'Freeze', value: !state.freeze })}>Toggle Freeze</button>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--secondary-text)' }}>No rule state loaded yet.</p>
          )}
        </div>
      </div>

      <div className="card mb-24">
        <div className="card-header">
          <h3 className="card-title">Rule Enforcement</h3>
          <span className="badge badge-warning">Optional Feature</span>
        </div>
        <div className="card-body">
          <p style={{ marginBottom: 16 }}>
            Demonstrates how Soroban smart contracts can enforce transaction rules before proposals are approved. The <code>sorobanRules.example.js</code> file in the core library shows pseudocode for these features.
          </p>
          
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ padding: 16, background: 'var(--neutral-light)', borderRadius: 8, borderLeft: '4px solid var(--primary-blue)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>💰 Transaction Limits</div>
              <div style={{ fontSize: 14, color: 'var(--secondary-text)' }}>
                Enforce maximum amounts per transaction or per time window (daily/weekly limits)
              </div>
            </div>

            <div style={{ padding: 16, background: 'var(--neutral-light)', borderRadius: 8, borderLeft: '4px solid var(--accent-green)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>🏷️ Category Whitelisting</div>
              <div style={{ fontSize: 14, color: 'var(--secondary-text)' }}>
                Only allow transactions in approved categories (vendors, payroll, operations, etc.)
              </div>
            </div>

            <div style={{ padding: 16, background: 'var(--neutral-light)', borderRadius: 8, borderLeft: '4px solid var(--warning-yellow)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>⏰ Time Locks</div>
              <div style={{ fontSize: 14, color: 'var(--secondary-text)' }}>
                Block transactions until a specific timestamp or cooling-off period elapses
              </div>
            </div>

            <div style={{ padding: 16, background: 'var(--neutral-light)', borderRadius: 8, borderLeft: '4px solid var(--danger-red)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>✓ Threshold Pre-check</div>
              <div style={{ fontSize: 14, color: 'var(--secondary-text)' }}>
                Ensure collected signatures meet required weight before contract execution
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Implementation Status</h3>
        </div>
        <div className="card-body">
          <div className="alert alert-info">
            <strong>ℹ️ Development Note:</strong> Smart contract integration is currently pseudocode in <code>core/src/sorobanRules.example.js</code>. To enable:
            <ol style={{ marginTop: 12, paddingLeft: 20 }}>
              <li>Deploy a Soroban contract with rule enforcement logic</li>
              <li>Update backend to call contract methods before approving proposals</li>
              <li>Configure rule parameters (limits, categories, time locks)</li>
              <li>Test thoroughly on testnet before production deployment</li>
            </ol>
          </div>
        </div>
      </div>

      <RuleConfirmModal
        open={modalOpen}
        rule={pendingRule}
        onConfirm={confirmRule}
        onCancel={closeRule}
        loading={false}
      />
    </div>
  );
}
