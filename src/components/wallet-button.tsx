import { Wallet, AlertCircle, ExternalLink, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WalletState, WALLET_URLS } from '../utils/wallet';
import { MobileWalletConnect } from './mobile-wallet-connect';
import { useState, useEffect } from 'react';

interface WalletButtonProps {
  state: WalletState;
  publicKey: string | null;
  error: string | null;
  onConnect: () => void;
  onDisconnect?: () => void;
  onMobileConnect?: (publicKey: string) => void;
  onError?: (error: string) => void;
}

/**
 * WALLET BUTTON COMPONENT
 * 
 * Handles wallet connection UI for both desktop and mobile
 * 
 * STATES:
 * - not-installed: No wallet detected (shows install links or mobile options)
 * - detected: Wallet found but not connected
 * - connecting: Connection in progress
 * - connected: Wallet successfully connected
 * - rejected: User rejected the connection
 * - error: Connection failed
 */
export function WalletButton({ 
  state, 
  publicKey, 
  error, 
  onConnect, 
  onDisconnect,
  onMobileConnect,
  onError
}: WalletButtonProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile device
  useEffect(() => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);
  
  // STATE: Wallet not installed
  if (state === 'not-installed') {
    // Mobile: Show mobile wallet connection component
    if (isMobile && onMobileConnect && onError) {
      return <MobileWalletConnect onConnected={onMobileConnect} onError={onError} />;
    }
    
    // Desktop: Show install prompt
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-300 mb-1">No Solana wallet detected</p>
              <p className="text-xs text-amber-400/70">
                Install Phantom or Solflare to play WordMint
              </p>
            </div>
          </div>
        </div>
        
        <a
          href={WALLET_URLS.phantom}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all"
        >
          <Wallet className="w-5 h-5" />
          <span>Install Phantom Wallet</span>
          <ExternalLink className="w-4 h-4" />
        </a>
        
        <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
          <a 
            href={WALLET_URLS.solflare}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-400 transition-colors"
          >
            Get Solflare
          </a>
          <span>•</span>
          <a 
            href={WALLET_URLS.docs}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-400 transition-colors"
          >
            Learn about wallets
          </a>
        </div>
      </div>
    );
  }
  
  // STATE: Connection rejected (user canceled)
  if (state === 'rejected') {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/50">
          <p className="text-sm text-slate-400 text-center">
            Connection cancelled. Ready to try again?
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onConnect}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
        >
          <div className="flex items-center justify-center gap-3">
            <Wallet className="w-5 h-5" />
            <span>Try Again</span>
          </div>
        </motion.button>
      </div>
    );
  }
  
  // STATE: Detected (ready to connect)
  if (state === 'detected') {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onConnect}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
      >
        <div className="flex items-center justify-center gap-3">
          <Wallet className="w-5 h-5" />
          <span>Connect Wallet</span>
        </div>
      </motion.button>
    );
  }
  
  // STATE: Connection pending (user approval)
  if (state === 'connecting') {
    return (
      <div className="space-y-4">
        {/* 
          DEVELOPER NOTE:
          This state displays while waiting for:
          - User to approve connection in wallet popup
          - provider.connect() Promise to resolve
          
          The wallet popup is handled by the wallet extension,
          not by our code. We just show loading UI.
        */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <Loader2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
            <div className="flex-1">
              <p className="text-sm text-blue-300 mb-1">Waiting for approval...</p>
              <p className="text-xs text-blue-400/70">
                Check your wallet popup to approve the connection
              </p>
            </div>
          </div>
        </div>
        
        <button
          disabled
          className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-slate-700 text-slate-400 cursor-not-allowed"
        >
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Connecting...</span>
        </button>
        
        <p className="text-xs text-center text-slate-500">
          Pending wallet approval
        </p>
      </div>
    );
  }
  
  // STATE: Connection error
  if (state === 'error') {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-300 mb-1">Connection failed</p>
              <p className="text-xs text-red-400/70">
                {error || 'An unexpected error occurred while connecting'}
              </p>
            </div>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onConnect}
          className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
        >
          <Wallet className="w-5 h-5" />
          <span>Retry Connection</span>
        </motion.button>
        
        <p className="text-xs text-center text-slate-500">
          Make sure your wallet is unlocked and try again
        </p>
      </div>
    );
  }
  
  // STATE: Connected
  if (state === 'connected' && publicKey) {
    return (
      <div className="space-y-4">
        {/* 
          DEVELOPER NOTE:
          Wallet is now connected. The publicKey can be used for:
          - Signing transactions
          - Identifying the user
          - Storing game data associated with this address
        */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <p className="text-xs text-emerald-400/70 mb-0.5">Connected Wallet</p>
                <p className="font-mono text-sm text-emerald-300">{publicKey}</p>
              </div>
            </div>
          </div>
        </div>
        
        {onDisconnect && (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDisconnect}
              className="w-full py-3 rounded-xl bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-all border border-slate-700/50"
            >
              Disconnect Wallet
            </motion.button>
            
            <p className="text-xs text-center text-slate-500">
              Your progress is saved to this wallet
            </p>
          </>
        )}
      </div>
    );
  }
  
  return null;
}