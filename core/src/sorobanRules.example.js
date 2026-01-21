// Pseudocode for Soroban rule checks.
// In production, deploy a Soroban contract and call it for checks.

export const sorobanRules = {
  // 1) Transaction Rules / Limits
  checkLimits({ amount, asset, category, nowUtc, maxPerTx, timeLockUntil }) {
    if (maxPerTx != null && Number(amount) > Number(maxPerTx)) {
      return { ok: false, reason: 'Amount exceeds max per transaction' };
    }
    if (timeLockUntil && nowUtc < timeLockUntil) {
      return { ok: false, reason: 'Timelock not expired' };
    }
    if (category && !['ops', 'payroll', 'vendors', 'misc'].includes(category)) {
      return { ok: false, reason: 'Category not allowed' };
    }
    return { ok: true };
  },

  // 2) Auditable & Safe Logic
  // Keep rules small, readable, and deterministic. No randomness or external state.
  auditSummary({ amount, asset, category }) {
    return { lines: [
      `asset=${asset}`,
      `amount=${amount}`,
      `category=${category||'none'}`,
    ] };
  },

  // 3) Threshold Wallet Integration
  precheckApprovals({ collectedSigners, requiredWeight }) {
    const sum = collectedSigners.reduce((s, it) => s + (it.weight||0), 0);
    return { ok: sum >= requiredWeight, weight: sum };
  }
};
