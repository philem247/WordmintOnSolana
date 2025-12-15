/**
 * Mobile Wallet Adapter for Solana
 * 
 * Handles mobile wallet connections using the in-app browser approach
 * which is the most reliable method for Phantom and Solflare mobile
 */

export interface MobileWalletProvider {
  connect(): Promise<{ publicKey: string }>;
  disconnect(): Promise<void>;
  signMessage?(message: Uint8Array): Promise<{ signature: Uint8Array }>;
}

/**
 * Detects if user is on mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for mobile devices
  return /android|iPad|iPhone|iPod/i.test(userAgent) && 
         !/windows phone/i.test(userAgent);
}

/**
 * Detects if user is in Phantom mobile in-app browser
 */
export function isPhantomMobileApp(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Phantom injects 'phantom' into the user agent
  const userAgent = navigator.userAgent || '';
  return /Phantom/i.test(userAgent) || (window as any).phantom?.solana?.isPhantom;
}

/**
 * Detects if user is in Solflare mobile in-app browser
 */
export function isSolflareMobileApp(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || '';
  return /Solflare/i.test(userAgent) || (window as any).solflare?.isSolflare;
}

/**
 * Gets the mobile wallet provider if available
 */
export function getMobileWalletProvider(): any | null {
  if (typeof window === 'undefined') return null;
  
  // Check for Phantom mobile
  if ((window as any).phantom?.solana) {
    return (window as any).phantom.solana;
  }
  
  // Check for Solflare mobile
  if ((window as any).solflare) {
    return (window as any).solflare;
  }
  
  // Check for generic Solana provider
  if ((window as any).solana) {
    return (window as any).solana;
  }
  
  return null;
}

/**
 * Gets the current app URL for deep linking
 */
export function getAppUrl(): string {
  if (typeof window === 'undefined') return '';
  
  const { protocol, host, pathname } = window.location;
  return `${protocol}//${host}${pathname}`;
}

/**
 * Generates deep link URLs for opening wallet apps
 * These links will open the wallet app and have it open our dApp URL in their in-app browser
 */
export function getWalletAppDeepLink(walletType: 'phantom' | 'solflare'): string {
  const appUrl = encodeURIComponent(getAppUrl());
  
  if (walletType === 'phantom') {
    // Phantom deep link to open dApp in their browser
    return `https://phantom.app/ul/browse/${appUrl}?ref=wordmint`;
  } else {
    // Solflare deep link to open dApp in their browser
    return `https://solflare.com/ul/browse/${appUrl}?ref=wordmint`;
  }
}

/**
 * Checks if a wallet provider is available (mobile in-app browser)
 */
export function isWalletAvailable(): boolean {
  return getMobileWalletProvider() !== null;
}

/**
 * Connect to mobile wallet
 * This only works if user is in the wallet's in-app browser
 */
export async function connectMobileWallet(): Promise<string> {
  const provider = getMobileWalletProvider();
  
  if (!provider) {
    throw new Error('No wallet provider found. Please open this app in your wallet\'s browser.');
  }
  
  try {
    // Request connection
    const response = await provider.connect();
    
    // Get public key
    let publicKey: string;
    if (response.publicKey) {
      publicKey = typeof response.publicKey === 'string' 
        ? response.publicKey 
        : response.publicKey.toString();
    } else if (provider.publicKey) {
      publicKey = typeof provider.publicKey === 'string'
        ? provider.publicKey
        : provider.publicKey.toString();
    } else {
      throw new Error('No public key returned from wallet');
    }
    
    return publicKey;
  } catch (error: any) {
    // Don't log rejection errors - they're expected user behavior
    const isRejection = 
      error.message?.includes('rejected') || 
      error.message?.includes('User rejected') ||
      error.message?.includes('User cancelled') ||
      error.message?.includes('User denied') ||
      error.code === 4001;
    
    if (!isRejection) {
      console.error('Mobile wallet connection error:', error);
    }
    
    throw new Error(error.message || 'Failed to connect wallet');
  }
}

/**
 * Disconnect from mobile wallet
 */
export async function disconnectMobileWallet(): Promise<void> {
  const provider = getMobileWalletProvider();
  
  if (!provider) {
    return;
  }
  
  try {
    if (provider.disconnect) {
      await provider.disconnect();
    }
  } catch (error) {
    console.error('Mobile wallet disconnect error:', error);
  }
}

/**
 * Sets up event listeners for mobile wallet
 */
export function setupMobileWalletListeners(
  onConnect: (publicKey: string) => void,
  onDisconnect: () => void,
  onAccountChanged: (publicKey: string | null) => void
): () => void {
  const provider = getMobileWalletProvider();
  
  if (!provider) {
    return () => {};
  }
  
  const handleConnect = () => {
    if (provider.publicKey) {
      const publicKey = typeof provider.publicKey === 'string'
        ? provider.publicKey
        : provider.publicKey.toString();
      onConnect(publicKey);
    }
  };
  
  const handleDisconnect = () => {
    onDisconnect();
  };
  
  const handleAccountChanged = (publicKey: any) => {
    if (publicKey) {
      const pubKeyStr = typeof publicKey === 'string'
        ? publicKey
        : publicKey.toString();
      onAccountChanged(pubKeyStr);
    } else {
      onAccountChanged(null);
    }
  };
  
  // Set up listeners
  provider.on?.('connect', handleConnect);
  provider.on?.('disconnect', handleDisconnect);
  provider.on?.('accountChanged', handleAccountChanged);
  
  // Return cleanup function
  return () => {
    provider.off?.('connect', handleConnect);
    provider.off?.('disconnect', handleDisconnect);
    provider.off?.('accountChanged', handleAccountChanged);
  };
}