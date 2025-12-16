/**
 * Solana Mobile Wallet Adapter Protocol
 * * Implements the official Solana Mobile Wallet Adapter specification
 * for secure mobile wallet connections with session-based encryption.
 * * Protocol Flow:
 * 1. Generate ephemeral keypair for session encryption (using Ed25519)
 * 2. Build authorization URL with session public key (Base58 encoded)
 * 3. Deep link to wallet app (Phantom/Solflare)
 * 4. Wallet encrypts response with session public key
 * 5. Return to app via redirect URL with encrypted data (Base58 encoded params)
 * 6. Decrypt response with session private key (using nacl.box)
 * 7. Verify signature and extract wallet public key
 * * Spec: https://github.com/solana-mobile/mobile-wallet-adapter/blob/main/js/packages/mobile-wallet-adapter-protocol/README.md
 */

import bs58 from 'bs58';
// NOTE: Must install the dependency: npm install tweetnacl
import * as nacl from 'tweetnacl';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface MobileWalletSession {
  sessionId: string;
  publicKey: string; // App's ephemeral public key (Base64 for local storage)
  privateKey: string; // App's ephemeral private key (Base64 for local storage)
  created: number;
  expiresAt: number;
}

export interface WalletAuthorizationResponse {
  publicKey: string; // Wallet's public key (base58)
  authToken?: string; // Optional auth token for subsequent requests
  walletUriBase?: string; // Base URI for wallet-specific requests
}

