import { getAddress, isAllowed, isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';

export const freighterService = {
  async connect(): Promise<string> {
    const connected = await isConnected();
    if (!connected) {
      throw new Error('Freighter is not installed or not running.');
    }

    const allowed = await isAllowed();
    if (!allowed) {
      await requestAccess();
    }

    const rawPublicKey = await getAddress();
    if (!rawPublicKey) {
      throw new Error('Failed to get public key from Freighter.');
    }

    const publicKeyValue =
      typeof rawPublicKey === 'string'
        ? rawPublicKey
        : (rawPublicKey as any)?.address || (rawPublicKey as any)?.publicKey;

    if (!publicKeyValue || typeof publicKeyValue !== 'string') {
      console.error('Freighter returned key:', rawPublicKey);
      throw new Error('Freighter returned an invalid public key format.');
    }

    const publicKey = publicKeyValue.trim().toUpperCase();
    if (!/^[GM][A-Z2-7]{55}$/.test(publicKey)) {
      console.error('Freighter returned key:', rawPublicKey);
      throw new Error('Freighter returned an invalid public key format.');
    }

    return publicKey;
  },

  async signChallenge(challengeXdr: string, networkPassphrase: string): Promise<string> {
    const result = await signTransaction(challengeXdr, { networkPassphrase });

    if (typeof result === 'string') {
      return result;
    }

    const signedXdr =
      (result as any)?.signedTxXdr ||
      (result as any)?.signedXdr ||
      (result as any)?.xdr;

    if (typeof signedXdr !== 'string') {
      console.error('Unexpected Freighter signTransaction result:', result);
      throw new Error('Freighter returned an invalid signed transaction.');
    }

    return signedXdr;
  },
};
