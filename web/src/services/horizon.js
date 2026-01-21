import API from './api.js';

export async function fetchAccountSummary(pubKey) {
  if (!pubKey) throw new Error('Missing public key');
  const { data } = await API.get(`/wallet/${pubKey}/balances`);
  return data;
}
