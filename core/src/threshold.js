export function hasReachedThreshold({ approvals, requiredWeight }) {
  const total = approvals.reduce((sum, a) => sum + (a.weight || 0), 0);
  return total >= requiredWeight;
}

export function requiredWeightForLevel(level, thresholds) {
  if (level === 'low') return thresholds.low;
  if (level === 'high') return thresholds.high;
  return thresholds.med;
}

export function summarizeApprovals({ approvals, thresholds }) {
  const total = approvals.reduce((sum, a) => sum + (a.weight || 0), 0);
  return {
    totalWeight: total,
    metLow: total >= thresholds.low,
    metMed: total >= thresholds.med,
    metHigh: total >= thresholds.high,
  };
}
