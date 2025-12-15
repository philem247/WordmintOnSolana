import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchLeaderboard, LeaderboardEntry } from '../utils/api';
import { shortenAddress } from '../utils/wallet';

interface LeaderboardProps {
  currentWallet?: string;
}

export function Leaderboard({ currentWallet }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLeaderboard(10);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-slate-300" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-400" />;
      default:
        return <span className="text-slate-500">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-amber-500/20 to-amber-500/10 border-amber-500/30';
      case 2:
        return 'from-slate-500/20 to-slate-500/10 border-slate-500/30';
      case 3:
        return 'from-orange-500/20 to-orange-500/10 border-orange-500/30';
      default:
        return 'from-slate-800/50 to-slate-800/30 border-slate-700/50';
    }
  };

  if (isLoading && leaderboard.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400">Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadLeaderboard}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl text-white">Leaderboard</h2>
        <button
          onClick={loadLeaderboard}
          disabled={isLoading}
          className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {leaderboard.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No players yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <motion.div
              key={entry.walletAddress}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl bg-gradient-to-br border ${getRankColor(entry.rank)} ${
                currentWallet === entry.walletAddress ? 'ring-2 ring-emerald-500/50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-mono text-sm text-white truncate">
                      {shortenAddress(entry.walletAddress)}
                    </p>
                    {currentWallet === entry.walletAddress && (
                      <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>Level {entry.level}</span>
                    <span>•</span>
                    <span>{entry.gamesPlayed} games</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg text-emerald-400">{entry.score.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">WMINT</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}