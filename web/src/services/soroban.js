// Placeholder Soroban rules fetcher. Replace with real contract call.
import API from './api.js';

export async function fetchRulesState() {
  // In production, call your Soroban contract read method.
  // Here we stub a minimal response for UI purposes.
  try {
    const { data } = await API.get('/rules/state');
    return data;
  } catch (e) {
    return {
      limits: { daily: '1000 XLM', perTx: '250 XLM' },
      locks: { until: null },
      freeze: false,
      updatedAt: new Date().toISOString(),
    };
  }
}
