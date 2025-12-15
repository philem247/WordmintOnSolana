/**
 * Mobile Wallet Redirect Flow
 * 
 * Handles the flow of:
 * 1. User in Safari/Chrome clicks "Connect"
 * 2. Redirect to Phantom app for approval
 * 3. Phantom redirects back to Safari/Chrome
 * 4. Session is restored with wallet connected
 */

import { encryptSession, decryptSession } from './session-crypto';

export interface WalletSession {
  publicKey: string;
  timestamp: number;
  appId: string;
}

const SESSION_KEY = 'wordmint_wallet_session';
const PENDING_CONNECTION_KEY = 'wordmint_pending_connection';

/**
 * Generate a unique session ID for this connection request
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get the current app URL with optional path
 */
export function getAppUrl(path: string = ''): string {
  if (typeof window === 'undefined') return '';
  const { protocol, host } = window.location;
  return `${protocol}//${host}${path}`;
}

/**
 * Create a deep link to connect wallet in Phantom app
 * with a return URL back to this browser
 */
export function createPhantomConnectLink(): string {
  // Store that we're attempting a connection
  const sessionId = generateSessionId();
  localStorage.setItem(PENDING_CONNECTION_KEY, sessionId);
  
  // The URL Phantom should redirect back to after connection
  const redirectUrl = getAppUrl('/?phantom_connect=true');
  
  // Phantom's connect deep link with redirect
  const appUrl = encodeURIComponent(getAppUrl());
  const redirect = encodeURIComponent(redirectUrl);
  
  // Universal link format that works on both iOS and Android
  return `https://phantom.app/ul/v1/connect?app_url=${appUrl}&redirect_link=${redirect}&ref=wordmint`;
}

/**
 * Create a deep link to connect wallet in Solflare app
 */
export function createSolflareConnectLink(): string {
  const sessionId = generateSessionId();
  localStorage.setItem(PENDING_CONNECTION_KEY, sessionId);
  
  const redirectUrl = getAppUrl('/?solflare_connect=true');
  const appUrl = encodeURIComponent(getAppUrl());
  const redirect = encodeURIComponent(redirectUrl);
  
  return `https://solflare.com/ul/v1/connect?app_url=${appUrl}&redirect_link=${redirect}&ref=wordmint`;
}

/**
 * Save wallet session after successful connection
 */
export function saveWalletSession(publicKey: string): void {
  const session: WalletSession = {
    publicKey,
    timestamp: Date.now(),
    appId: 'wordmint'
  };
  
  // Store in localStorage
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  
  // Also store the simple wallet address for backward compatibility
  localStorage.setItem('wordmint_wallet', publicKey);
  
  // Clear pending connection flag
  localStorage.removeItem(PENDING_CONNECTION_KEY);
}

/**
 * Get saved wallet session
 */
export function getWalletSession(): WalletSession | null {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;
    
    const session: WalletSession = JSON.parse(sessionData);
    
    // Check if session is less than 24 hours old
    const now = Date.now();
    const sessionAge = now - session.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxAge) {
      // Session expired
      clearWalletSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error reading wallet session:', error);
    return null;
  }
}

/**
 * Clear wallet session (disconnect)
 */
export function clearWalletSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('wordmint_wallet');
  localStorage.removeItem(PENDING_CONNECTION_KEY);
}

/**
 * Check if we just returned from a wallet app
 */
export function checkWalletReturn(): { 
  isReturn: boolean; 
  wallet: 'phantom' | 'solflare' | null;
  publicKey: string | null;
} {
  if (typeof window === 'undefined') {
    return { isReturn: false, wallet: null, publicKey: null };
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check for Phantom return
  if (urlParams.has('phantom_connect')) {
    const publicKey = urlParams.get('phantom_public_key') || null;
    
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    return { isReturn: true, wallet: 'phantom', publicKey };
  }
  
  // Check for Solflare return
  if (urlParams.has('solflare_connect')) {
    const publicKey = urlParams.get('solflare_public_key') || null;
    
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    return { isReturn: true, wallet: 'solflare', publicKey };
  }
  
  return { isReturn: false, wallet: null, publicKey: null };
}

/**
 * Check if there's a pending connection attempt
 */
export function hasPendingConnection(): boolean {
  return localStorage.getItem(PENDING_CONNECTION_KEY) !== null;
}

/**
 * Open Phantom app for wallet connection
 */
export function openPhantomForConnection(): void {
  const link = createPhantomConnectLink();
  window.location.href = link;
}

/**
 * Open Solflare app for wallet connection
 */
export function openSolflareForConnection(): void {
  const link = createSolflareConnectLink();
  window.location.href = link;
}
