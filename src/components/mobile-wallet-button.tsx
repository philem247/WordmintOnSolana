import { Smartphone, ExternalLink, Chrome, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  isWalletAvailable, 
  connectMobileWallet,
  isPhantomMobileApp,
  isSolflareMobileApp
} from '../utils/mobile-wallet-adapter';
import { 
  openPhantomForConnection, 
  openSolflareForConnection,
  hasPendingConnection 
} from '../utils/mobile-wallet-redirect';
import { useState, useEffect } from 'react';

interface MobileWalletButtonProps {
  onConnect: (publicKey: string) => void;
  onError: (error: string) => void;
}

/**
 * MOBILE WALLET CONNECTION COMPONENT
 * 
 * NEW FLOW:
 * 1. User in Safari/Chrome clicks "Connect with Phantom"
 * 2. Redirects to Phantom app
 * 3. User approves in Phantom
 * 4. Returns to Safari/Chrome with wallet connected
 * 
 * LEGACY FLOW (if in wallet browser):
 * 1. User already in wallet browser → Connect directly
 */
export function MobileWalletButton({ onConnect, onError }: MobileWalletButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingWallet, setPendingWallet] = useState<'phantom' | 'solflare' | null>(null);
  
  // Check if we're in a wallet's in-app browser
  const isInWalletBrowser = isWalletAvailable();
  const isPhantomApp = isPhantomMobileApp();
  const isSolflareApp = isSolflareMobileApp();
  
  // Check if we have a pending connection on mount
  useEffect(() => {
    if (hasPendingConnection()) {
      setIsConnecting(true);
      // We're waiting for the wallet app to redirect back
    }
  }, []);
  
  // If in wallet browser, show direct connect button (legacy flow)
  if (isInWalletBrowser) {
    const walletName = isPhantomApp ? 'Phantom' : isSolflareApp ? 'Solflare' : 'Wallet';
    
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <Chrome className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-300 mb-1">You're in {walletName} Browser</p>
              <p className="text-xs text-amber-400/70">
                Audio may not work here. We recommend using Safari or Chrome instead.
              </p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            setIsConnecting(true);
            try {
              const publicKey = await connectMobileWallet();
              onConnect(publicKey);
            } catch (error: any) {
              const isRejection = 
                error.message?.includes('rejected') || 
                error.message?.includes('User rejected') ||
                error.message?.includes('User cancelled') ||
                error.message?.includes('User denied') ||
                error.code === 4001;
              
              if (!isRejection) {
                onError(error.message || 'Failed to connect wallet');
              }
            } finally {
              setIsConnecting(false);
            }
          }}
          disabled={isConnecting}
          className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Smartphone className="w-5 h-5" />
              <span>Connect {walletName} (Limited Audio)</span>
            </div>
          )}
        </motion.button>
      </div>
    );
  }
  
  // NEW FLOW: User in regular mobile browser (Safari/Chrome)
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <div className="flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-emerald-300 mb-1">Connect Your Mobile Wallet</p>
            <p className="text-xs text-emerald-400/70">
              You'll be redirected to your wallet app, then back here to play
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Phantom Mobile - Redirect Flow */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setIsConnecting(true);
            setPendingWallet('phantom');
            // Redirect to Phantom app
            openPhantomForConnection();
          }}
          disabled={isConnecting}
          className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all disabled:opacity-50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-xl">👻</span>
              </div>
              <div className="text-left">
                <div className="font-medium">Connect with Phantom</div>
                <div className="text-xs text-purple-200">Secure wallet connection</div>
              </div>
            </div>
            {isConnecting && pendingWallet === 'phantom' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </div>
        </motion.button>

        {/* Solflare Mobile - Redirect Flow */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setIsConnecting(true);
            setPendingWallet('solflare');
            // Redirect to Solflare app
            openSolflareForConnection();
          }}
          disabled={isConnecting}
          className="w-full p-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all disabled:opacity-50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-xl">☀️</span>
              </div>
              <div className="text-left">
                <div className="font-medium">Connect with Solflare</div>
                <div className="text-xs text-orange-200">Secure wallet connection</div>
              </div>
            </div>
            {isConnecting && pendingWallet === 'solflare' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </div>
        </motion.button>
      </div>

      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <p className="text-xs text-slate-400 text-center mb-2">How it works:</p>
        <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
          <li>Tap a wallet button above</li>
          <li>Your wallet app will open</li>
          <li>Approve the connection request</li>
          <li>You'll return here automatically</li>
          <li>Start playing with full audio! 🔊</li>
        </ol>
      </div>
    </div>
  );
}