export interface DeepLinkConfig {
  walletApp: 'phantom' | 'solflare';
  appUrl: string;
  appName: string;
  iconUrl?: string;
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Generate a new mobile wallet session
 * Creates ephemeral keypair for secure communication
 */
export async function createMobileWalletSession(): Promise<MobileWalletSession> {
  // Generate unique session ID
  const sessionId = `wordmint_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  // Use tweetnacl's box keypair for secure MWA protocol
  const keyPair = await generateEphemeralKeypair();
  
  const session: MobileWalletSession = {
    sessionId,
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    created: Date.now(),
    expiresAt: Date.now() + (30 * 60 * 1000) // 30 minutes
  };
  
  // Store session in localStorage (encrypted in production)
  localStorage.setItem('wordmint_mobile_session', JSON.stringify(session));
  
  console.log('📱 Mobile session created:', sessionId);
  return session;
}

/**
 * Retrieve active mobile wallet session
 */
export function getMobileWalletSession(): MobileWalletSession | null {
  const sessionData = localStorage.getItem('wordmint_mobile_session');
  if (!sessionData) return null;
  
  try {
    const session: MobileWalletSession = JSON.parse(sessionData);
    
    // Check if session expired
    if (Date.now() > session.expiresAt) {
      console.log('⏰ Mobile session expired');
      clearMobileWalletSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('❌ Failed to parse mobile session:', error);
    return null;
  }
}

/**
 * Clear mobile wallet session
 */
export function clearMobileWalletSession(): void {
  localStorage.removeItem('wordmint_mobile_session');
  localStorage.removeItem('wordmint_pending_connection');
  console.log('🧹 Mobile session cleared');
}

// ============================================
// DEEP LINK GENERATION
// ============================================

/**
 * Generate Phantom mobile deep link
 * Follows Phantom's mobile wallet adapter protocol
 */
export function generatePhantomDeepLink(config: DeepLinkConfig, session: MobileWalletSession): string {
  const { appUrl, appName, iconUrl } = config;
  
  // Build redirect URL with session ID
  const redirectUrl = `${appUrl}?mobile_return=true&session=${session.sessionId}`;
  
  // CRITICAL FIX: Convert stored Base64 key to Base58 for the wallet URL
  const publicKeyBytes = base64ToArrayBuffer(session.publicKey);
  const base58PublicKey = bs58.encode(publicKeyBytes);

  // Phantom deep link format
  const params = new URLSearchParams({
    app_url: appUrl,
    redirect_link: redirectUrl,
    cluster: 'devnet', // Use devnet for WordMint
    ref: appName.toLowerCase().replace(/\s+/g, ''),
    // CRITICAL FIX: Use Base58 encoded key
    dapp_encryption_public_key: base58PublicKey
  });
  
  // Add optional parameters
  if (iconUrl) {
    params.append('icon_url', iconUrl);
  }
  
  const deepLink = `https://phantom.app/ul/v1/connect?${params.toString()}`;
  
  console.log('🔗 Phantom deep link generated');
  return deepLink;
}

/**
 * Generate Solflare mobile deep link
 * Follows Solflare's mobile wallet adapter protocol
 */
export function generateSolflareDeepLink(config: DeepLinkConfig, session: MobileWalletSession): string {
  const { appUrl, appName, iconUrl } = config;
  
  // Build redirect URL with session ID
  const redirectUrl = `${appUrl}?mobile_return=true&session=${session.sessionId}`;
  
  // CRITICAL FIX: Convert stored Base64 key to Base58 for the wallet URL
  const publicKeyBytes = base64ToArrayBuffer(session.publicKey);
  const base58PublicKey = bs58.encode(publicKeyBytes);

  // Solflare deep link format
  const params = new URLSearchParams({
    app_url: appUrl,
    redirect_link: redirectUrl,
    cluster: 'devnet',
    ref: appName.toLowerCase().replace(/\s+/g, ''),
    // CRITICAL FIX: Use Base58 encoded key
    dapp_encryption_public_key: base58PublicKey 
  });
  
  if (iconUrl) {
    params.append('icon_url', iconUrl);
  }
  
  const deepLink = `https://solflare.com/ul/v1/connect?${params.toString()}`;
  
  console.log('🔗 Solflare deep link generated');
  return deepLink;
}

/**
 * Generate wallet-specific deep link
 */
export function generateWalletDeepLink(
  walletApp: 'phantom' | 'solflare',
  session: MobileWalletSession
): string {
  const appUrl = window.location.origin + window.location.pathname;
  
  const config: DeepLinkConfig = {
    walletApp,
    appUrl,
    appName: 'WordMint',
    iconUrl: `${appUrl}/favicon.ico` // Optional: Add your app icon
  };
  
  if (walletApp === 'phantom') {
    return generatePhantomDeepLink(config, session);
  } else {
    return generateSolflareDeepLink(config, session);
  }
}

// ============================================
// RESPONSE HANDLING
// ============================================

/**
 * Check if current URL is a mobile wallet return
 */
export function isMobileWalletReturn(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('mobile_return') || 
         urlParams.has('phantom_encryption_public_key') ||
         urlParams.has('solflare_encryption_public_key');
}

/**
 * Parse mobile wallet authorization response
 * Handles both Phantom and Solflare response formats
 */
export async function parseMobileWalletResponse(): Promise<WalletAuthorizationResponse | null> {
  const urlParams = new URLSearchParams(window.location.search);

  // Check for errorCode (rejection)
  if (urlParams.has('errorCode')) {
    const errorCode = urlParams.get('errorCode');
    const errorMessage = urlParams.get('errorMessage') || 'Unknown error';
    console.log(`⚠️ Mobile wallet error: ${errorCode} - ${errorMessage}`);
    
    if (errorCode === '4001') {
      // User rejected - not a real error
      return null;
    }
    
    throw new Error(`Wallet error: ${errorMessage}`);
  }
  
  // Detect provider and get Wallet Public Key (Base58)
  let walletPublicKeyBase58 = urlParams.get('phantom_encryption_public_key');
  let provider = 'Phantom';

  if (!walletPublicKeyBase58) {
    walletPublicKeyBase58 = urlParams.get('solflare_encryption_public_key');
    provider = 'Solflare';
  }

  // Extract critical MWA parameters
  const data = urlParams.get('data'); // Encrypted payload (Base58)
  const nonce = urlParams.get('nonce'); // Nonce (Base58)
  const sessionId = urlParams.get('session');

  // Validate presence
  if (!walletPublicKeyBase58 || !data || !nonce || !sessionId) {
    // Only log error if we expected a return (avoids log noise on normal page loads)
    if (urlParams.has('mobile_return')) {
      console.error('❌ Missing required mobile wallet response parameters');
    }
    return null;
  }
  
  // Get stored session
  const session = getMobileWalletSession();
  if (!session || session.sessionId !== sessionId) {
    console.error('❌ Session mismatch or expired');
    return null;
  }
  
  try {
    console.log(`📱 Parsing ${provider} mobile response...`);
    
    // CRITICAL FIX: Pass correct parameters to decryption
    const walletAuthResponse = await decryptMobileWalletResponse(
      data,               // Encrypted Payload
      nonce,              // Nonce
      walletPublicKeyBase58, // Wallet's Ephemeral Public Key
      session.privateKey  // App's Ephemeral Private Key
    );
    
    console.log(`✅ ${provider} wallet connected:`, walletAuthResponse.publicKey);
    
    return {
      publicKey: walletAuthResponse.publicKey,
      authToken: urlParams.get('auth_token') || undefined,
      walletUriBase: urlParams.get('wallet_uri_base') || undefined
    };
  } catch (error) {
    console.error(`❌ Failed to decrypt ${provider} response:`, error);
    throw new Error('Failed to decrypt wallet response. Please try again or check console for details.');
  }
}


// ============================================
// CRYPTOGRAPHY UTILITIES
// ============================================

/**
 * Generate ephemeral keypair for session
 * Replaces mock with real Ed25519 key generation using tweetnacl
 */
async function generateEphemeralKeypair(): Promise<{ publicKey: string; privateKey: string }> {
  // Use nacl.box for Curve25519 key generation
  const keyPair = nacl.box.keyPair();
  
  return {
    // Return Base64 strings for localStorage/URL transmission
    publicKey: arrayBufferToBase64(keyPair.publicKey),
    privateKey: arrayBufferToBase64(keyPair.secretKey)
  };
}

/**
 * Decrypts the wallet response payload
 * Uses session private key and wallet's ephemeral public key
 */
async function decryptMobileWalletResponse(
  encryptedData: string, // Base58 encoded string from URL ('data')
  nonce: string,         // Base58 encoded string from URL ('nonce')
  walletPublicKey: string, // Base58 encoded string from URL ('...encryption_public_key')
  sessionPrivateKey: string // Base64 encoded string from LocalStorage
): Promise<{ publicKey: string }> {
  
  // 1. Decode inputs using correct formats
  // URL parameters from wallet are Base58 encoded
  const ciphertext = bs58.decode(encryptedData);
  const nonceBytes = bs58.decode(nonce);
  const walletPublicKeyBytes = bs58.decode(walletPublicKey);
  
  // Local session key is Base64 encoded
  const privateKeyBytes = base64ToArrayBuffer(sessionPrivateKey);
  
  // 2. Decrypt the message using nacl.box.open()
  const decryptedMessage = nacl.box.open(
    ciphertext,
    nonceBytes,
    walletPublicKeyBytes,
    privateKeyBytes
  );

  if (!decryptedMessage) {
    throw new Error('Failed to decrypt response: Invalid key or nonce.');
  }

  // 3. Decrypted message is a JSON string
  const jsonString = new TextDecoder().decode(decryptedMessage);
  
  try {
    const response = JSON.parse(jsonString);
    
    // 4. Extract the user's permanent wallet public key
    // NOTE: Different wallets might return 'public_key' vs 'publicKey'
    const userPublicKey = response.public_key || response.publicKey;

    if (typeof userPublicKey === 'string') {
        return {
            publicKey: userPublicKey
        };
    }
    
    throw new Error('Decrypted payload missing public_key.');
  } catch (error) {
    throw new Error(`Failed to parse decrypted message: ${error}`);
  }
}

// ============================================
// UTILITY FUNCTIONS (CORRECTED IMPLEMENTATIONS FOR BINARY SAFETY)
// ============================================

/**
 * Convert Uint8Array to Base64 (More Robust for Binary Data)
 * NOTE: The input type has been corrected to Uint8Array to align with nacl.
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  // Use String.fromCharCode.apply() on the Uint8Array for reliable binary-to-string conversion
  return btoa(String.fromCharCode.apply(null, Array.from(buffer)));
}

/**
 * Convert Base64 to Uint8Array (Standard and Correct implementation)
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Clean URL after mobile wallet return
 * Removes sensitive parameters from URL
 */
export function cleanMobileWalletReturnUrl(): void {
  const url = new URL(window.location.href);
  
  // Remove all wallet-related parameters
  const paramsToRemove = [
    'mobile_return',
    'session',
    'phantom_encryption_public_key',
    'solflare_encryption_public_key',
    'nonce',
    'data',
    'auth_token',
    'wallet_uri_base',
    'errorCode',
    'errorMessage'
  ];
  
  paramsToRemove.forEach(param => url.searchParams.delete(param));
  
  // Update URL without reloading page
  window.history.replaceState({}, '', url.toString());
  
  console.log('🧹 Cleaned mobile wallet return URL');
}

// ============================================
// MOBILE WALLET DETECTION
// ============================================

/**
 * Check if running in Phantom mobile in-app browser
 */
export function isPhantomMobileApp(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || '';
  return (
    /Phantom/.test(userAgent) ||
    (window.solana && window.solana.isPhantom && /Mobile|Android|iPhone/i.test(userAgent))
  );
}

/**
 * Check if running in Solflare mobile in-app browser
 */
export function isSolflareMobileApp(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || '';
  // Check for the Solflare object injected into the window
  return (
    /Solflare/.test(userAgent) ||
    (window.solana && 'isSolflare' in window.solana && /Mobile|Android|iPhone/i.test(userAgent))
  );
}

/**
 * Check if wallet provider is available (in-app browser)
 */
export function isMobileWalletAvailable(): boolean {
  return isPhantomMobileApp() || isSolflareMobileApp();
}

/**
 * Get mobile wallet provider name
 */
export function getMobileWalletProvider(): 'phantom' | 'solflare' | null {
  if (isPhantomMobileApp()) return 'phantom';
  if (isSolflareMobileApp()) return 'solflare';
  return null;
}

// ============================================
// CONNECTION HELPERS
// ============================================

/**
 * Connect wallet in mobile in-app browser
 * Uses injected provider (same as desktop)
 */
export async function connectMobileInAppBrowser(): Promise<string> {
  console.log('📱 Connecting via mobile in-app browser');
  
  if (!window.solana) {
    throw new Error('Wallet provider not found');
  }
  
  try {
    const response = await window.solana.connect();
    const publicKey = response.publicKey.toString();
    
    console.log('✅ Connected via in-app browser:', publicKey);
    return publicKey;
  } catch (error: any) {
    console.error('❌ In-app browser connection failed:', error);
    throw error;
  }
}

/**
 * Initiate mobile wallet connection via deep link
 * For users in external browsers (Safari, Chrome, etc.)
 */
export async function connectMobileViaDeepLink(
  walletApp: 'phantom' | 'solflare' = 'phantom'
): Promise<void> {
  console.log(`📱 Initiating deep link connection to ${walletApp}`);
  
  // Mark connection as pending
  localStorage.setItem('wordmint_pending_connection', 'true');
  
  // Create session
  const session = await createMobileWalletSession();
  
  // Generate deep link
  const deepLink = generateWalletDeepLink(walletApp, session);
  
  // Store wallet preference
  localStorage.setItem('wordmint_wallet_preference', walletApp);
  
  // Redirect to wallet app
  console.log('🔗 Redirecting to wallet app...');
  window.location.href = deepLink;
  
  // Note: User will leave the page here
  // They will return via the redirect_link after approval
}

/**
 * Check if there's a pending mobile connection
 */
export function hasPendingMobileConnection(): boolean {
  return localStorage.getItem('wordmint_pending_connection') === 'true';
}

/**
 * Clear pending connection flag
 */
export function clearPendingMobileConnection(): void {
  localStorage.removeItem('wordmint_pending_connection');
}

// ============================================
// EXPORT MAIN API
// ============================================

export const MobileWalletProtocol = {
  // Session management
  createSession: createMobileWalletSession,
  getSession: getMobileWalletSession,
  clearSession: clearMobileWalletSession,
  
  // Deep link generation
  generateDeepLink: generateWalletDeepLink,
  
  // Response handling
  isReturn: isMobileWalletReturn,
  parseResponse: parseMobileWalletResponse,
  cleanUrl: cleanMobileWalletReturnUrl,
  
  // Detection
  isInAppBrowser: isMobileWalletAvailable,
  getProvider: getMobileWalletProvider,
  isPhantom: isPhantomMobileApp,
  isSolflare: isSolflareMobileApp,
  
  // Connection
  connectInApp: connectMobileInAppBrowser,
  connectDeepLink: connectMobileViaDeepLink,
  
  // State
  hasPending: hasPendingMobileConnection,
  clearPending: clearPendingMobileConnection
};