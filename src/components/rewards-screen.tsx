import { Trophy, Sparkles, TrendingUp, Play, Home, Coins } from 'lucide-react';
import { motion } from 'motion/react';

interface RewardsScreenProps {
  pointsEarned: number;
  totalScore: number;
  level: number;
  streak: number;
  onPlayAgain: () => void;
  onBackToDashboard: () => void;
  onClaimTokens?: () => void;
}

export function RewardsScreen({ 
  pointsEarned, 
  totalScore, 
  level, 
  streak,
  onPlayAgain, 
  onBackToDashboard,
  onClaimTokens
}: RewardsScreenProps) {
  // WMINT earned directly (already calculated in-game)
  const wmintEarned = pointsEarned;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 mb-4 shadow-lg shadow-amber-500/30"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl text-white mb-2"
          >
            Rewards Earned!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400"
          >
            Great job! Here's what you earned this round
          </motion.p>
        </div>

        {/* Rewards Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          {/* Points Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-slate-400">Points Earned</span>
            </div>
            <div className="text-3xl text-emerald-400 mb-1">+{pointsEarned}</div>
            <div className="text-sm text-slate-500">Total: {totalScore.toLocaleString()}</div>
          </div>

          {/* Streak Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 border border-orange-500/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <TrendingUp className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-sm text-slate-400">Current Streak</span>
            </div>
            <div className="text-3xl text-orange-400 mb-1">{streak}</div>
            <div className="text-sm text-slate-500">
              {streak > 0 ? `Keep going! 🔥` : 'Start a new streak'}
            </div>
          </div>
        </motion.div>

        {/* Blockchain Rewards */}
        {onClaimTokens && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-4">
              <Coins className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-xl text-white mb-2">SPL Token Rewards</h3>
            <p className="text-sm text-slate-400 mb-4">
              You can claim blockchain tokens for this game!
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
              <span className="text-2xl text-amber-400 font-bold">{wmintEarned.toFixed(2)} WMINT</span>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Verifiable on Solana devnet • Real blockchain transaction
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPlayAgain}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-lg shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            <span>Play Again</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBackToDashboard}
            className="flex-1 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-slate-300 text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </motion.button>

          {onClaimTokens && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClaimTokens}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-lg shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Coins className="w-5 h-5" />
              <span>Claim Tokens</span>
            </motion.button>
          )}
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50"
        >
          <div className="flex items-center justify-around text-center">
            <div>
              <div className="text-2xl text-white mb-1">{level}</div>
              <div className="text-xs text-slate-400">Level</div>
            </div>
            <div className="w-px h-12 bg-slate-700" />
            <div>
              <div className="text-2xl text-white mb-1">{streak}</div>
              <div className="text-xs text-slate-400">Streak</div>
            </div>
            <div className="w-px h-12 bg-slate-700" />
            <div>
              <div className="text-2xl text-white mb-1">{totalScore.toLocaleString()}</div>
              <div className="text-xs text-slate-400">Total Points</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}