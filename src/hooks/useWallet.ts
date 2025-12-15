import { useState, useEffect, useCallback } from 'react';
import {
  WalletState,
  WalletInfo,
  detectWallet,
  connectWallet,
  disconnectWallet,
  tryAutoConnect,
  setupWalletListeners,
  shortenAddress
} from '../utils/wallet';
import { 
  isMobileDevice, 
  isWalletAvailable, 
  getMobileWalletProvider,
  setupMobileWalletListeners 
} from '../utils/mobile-wallet-adapter';

/**
 * CUSTOM HOOK: useWallet
 * 
 * This hook manages all wallet connection logic and state transitions.
 * 
 * LIFECYCLE:
 * 1. On mount: Detect wallet and attempt auto-connect
 * 2. Set up event listeners for wallet events
 * 3. Clean up listeners on unmount
 * 
 * STATE MACHINE:
 * not-installed -> detected -> connecting -> connected
 *                          |-> rejected (can retry)
 *                          |-> error (can retry)
 * 
 * WALLET API CALLS:
 * - detectWallet() on mount
 * - tryAutoConnect() if wallet detected
 * - connectWallet() when user clicks connect
 * - disconnectWallet() when user clicks disconnect
 * - Event listeners for disconnect and account changes
 */
export function useWallet() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    state: 'detected', // Initial state, will be updated on mount
    publicKey: null,
    error: null
  });
  
  const [provider, setProvider] = useState<ReturnType<typeof detectWallet>>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  /**
   * STEP 1: Detect wallet on component mount
   * 
   * API CALL: detectWallet() or getMobileWalletProvider()
   * TIMING: Runs once on mount
   * UPDATES: Sets state to 'not-installed' or 'detected'
   */
  useEffect(() => {
    // Don't auto-connect if user just disconnected
    const intentionalDisconnect = localStorage.getItem('wordmint_intentional_disconnect');
    if (intentionalDisconnect === 'true') {
      localStorage.removeItem('wordmint_intentional_disconnect');
      // User intentionally disconnected, don't auto-reconnect
      setWalletInfo({
        state: 'detected',
        publicKey: null,
        error: null
      });
      
      // Still detect the wallet for future connections
      const detected = isMobileDevice() ? getMobileWalletProvider() : detectWallet();
      setProvider(detected);
      return;
    }
    
    // Check if on mobile
    if (isMobileDevice()) {
      // Try to detect mobile wallet provider
      const mobileProvider = getMobileWalletProvider();
      
      if (mobileProvider) {
        // Wallet browser detected
        setProvider(mobileProvider);
        setWalletInfo({
          state: 'detected',
          publicKey: null,
          error: null,
          walletType: 'mobile'
        });
        
        // Try auto-connect if already approved
        tryAutoConnect(mobileProvider).then(publicKey => {
          if (publicKey) {
            setWalletInfo({
              state: 'connected',
              publicKey: shortenAddress(publicKey),
              error: null,
              walletType: 'mobile'
            });
            localStorage.setItem('wordmint_wallet', publicKey);
          }
        });
      } else {
        // No wallet detected, show mobile options
        setWalletInfo({
          state: 'not-installed',
          publicKey: null,
          error: 'No wallet detected. Please use a wallet browser.',
          walletType: 'mobile'
        });
      }
      return;
    }
    
    // Desktop flow
    const detected = detectWallet();
    setProvider(detected);
    
    if (!detected) {
      setWalletInfo({
        state: 'not-installed',
        publicKey: null,
        error: 'No Solana wallet found. Please install Phantom or Solflare.'
      });
      return;
    }
    
    setWalletInfo(prev => ({
      ...prev,
      state: 'detected',
      error: null
    }));
    
    // Try to auto-connect if user previously approved
    tryAutoConnect(detected).then(publicKey => {
      if (publicKey) {
        setWalletInfo({
          state: 'connected',
          publicKey: shortenAddress(publicKey),
          error: null
        });
        
        // Save full public key to localStorage for backend API calls
        localStorage.setItem('wordmint_wallet', publicKey);
      }
    });
  }, []);

  /**
   * STEP 2: Set up wallet event listeners
   * 
   * API CALLS: provider.on('connect'), provider.on('disconnect'), provider.on('accountChanged')
   * TIMING: After wallet is detected
   * CLEANUP: Automatically removes listeners on unmount
   */
  useEffect(() => {
    if (!provider || isDisconnecting) return;
    
    // Use mobile or desktop listeners depending on platform
    const cleanup = isMobileDevice() 
      ? setupMobileWalletListeners(
          (publicKey) => {
            if (!isDisconnecting) {
              console.log('Mobile wallet connected:', publicKey);
              setWalletInfo({
                state: 'connected',
                publicKey: shortenAddress(publicKey),
                error: null,
                walletType: 'mobile'
              });
              localStorage.setItem('wordmint_wallet', publicKey);
            }
          },
          () => {
            console.log('Mobile wallet disconnected');
            setWalletInfo({
              state: 'detected',
              publicKey: null,
              error: null,
              walletType: 'mobile'
            });
            localStorage.removeItem('wordmint_wallet');
          },
          (publicKey) => {
            console.log('Mobile account changed:', publicKey);
            if (publicKey) {
              setWalletInfo({
                state: 'connected',
                publicKey: shortenAddress(publicKey),
                error: null,
                walletType: 'mobile'
              });
              localStorage.setItem('wordmint_wallet', publicKey);
            } else {
              setWalletInfo({
                state: 'detected',
                publicKey: null,
                error: null,
                walletType: 'mobile'
              });
              localStorage.removeItem('wordmint_wallet');
            }
          }
        )
      : setupWalletListeners(provider, {
          onConnect: (publicKey) => {
            if (!isDisconnecting) {
              console.log('Wallet connected:', publicKey);
              setWalletInfo({
                state: 'connected',
                publicKey: shortenAddress(publicKey),
                error: null
              });
              localStorage.setItem('wordmint_wallet', publicKey);
            }
          },
          
          onDisconnect: () => {
            console.log('Wallet disconnected');
            setWalletInfo({
              state: 'detected',
              publicKey: null,
              error: null
            });
            localStorage.removeItem('wordmint_wallet');
          },
          
          onAccountChanged: (publicKey) => {
            console.log('Account changed:', publicKey);
            if (publicKey) {
              setWalletInfo({
                state: 'connected',
                publicKey: shortenAddress(publicKey),
                error: null
              });
              localStorage.setItem('wordmint_wallet', publicKey);
            } else {
              setWalletInfo({
                state: 'detected',
                publicKey: null,
                error: null
              });
              localStorage.removeItem('wordmint_wallet');
            }
          }
        });
    
    return cleanup;
  }, [provider, isDisconnecting]);

  /**
   * FUNCTION: handleConnect
   * 
   * API CALL: connectWallet(provider)
   * USER ACTION: User clicks "Connect Wallet" button
   * 
   * STATE TRANSITION:
   * detected -> connecting -> connected (success)
   * detected -> connecting -> rejected (user cancels)
   * detected -> connecting -> error (failure)
   */
  const handleConnect = useCallback(async () => {
    if (!provider) return;
    
    // STATE UPDATE: Start connecting
    setWalletInfo(prev => ({
      ...prev,
      state: 'connecting',
      error: null
    }));
    
    try {
      // WALLET API CALL: Request connection
      const publicKey = await connectWallet(provider);
      
      // STATE UPDATE: Connection successful
      setWalletInfo({
        state: 'connected',
        publicKey: shortenAddress(publicKey),
        error: null
      });
      
      // Save full public key to localStorage for backend API calls
      localStorage.setItem('wordmint_wallet', publicKey);
      
    } catch (error: any) {
      // Check if user rejected the connection
      const isRejection = 
        error.message?.includes('rejected') || 
        error.message?.includes('User rejected') ||
        error.message?.includes('User cancelled') ||
        error.message?.includes('User denied') ||
        error.code === 4001; // Standard rejection code
      
      if (isRejection) {
        // User chose not to connect - not really an error
        // Don't log to console, this is expected user behavior
        setWalletInfo({
          state: 'detected',
          publicKey: null,
          error: null // Don't show error for user cancellation
        });
      } else {
        // Actual error occurred - log it for debugging
        console.error('Wallet connection error:', error);
        setWalletInfo({
          state: 'error',
          publicKey: null,
          error: error.message || 'Failed to connect wallet'
        });
      }
    }
  }, [provider]);

  /**
   * FUNCTION: handleDisconnect
   * 
   * API CALL: disconnectWallet(provider)
   * USER ACTION: Programmatic disconnect
   * 
   * STATE TRANSITION:
   * connected -> detected
   */
  const handleDisconnect = useCallback(async () => {
    if (!provider) return;
    
    try {
      // Set flag to prevent auto-reconnect
      setIsDisconnecting(true);
      localStorage.setItem('wordmint_intentional_disconnect', 'true');
      
      // WALLET API CALL: Disconnect from wallet
      await disconnectWallet(provider);
      
      // Clear all wallet data
      setWalletInfo({
        state: 'detected',
        publicKey: null,
        error: null
      });
      
      localStorage.removeItem('wordmint_wallet');
      
      // Reset disconnecting flag after a delay
      setTimeout(() => {
        setIsDisconnecting(false);
      }, 1000);
      
    } catch (error: any) {
      console.error('Wallet disconnect error:', error);
      setWalletInfo(prev => ({
        ...prev,
        error: error.message
      }));
      setIsDisconnecting(false);
    }
  }, [provider]);

  /**
   * FUNCTION: getFullPublicKey
   * 
   * UTILITY: Get the full public key (not shortened) from localStorage
   * USE CASE: For backend API calls that need the full address
   */
  const getFullPublicKey = useCallback(() => {
    return localStorage.getItem('wordmint_wallet');
  }, []);

  return {
    ...walletInfo,
    connect: handleConnect,
    disconnect: handleDisconnect,
    getFullPublicKey,
    isConnected: walletInfo.state === 'connected',
    isConnecting: walletInfo.state === 'connecting',
    hasWallet: walletInfo.state !== 'not-installed'
  };
}