import { Sparkles, Trophy, Zap, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useWallet } from '../hooks/useWallet';
import { WalletButton } from './wallet-button';
import { BrowserCompatibilityWarning } from './browser-compatibility-warning';
import { MobileWalletConnect } from './mobile-wallet-connect';
import { useState, useEffect } from 'react';
import { MobileWalletProtocol } from '../utils/mobile-wallet-protocol';

interface LandingPageProps {
  onConnect: (walletAddress: string) => void;
}

export function LandingPage({ onConnect }: LandingPageProps) {
  const wallet = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [showCompatibilityWarning, setShowCompatibilityWarning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile device
  useEffect(() => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);
  
  // Check if user just returned from wallet app (mobile deep link)
  useEffect(() => {
    if (!isMobile) return;
    
    // Check for mobile wallet return
    if (MobileWalletProtocol.isReturn()) {
      console.log('📱 Detected return from mobile wallet');
      // Mobile return will be handled by MobileWalletConnect component
      return;
    }
    
    // Check for existing wallet session
    const savedWallet = localStorage.getItem('wordmint_wallet');
    if (savedWallet) {
      console.log('✅ Restored wallet session:', savedWallet);
      onConnect(savedWallet);
    }
  }, [isMobile, onConnect]);
  
  // Check if user is in a wallet browser (show compatibility warning)
  useEffect(() => {
    const isInWalletBrowser = MobileWalletProtocol.isPhantom() || MobileWalletProtocol.isSolflare();
    const hasSeenWarning = localStorage.getItem('wordmint_browser_warning_dismissed');
    
    if (isInWalletBrowser && !hasSeenWarning) {
      // Show warning after a short delay
      setTimeout(() => {
        setShowCompatibilityWarning(true);
      }, 500);
    }
  }, []);

  // Watch for wallet connection and trigger app navigation (desktop)
  useEffect(() => {
    if (!isMobile && wallet.state === 'connected') {
      const fullPublicKey = wallet.getFullPublicKey();
      if (fullPublicKey) {
        // Desktop wallet connected, navigate to dashboard
        onConnect(fullPublicKey);
      }
    }
  }, [wallet.state, isMobile, onConnect, wallet]);

  // Handle mobile wallet connection
  const handleMobileConnect = (publicKey: string) => {
    console.log('✅ Mobile wallet connected:', publicKey);
    // Save to localStorage
    localStorage.setItem('wordmint_wallet', publicKey);
    // Call parent handler
    onConnect(publicKey);
  };

  // Handle mobile wallet error
  const handleMobileError = (errorMessage: string) => {
    console.error('❌ Mobile wallet error:', errorMessage);
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };
  
  const handleDismissWarning = () => {
    setShowCompatibilityWarning(false);
    localStorage.setItem('wordmint_browser_warning_dismissed', 'true');
  };
  
  const handleContinueAnyway = () => {
    setShowCompatibilityWarning(false);
    localStorage.setItem('wordmint_browser_warning_dismissed', 'true');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Browser Compatibility Warning */}
      {showCompatibilityWarning && (
        <BrowserCompatibilityWarning
          onDismiss={handleDismissWarning}
          onContinueAnyway={handleContinueAnyway}
        />
      )}
      
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          {/* Logo & Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 mb-6">
              <Sparkles className="w-16 h-16 text-emerald-400" />
            </div>
            <h1 className="text-5xl md:text-6xl mb-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              WordMint
            </h1>
            <p className="text-xl text-slate-300 mb-2">Spell-to-Earn on Solana</p>
            <p className="text-sm text-slate-500">Learn Web3 terminology while earning rewards</p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Wallet Connection Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="p-8 rounded-3xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm"
          >
            <h2 className="text-2xl text-white mb-6">Connect & Play</h2>
            
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
            
            <WalletButton
              state={wallet.state}
              publicKey={wallet.publicKey}
              error={wallet.error}
              onConnect={wallet.connect}
              onDisconnect={wallet.disconnect}
              onMobileConnect={handleMobileConnect}
              onError={handleMobileError}
            />
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="p-6 rounded-2xl bg-slate-800/20 border border-slate-700/30 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 mb-3">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-slate-300 mb-2">Listen & Spell</h3>
              <p className="text-sm text-slate-500">
                Hear words and spell them correctly
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/20 border border-slate-700/30 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 mb-3">
                <Trophy className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-slate-300 mb-2">Earn Points</h3>
              <p className="text-sm text-slate-500">
                Build streaks and level up
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/20 border border-slate-700/30 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/10 mb-3">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-slate-300 mb-2">Win Rewards</h3>
              <p className="text-sm text-slate-500">
                Earn blockchain rewards
              </p>
            </div>
          </motion.div>
        </div>

        {/* Info Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center text-xs text-slate-600"
        >
          <p>
            Powered by Solana • Running on Devnet
          </p>
          <p className="mt-2">
            Your wallet address identifies you and stores your progress
          </p>
        </motion.div>
      </div>
    </div>
  );
}