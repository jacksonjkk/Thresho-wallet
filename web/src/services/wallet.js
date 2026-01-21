// Freighter integration (web only) with comprehensive detection
const RETRY_MS = 300;
const MAX_RETRIES = 15; // ~4.5s total wait for extension injection

// Check all possible Freighter injection points
function getFreighterAPI() {
  // Primary injection point (Freighter v5+)
  if (window.freighterApi) return window.freighterApi;
  
  // Legacy injection point (older versions)
  if (window.freighter) return window.freighter;
  
  // Fallback: check if it's nested in stellar namespace
  if (window.stellar?.freighter) return window.stellar.freighter;
  
  return null;
}

async function waitForFreighter() {
  // Immediate check first
  let api = getFreighterAPI();
  if (api) return api;
  
  // Wait with exponential backoff for injection
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await new Promise(res => setTimeout(res, RETRY_MS));
    api = getFreighterAPI();
    if (api) {
      console.log(`[Freighter] Detected after ${attempt + 1} retries`);
      return api;
    }
  }
  
  // Final diagnostic
  console.error('[Freighter] Not detected. Window keys:', Object.keys(window).filter(k => k.toLowerCase().includes('freight') || k.toLowerCase().includes('stellar')));
  return null;
}

export async function isFreighterAvailable() {
  const api = await waitForFreighter();
  return !!api;
}

export async function getPublicKey() {
  const api = await waitForFreighter();
  if (!api) {
    throw new Error(
      'Freighter not detected. Steps: 1) Install Freighter extension, 2) Enable it for this site in extension settings, 3) Refresh the page'
    );
  }
  
  try {
    return await api.getPublicKey();
  } catch (error) {
    if (error.message?.includes('User declined')) {
      throw new Error('Connection request declined. Click Connect again to retry.');
    }
    throw error;
  }
}

export async function signXDR(xdr, opts = { network: 'TESTNET' }) {
  const api = await waitForFreighter();
  if (!api) {
    throw new Error('Freighter not detected. Ensure the extension is enabled and refresh.');
  }
  
  try {
    return await api.signTransaction(xdr, opts);
  } catch (error) {
    if (error.message?.includes('User declined')) {
      throw new Error('Transaction signing declined.');
    }
    throw error;
  }
}

// Diagnostic helper - call from console to debug
export function diagnoseFreighter() {
  console.log('=== Freighter Diagnostics ===');
  console.log('window.freighterApi:', window.freighterApi ? '✓ Found' : '✗ Not found');
  console.log('window.freighter:', window.freighter ? '✓ Found' : '✗ Not found');
  console.log('window.stellar:', window.stellar);
  console.log('All window keys with "freight":', Object.keys(window).filter(k => k.toLowerCase().includes('freight')));
  console.log('User agent:', navigator.userAgent);
  console.log('=========================');
}
