import { getAddress, isAllowed, isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';

// Expose getAddress for browser console debugging
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.getAddress = getAddress;
  // @ts-ignore
  window.freighterApi = { getAddress, isAllowed, isConnected, requestAccess, signTransaction };
}

type FreighterAddressResult = string | { address?: string; publicKey?: string; error?: string };
type FreighterSignResult = string | { signedTxXdr?: string; signedXdr?: string; xdr?: string; error?: string };

const getPublicKeyFromResult = (raw: any): string | null => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') {
    // Some versions return { address: '...' }, others { publicKey: '...' }
    // We also check for 'error' property
    if (raw.error) {
      console.error('Freighter returned error:', raw.error);
      return null;
    }
    return raw.address || raw.publicKey || null;
  }
  return null;
};

const getSignedXdrFromResult = (raw: any): string | null => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') {
    if (raw.error) {
      console.error('Freighter signing error:', raw.error);
      return null;
    }
    return raw.signedTxXdr || raw.signedXdr || raw.xdr || null;
  }
  return null;
};

export const freighterService = {
  async connect(): Promise<string> {
    console.log('Attempting to connect to Freighter...');

    try {
      const connected = await isConnected();
      if (!connected) {
        console.error('Freighter is not installed');
        throw new Error('Freighter is not installed. Please install it from freighter.app');
      }

      console.log('Freighter is installed, checking if allowed...');
      const allowed = await isAllowed();
      if (!allowed) {
        console.log('Site not allowed, requesting access...');
        // requestAccess() might return the address in newer versions
        const accessResult = await requestAccess();
        console.log('Access request result:', accessResult);

        const keyFromAccess = getPublicKeyFromResult(accessResult);
        if (keyFromAccess) {
          return this.validateAndNormalizeKey(keyFromAccess);
        }
      }

      console.log('Getting address from Freighter...');
      let rawPublicKey = await getAddress();
      console.log('Address result:', rawPublicKey);

      let publicKeyValue = getPublicKeyFromResult(rawPublicKey);

      // FALLBACK: If we got an empty result but the site IS allowed, 
      // sometimes calling requestAccess forces Freighter to "wake up" and provide the key.
      if (!publicKeyValue) {
        console.log('Public key empty or not found, falling back to requestAccess...');
        const accessResult = await requestAccess();
        console.log('Access fallback result:', accessResult);
        publicKeyValue = getPublicKeyFromResult(accessResult);
      }

      if (!publicKeyValue) {
        throw new Error('Could not retrieve public key from Freighter. Please: \n1. Open Freighter extension\n2. Ensure an account is selected\n3. Ensure the wallet is NOT on lock screen');
      }

      return this.validateAndNormalizeKey(publicKeyValue);
    } catch (err) {
      console.error('Freighter connection failed:', err);
      throw err instanceof Error ? err : new Error('Unknown Freighter error');
    }
  },

  validateAndNormalizeKey(key: string): string {
    const publicKey = key.trim().toUpperCase();
    if (!/^[GM][A-Z2-7]{55}$/.test(publicKey)) {
      console.error('Invalid public key format:', publicKey);
      throw new Error('Freighter returned an invalid Stellar public key format.');
    }
    return publicKey;
  },

  async signChallenge(challengeXdr: string, networkPassphrase: string): Promise<string> {
    console.log('Requesting signature for challenge...');

    try {
      const allowed = await isAllowed();
      if (!allowed) {
        await requestAccess();
      }

      const result = await signTransaction(challengeXdr, { networkPassphrase });
      console.log('Signing result:', result);

      const signedXdr = getSignedXdrFromResult(result);

      if (typeof signedXdr !== 'string') {
        throw new Error('Freighter failed to sign the transaction. The user may have declined.');
      }

      return signedXdr;
    } catch (err) {
      console.error('Freighter signing failed:', err);
      throw err instanceof Error ? err : new Error('Failed to sign with Freighter');
    }
  },
};

