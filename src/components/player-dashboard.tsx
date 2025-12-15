import { Leaderboard } from './leaderboard';
import { TokenBalanceDisplay } from './token-balance-display';
import { PlayerData } from '../App';
import { isPhantomMobileApp, isSolflareMobileApp } from '../utils/mobile-wallet-adapter';
import { useState } from 'react';
import { motion } from 'motion/react';
import { Play, LogOut, Trophy, Star, Zap, Chrome, AlertCircle, Award, Coins } from 'lucide-react';
// import { SolanaConfigTest } from './solana-config-test'; // Admin only - not for players

interface PlayerDashboardProps {
  playerData: PlayerData;
  onStartGame: () => void;
  onDisconnect: () => void;
  onViewAchievements?: () => void;
  onClaimRewards?: () => void;
  isClaiming?: boolean;
}

export function PlayerDashboard({ playerData, onStartGame, onDisconnect, onViewAchievements, onClaimRewards, isClaiming }: PlayerDashboardProps) {
  const isInWalletBrowser = isPhantomMobileApp() || isSolflareMobileApp();
  const walletName = isPhantomMobileApp() ? 'Phantom' : 'Solflare';
  const [urlCopied, setUrlCopied] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);
  // const [showConfigTest, setShowConfigTest] = useState(false); // Removed - admin only
  const appUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  const copyUrlToClipboard = async () => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(appUrl);
        setUrlCopied(true);
        setShowUrlField(false);
        setTimeout(() => setUrlCopied(false), 2000);
        return;
      }
    } catch (error) {
      console.log('Clipboard API blocked, showing URL field instead');
    }
    
    // Fallback: Show the URL in a text field for manual copying
    setShowUrlField(true);
    setUrlCopied(false);
  };
  
  const handleUrlFieldFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when field is focused
    e.target.select();
  };
  
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl text-white mb-2">Welcome Back</h1>
            <p className="font-mono text-sm text-slate-400">{playerData.walletAddress}</p>
          </div>
          <div className="flex items-center gap-3">
            {onViewAchievements && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onViewAchievements}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 border border-amber-500/30 hover:border-amber-500/50 transition-all flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span className="hidden md:inline">Achievements</span>
              </motion.button>
            )}
            {/* <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowConfigTest(true)}
              className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:border-purple-500/50 transition-all flex items-center gap-2"
              title="Solana Configuration"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Config</span>
            </motion.button> */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDisconnect}
              className="px-4 py-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Disconnect</span>
            </motion.button>
          </div>
        </div>

        {/* Wallet Browser Warning */}
        {isInWalletBrowser && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-300 mb-1">
                  <strong>Audio may not work</strong> in {walletName} browser
                </p>
                <p className="text-xs text-amber-400/80 mb-3">
                  For the best experience, open WordMint in Safari or Chrome
                </p>
                <button
                  onClick={copyUrlToClipboard}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors text-xs"
                >
                  <Chrome className="w-3.5 h-3.5" />
                  {urlCopied ? 'URL Copied!' : 'Copy URL to use in browser'}
                </button>
                {showUrlField && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-emerald-300">
                      <strong>Long-press the URL below to copy:</strong>
                    </p>
                    <input
                      type="text"
                      value={appUrl}
                      readOnly
                      onFocus={handleUrlFieldFocus}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-800/50 text-slate-300 border border-slate-700/50 focus:border-emerald-500/50 focus:outline-none transition-colors text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Player Stats and Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Token Balance Display */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <TokenBalanceDisplay walletAddress={playerData.walletAddress} />
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {/* WMINT Pending Claim Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Trophy className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl text-white mb-1">{playerData.score.toLocaleString()}</div>
                <div className="text-sm text-slate-400">Pending Claim</div>
              </div>

              {/* Total WMINT Earned Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Trophy className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl text-white mb-1">{(playerData.totalWmintEarned || 0).toLocaleString()}</div>
                <div className="text-sm text-slate-400">Total WMINT Earned</div>
              </div>

              {/* Level Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Star className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl text-white mb-1">Level {playerData.level}</div>
                <div className="text-sm text-slate-400">Current Rank</div>
              </div>

              {/* Streak Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Zap className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl text-white mb-1">{playerData.streak}</div>
                <div className="text-sm text-slate-400">Current Streak</div>
              </div>
            </motion.div>

            {/* Game Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50"
            >
              <h2 className="text-lg text-slate-300 mb-4">Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl text-white mb-1">{playerData.gamesPlayed}</div>
                  <div className="text-sm text-slate-400">Games Played</div>
                </div>
                <div>
                  <div className="text-2xl text-white mb-1">
                    {playerData.gamesPlayed > 0 
                      ? Math.round((playerData.totalWmintEarned / playerData.gamesPlayed) * 10) / 10 
                      : 0}
                  </div>
                  <div className="text-sm text-slate-400">Avg WMINT/Game</div>
                </div>
              </div>
            </motion.div>

            {/* Claim Rewards Button */}
            {onClaimRewards && playerData.score > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClaimRewards}
                className="w-full py-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xl shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden"
                disabled={isClaiming}
              >
                {/* Animated background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
                <Coins className="w-6 h-6 relative z-10" />
                <span className="relative z-10">
                  {isClaiming ? 'Minting Tokens...' : `Claim ${playerData.score.toLocaleString()} WMINT`}
                </span>
              </motion.button>
            )}

            {/* Start Game Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStartGame}
              className="w-full py-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6" />
              <span>Start Game</span>
            </motion.button>
          </div>

          {/* Right Column - Leaderboard */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 sticky top-8"
            >
              <Leaderboard currentWallet={playerData.walletAddress} />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Solana Configuration Test Modal */}
      {/* {showConfigTest && (
        <SolanaConfigTest onClose={() => setShowConfigTest(false)} />
      )} */}
    </div>
  );
}