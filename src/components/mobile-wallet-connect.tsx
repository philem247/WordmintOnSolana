/**
 * Mobile Wallet Connection Component
 * 
 * Implements the best possible mobile wallet connection flow:
 * 1. In-app browser detection (primary - most reliable)
 * 2. Deep link connection (fallback - for external browsers)
 * 3. Return handling (seamless - after approval in wallet app)
 * 
 * Supports: Phantom & Solflare on iOS and Android
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { MobileWalletProtocol } from '../utils/mobile-wallet-protocol';

// ============================================
// TYPE DEFINITIONS
// ============================================

type MobileConnectionState =
  | 'detecting'           // Detecting wallet availability
  | 'in-app-ready'        // In wallet's browser, ready to connect
  | 'external-browser'    // In external browser, need deep link
  | 'connecting-in-app'   // Connecting via injected provider
  | 'initiating-deep-link' // Opening wallet app
  | 'waiting-return'      // Waiting for user to return from wallet
  | 'processing-return'   // Processing wallet response
  | 'connected'           // Successfully connected
  | 'rejected'            // User rejected connection
  | 'error';              // Connection error

interface MobileWalletConnectProps {
  onConnected: (publicKey: string) => void;
  onError?: (error: string) => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MobileWalletConnect({ onConnected, onError }: MobileWalletConnectProps) {
  const [state, setState] = useState<MobileConnectionState>('detecting');
  const [walletProvider, setWalletProvider] = useState<'phantom' | 'solflare' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  
  // ============================================
  // INITIALIZATION
  // ============================================
  
  useEffect(() => {
    initializeMobileWallet();
  }, []);
  
  async function initializeMobileWallet() {
    console.log('📱 Initializing mobile wallet connection');
    
    // Get current URL for copying
    setCurrentUrl(window.location.href);
    
    // Check if returning from wallet app
    if (MobileWalletProtocol.isReturn()) {
      console.log('🔙 Detected return from wallet app');
      setState('processing-return');
      await handleMobileReturn();
      return;
    }
    
    // Check if in wallet's in-app browser
    if (MobileWalletProtocol.isInAppBrowser()) {
      const provider = MobileWalletProtocol.getProvider();
      console.log(`✅ Detected ${provider} in-app browser`);
      setIsInAppBrowser(true);
      setWalletProvider(provider);
      setState('in-app-ready');
      return;
    }
    
    // External browser - need deep link
    console.log('🌐 External browser detected - deep link required');
    setIsInAppBrowser(false);
    setState('external-browser');
  }
  
  // ============================================
  // CONNECTION HANDLERS
  // ============================================
  
  /**
   * Connect via in-app browser (injected provider)
   * Same as desktop connection, uses window.solana.connect()
   */
  async function connectInAppBrowser() {
    console.log('🔌 Connecting via in-app browser');
    setState('connecting-in-app');
    
    try {
      const publicKey = await MobileWalletProtocol.connectInApp();
      
      // Store connection
      localStorage.setItem('wordmint_wallet', publicKey);
      
      setState('connected');
      onConnected(publicKey);
      
    } catch (error: any) {
      console.error('❌ In-app connection failed:', error);
      
      // Check if user rejected
      if (error.code === 4001 || error.message?.includes('rejected')) {
        setState('rejected');
      } else {
        setErrorMessage(error.message || 'Failed to connect wallet');
        setState('error');
        onError?.(error.message);
      }
    }
  }
  
  /**
   * Connect via deep link (external browser)
   * Opens wallet app, user approves, returns to browser
   */
  async function connectViaDeepLink(wallet: 'phantom' | 'solflare') {
    console.log(`🔗 Initiating deep link to ${wallet}`);
    setState('initiating-deep-link');
    
    try {
      // Create session and redirect
      await MobileWalletProtocol.connectDeepLink(wallet);
      
      // User will leave the page here
      // When they return, handleMobileReturn() will be called
      
    } catch (error: any) {
      console.error('❌ Deep link failed:', error);
      setErrorMessage(error.message || 'Failed to open wallet app');
      setState('error');
      onError?.(error.message);
    }
  }
  
  /**
   * Handle return from wallet app
   * Parses response and extracts public key
   */
  async function handleMobileReturn() {
    console.log('🔙 Processing return from wallet app');
    
    try {
      const response = await MobileWalletProtocol.parseResponse();
      
      if (!response) {
        // User rejected or cancelled
        console.log('ℹ️ Connection cancelled by user');
        MobileWalletProtocol.clearPending();
        MobileWalletProtocol.cleanUrl();
        setState('rejected');
        return;
      }
      
      const { publicKey } = response;
      
      // Store connection
      localStorage.setItem('wordmint_wallet', publicKey);
      
      // Clear session and URL
      MobileWalletProtocol.clearPending();
      MobileWalletProtocol.cleanUrl();
      
      console.log('✅ Mobile wallet connected:', publicKey);
      setState('connected');
      onConnected(publicKey);
      
    } catch (error: any) {
      console.error('❌ Failed to process mobile return:', error);
      setErrorMessage(error.message || 'Failed to process wallet response');
      MobileWalletProtocol.clearPending();
      MobileWalletProtocol.cleanUrl();
      setState('error');
      onError?.(error.message);
    }
  }
  
  /**
   * Retry connection after error
   */
  function retryConnection() {
    setErrorMessage('');
    initializeMobileWallet();
  }
  
  /**
   * Copy current URL to clipboard
   * For users who want to manually paste in wallet browser
   */
  async function copyUrlToClipboard() {
    try {
      await navigator.clipboard.writeText(currentUrl);
      // Show success feedback
      alert('URL copied! Paste it in your wallet\'s browser.');
    } catch (error) {
      console.error('Failed to copy URL:', error);
      // Fallback: show URL for manual copy
      prompt('Copy this URL:', currentUrl);
    }
  }
  
  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {/* STATE: Detecting */}
        {state === 'detecting' && (
          <StateView
            key="detecting"
            icon={<Loader2 className="w-12 h-12 text-purple-400 animate-spin" />}
            title="Detecting Wallet..."
            description="Checking for mobile wallet availability."
          />
        )}
        
        {/* STATE: In-App Browser Ready */}
        {state === 'in-app-ready' && walletProvider && (
          <StateView
            key="in-app-ready"
            icon={<CheckCircle className="w-12 h-12 text-emerald-400" />}
            title={`${walletProvider === 'phantom' ? 'Phantom' : 'Solflare'} Browser Detected`}
            description={`You're in the ${walletProvider === 'phantom' ? 'Phantom' : 'Solflare'} in-app browser. Connect with one tap!`}
            alert={{
              type: 'success',
              message: `🎉 Perfect! You're using ${walletProvider === 'phantom' ? 'Phantom' : 'Solflare'}'s browser. This is the easiest way to connect.`
            }}
            actions={
              <button
                onClick={connectInAppBrowser}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Connect {walletProvider === 'phantom' ? 'Phantom' : 'Solflare'}</span>
              </button>
            }
            devNote={`IN-APP BROWSER: Uses injected window.solana provider. Same as desktop connection.`}
          />
        )}
        
        {/* STATE: External Browser */}
        {state === 'external-browser' && (
          <StateView
            key="external-browser"
            icon={<Smartphone className="w-12 h-12 text-cyan-400" />}
            title="Choose Your Wallet"
            description="Select your preferred mobile wallet to connect. The app will open automatically."
            alert={{
              type: 'info',
              message: '💡 Tip: For the best experience, open this page directly in your wallet\'s browser instead.'
            }}
            actions={
              <div className="space-y-3">
                {/* Phantom Button */}
                <button
                  onClick={() => connectViaDeepLink('phantom')}
                  className="w-full flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-purple-400 transition-all shadow-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-xl">👻</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold">Connect with Phantom</div>
                    <div className="text-xs opacity-75">Most popular Solana wallet</div>
                  </div>
                  <ExternalLink className="w-5 h-5 opacity-75" />
                </button>
                
                {/* Solflare Button */}
                <button
                  onClick={() => connectViaDeepLink('solflare')}
                  className="w-full flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg font-semibold hover:from-orange-500 hover:to-amber-500 transition-all shadow-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-xl">☀️</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold">Connect with Solflare</div>
                    <div className="text-xs opacity-75">Secure Solana wallet</div>
                  </div>
                  <ExternalLink className="w-5 h-5 opacity-75" />
                </button>
                
                {/* Copy URL Option */}
                <button
                  onClick={copyUrlToClipboard}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-700/50 text-slate-300 rounded-lg font-semibold hover:bg-slate-700 transition-all border border-slate-600/50"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy URL to Open in Wallet</span>
                </button>
              </div>
            }
            steps={[
              'Choose your wallet above',
              'Wallet app will open automatically',
              'Approve connection in the app',
              'You\'ll return here automatically'
            ]}
            devNote="DEEP LINK: Generates phantom:// or solflare:// URL. Opens wallet app. Returns via redirect_link."
          />
        )}
        
        {/* STATE: Connecting In-App */}
        {state === 'connecting-in-app' && (
          <StateView
            key="connecting-in-app"
            icon={<Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />}
            title="Connecting..."
            description="Check the popup to approve the connection request."
            alert={{
              type: 'info',
              message: '⏳ Waiting for your approval...',
              loading: true
            }}
            actions={
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-slate-400 rounded-lg font-semibold cursor-not-allowed"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Connecting...</span>
              </button>
            }
            devNote="CONNECTING: await window.solana.connect() pending. User sees wallet approval popup."
          />
        )}
        
        {/* STATE: Initiating Deep Link */}
        {state === 'initiating-deep-link' && (
          <StateView
            key="initiating-deep-link"
            icon={<Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />}
            title="Opening Wallet App..."
            description="Your wallet app should open automatically. If it doesn't, make sure it's installed."
            alert={{
              type: 'info',
              message: '🔄 Redirecting to wallet app...',
              loading: true
            }}
            devNote="REDIRECTING: window.location.href = deepLink. User will leave page."
          />
        )}
        
        {/* STATE: Processing Return */}
        {state === 'processing-return' && (
          <StateView
            key="processing-return"
            icon={<Loader2 className="w-12 h-12 text-purple-400 animate-spin" />}
            title="Processing Connection..."
            description="Verifying your wallet connection. This will only take a moment."
            alert={{
              type: 'info',
              message: '🔓 Decrypting wallet response...',
              loading: true
            }}
            devNote="PROCESSING: Parsing URL params, decrypting public key, verifying session."
          />
        )}
        
        {/* STATE: Connected */}
        {state === 'connected' && (
          <StateView
            key="connected"
            icon={<CheckCircle className="w-12 h-12 text-emerald-400" />}
            title="Wallet Connected!"
            description="Your mobile wallet is now connected to WordMint."
            alert={{
              type: 'success',
              message: '🎉 Success! You can now start playing and earning WMINT tokens.'
            }}
            actions={
              <button
                onClick={() => onConnected(localStorage.getItem('wordmint_wallet') || '')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg"
              >
                <span>Continue to Game</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            }
            devNote="SUCCESS: Wallet connected, public key stored, ready to play."
          />
        )}
        
        {/* STATE: Rejected */}
        {state === 'rejected' && (
          <StateView
            key="rejected"
            icon={<AlertCircle className="w-12 h-12 text-amber-400" />}
            title="Connection Declined"
            description="You declined the wallet connection. No problem, you can try again anytime."
            alert={{
              type: 'warning',
              message: '⚠️ Connection cancelled. You need to connect a wallet to play WordMint.'
            }}
            actions={
              <button
                onClick={retryConnection}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-cyan-500 transition-all shadow-lg"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Try Again</span>
              </button>
            }
            devNote="REJECTED: Error code 4001 or user cancelled. Silent handling, allow retry."
          />
        )}
        
        {/* STATE: Error */}
        {state === 'error' && (
          <StateView
            key="error"
            icon={<AlertCircle className="w-12 h-12 text-red-400" />}
            title="Connection Failed"
            description="There was an error connecting to your wallet. Please try again."
            alert={{
              type: 'error',
              message: errorMessage || 'Unknown error occurred'
            }}
            steps={[
              'Make sure your wallet app is installed',
              'Check your internet connection',
              'Try opening this page in your wallet\'s browser'
            ]}
            actions={
              <button
                onClick={retryConnection}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-cyan-500 transition-all shadow-lg"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Retry Connection</span>
              </button>
            }
            devNote="ERROR: Real error (not rejection). Log to console, allow retry."
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// STATE VIEW COMPONENT
// ============================================

interface StateViewProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  alert?: {
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    loading?: boolean;
  };
  steps?: string[];
  actions?: React.ReactNode;
  devNote: string;
}

function StateView({ icon, title, description, alert, steps, actions, devNote }: StateViewProps) {
  const alertStyles = {
    info: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400'
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm"
    >
      {/* Icon */}
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      
      {/* Title & Description */}
      <h2 className="text-xl font-bold text-white text-center mb-2">{title}</h2>
      <p className="text-slate-400 text-center mb-4 text-sm">{description}</p>
      
      {/* Alert */}
      {alert && (
        <div className={`flex items-start gap-2 p-3 rounded-lg border mb-4 ${alertStyles[alert.type]}`}>
          {alert.loading && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 mt-0.5" />}
          <p className="text-sm flex-1">{alert.message}</p>
        </div>
      )}
      
      {/* Steps */}
      {steps && (
        <div className="bg-slate-900/50 rounded-lg p-3 mb-4 space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-slate-300">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-semibold flex-shrink-0 text-xs">
                {index + 1}
              </div>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Actions */}
      {actions && <div className="mb-4">{actions}</div>}
      
      {/* Developer Note */}
      <div className="p-2 bg-amber-500/10 border-l-4 border-amber-500 rounded text-xs text-amber-400 font-mono">
        <div className="flex items-start gap-2">
          <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block mb-0.5">DEV NOTE:</strong>
            {devNote}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default MobileWalletConnect;
