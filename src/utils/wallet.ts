/**
 * SOLANA WALLET INTEGRATION
 * 
 * This module handles wallet detection, connection, and management
 * for Phantom and Solflare wallets on desktop browsers.
 * 
 * WALLET STATES:
 * - not-installed: No wallet extension detected
 * - detected: Wallet found but not connected
 * - connecting: Connection request in progress
 * - connected: Successfully connected to wallet
 * - rejected: User rejected the connection request
 * - error: Connection failed with an error
 */

/**
 * WALLET STATE TYPE
 */
export type WalletState = 'not-installed' | 'detected' | 'connecting' | 'connected' | 'rejected' | 'error';

/**
 * WALLET INFO INTERFACE
 */
export interface WalletInfo {
  state: WalletState;
  publicKey: string | null;
  error: string | null;
  walletType?: 'phantom' | 'solflare' | 'mobile' | 'unknown';
}

/**
 * WALLET URLS
 */
export const WALLET_URLS = {
  phantom: 'https://phantom.app/',
  solflare: 'https://solflare.com/',
  docs: 'https://docs.solana.com/wallet-guide'
};

/**
 * UTILITY: Shorten wallet address
 * 
 * Converts: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
 * To: 7xKX...sgAsU
 */
export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-6)}`;
}

/**
 * WALLET API CALL: Detect wallet provider
 * 
 * Checks the window object for wallet providers injected by browser extensions.
 * Phantom and Solflare extensions inject themselves into window.solana or window.phantom/window.solflare.
 * 
 * @returns {any | null} The wallet provider object or null if not found
 */
export function detectWallet(): any | null {
  if (typeof window === 'undefined') return null;
  
  // Try to detect Phantom
  if ((window as any).phantom?.solana) {
    return (window as any).phantom.solana;
  }
  
  // Try to detect Solflare
  if ((window as any).solflare) {
    return (window as any).solflare;
  }
  
  // Try to detect generic Solana wallet
  if ((window as any).solana) {
    return (window as any).solana;
  }
  
  return null;
}

/**
 * WALLET API CALL: Connect to wallet
 * 
 * This triggers the wallet popup and requests user approval.
 * The Promise resolves when user approves, or rejects if denied.
 * 
 * @param provider - Detected wallet provider (Phantom or Solflare)
 * @returns {Promise<string>} The wallet's public key
 * @throws {Error} If connection fails or user rejects
 */
export async function connectWallet(provider: any): Promise<string> {
  try {
    // Phantom wallet
    if (provider.isPhantom) {
      // API CALL: provider.connect()
      // This opens the Phantom popup
      const response = await provider.connect();
      return response.publicKey.toString();
    }
    
    // Solflare wallet
    if (provider.isSolflare) {
      // API CALL: provider.connect()
      // This opens the Solflare popup
      await provider.connect();
      return provider.publicKey.toString();
    }
    
    // Generic Solana wallet (fallback)
    const response = await provider.connect();
    if (response?.publicKey) {
      return response.publicKey.toString();
    }
    if (provider.publicKey) {
      return provider.publicKey.toString();
    }
    
    throw new Error('No public key returned from wallet');
    
  } catch (error: any) {
    // Don't log rejection errors - they're expected user behavior
    const isRejection = 
      error.message?.includes('rejected') || 
      error.message?.includes('User rejected') ||
      error.message?.includes('User cancelled') ||
      error.message?.includes('User denied') ||
      error.code === 4001;
    
    if (!isRejection) {
      console.error('Wallet connection error:', error);
    }
    
    // Re-throw the error so caller can handle it
    throw error;
  }
}

/**
 * WALLET API CALL: Disconnect from wallet
 * 
 * This ends the connection between the dApp and the wallet.
 * The wallet will forget this dApp's approval.
 * 
 * @param provider - Connected wallet provider
 * @throws {Error} If disconnection fails
 */
export async function disconnectWallet(provider: any): Promise<void> {
  try {
    await provider.disconnect();
  } catch (error: any) {
    console.error('Error disconnecting wallet:', error);
    throw new Error(error.message || 'Failed to disconnect wallet');
  }
}

/**
 * WALLET API CALL: Try to auto-connect
 * 
 * If the user previously approved this dApp, the wallet might
 * automatically reconnect without showing a popup.
 * 
 * This is called on page load to restore previous sessions.
 * 
 * @param provider - Detected wallet provider
 * @returns {Promise<string | null>} Public key if auto-connected, null otherwise
 */
export async function tryAutoConnect(provider: any): Promise<string | null> {
  try {
    // Check if wallet is already connected
    if (provider.isConnected && provider.publicKey) {
      return provider.publicKey.toString();
    }
    
    // Some wallets support eager connection (auto-connect without popup)
    // This will only work if user previously approved this dApp
    if (provider.connect) {
      // Try silent connection with onlyIfTrusted option
      const response = await provider.connect({ onlyIfTrusted: true });
      if (response?.publicKey) {
        return response.publicKey.toString();
      }
      if (provider.publicKey) {
        return provider.publicKey.toString();
      }
    }
    
    return null;
  } catch (error) {
    // Silent failure for auto-connect - user just needs to manually connect
    return null;
  }
}

/**
 * WALLET API: Set up event listeners
 * 
 * Wallets emit events when:
 * - Connection is established
 * - Wallet is disconnected
 * - User switches accounts
 * 
 * @param provider - Wallet provider to listen to
 * @param callbacks - Event handler callbacks
 * @returns {Function} Cleanup function to remove listeners
 */
export function setupWalletListeners(
  provider: any,
  callbacks: {
    onConnect: (publicKey: string) => void;
    onDisconnect: () => void;
    onAccountChanged: (publicKey: string | null) => void;
  }
): () => void {
  
  // EVENT HANDLER: Wallet connected
  const handleConnect = () => {
    if (provider.publicKey) {
      callbacks.onConnect(provider.publicKey.toString());
    }
  };
  
  // EVENT HANDLER: Wallet disconnected
  const handleDisconnect = () => {
    callbacks.onDisconnect();
  };
  
  // EVENT HANDLER: Account changed (user switched accounts in wallet)
  const handleAccountChanged = (publicKey: any) => {
    if (publicKey) {
      callbacks.onAccountChanged(publicKey.toString());
    } else {
      callbacks.onAccountChanged(null);
    }
  };
  
  // REGISTER LISTENERS
  provider.on('connect', handleConnect);
  provider.on('disconnect', handleDisconnect);
  provider.on('accountChanged', handleAccountChanged);
  
  // CLEANUP FUNCTION
  // This is returned so React can clean up listeners on unmount
  return () => {
    provider.removeListener('connect', handleConnect);
    provider.removeListener('disconnect', handleDisconnect);
    provider.removeListener('accountChanged', handleAccountChanged);
  };
}
