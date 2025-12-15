import { ArrowLeft, Trophy, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  ACHIEVEMENTS, 
  checkUnlockedAchievements, 
  getAchievementProgress,
  getRarityColor,
  getAchievementStats,
  Achievement 
} from '../utils/achievements';
import { PlayerData } from '../App';

interface AchievementsScreenProps {
  playerData: PlayerData;
  onBack: () => void;
}

export function AchievementsScreen({ playerData, onBack }: AchievementsScreenProps) {
  // Get unlocked achievements
  const unlockedAchievements = checkUnlockedAchievements(
    playerData.totalWmintEarned, // Use total WMINT earned, not pending score
    playerData.streak,
    playerData.gamesPlayed,
    playerData.level,
    [] // TODO: Track special achievements in player data
  );
  
  const unlockedIds = new Set(unlockedAchievements.map(a => a.id));
  const stats = getAchievementStats(unlockedAchievements.length);

  // Group achievements by category
  const categories = {
    special: { name: '✨ Special', achievements: ACHIEVEMENTS.filter(a => a.category === 'special') },
    xp: { name: '🪙 WMINT Milestones', achievements: ACHIEVEMENTS.filter(a => a.category === 'xp') },
    streak: { name: '🔥 Streak Master', achievements: ACHIEVEMENTS.filter(a => a.category === 'streak') },
    games: { name: '🎮 Games Played', achievements: ACHIEVEMENTS.filter(a => a.category === 'games') },
    level: { name: '📈 Level Progress', achievements: ACHIEVEMENTS.filter(a => a.category === 'level') }
  };

  // Get current value for achievement progress
  const getCurrentValue = (achievement: Achievement): number => {
    switch (achievement.category) {
      case 'xp':
        return playerData.totalWmintEarned; // Use total earned, not pending score
      case 'streak':
        return playerData.streak;
      case 'games':
        return playerData.gamesPlayed;
      case 'level':
        return playerData.level;
      case 'special':
        return 1; // Special achievements are binary
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="text-center">
            <h1 className="text-3xl text-white mb-2">Achievements</h1>
            <p className="text-sm text-slate-400">
              {stats.unlockedCount} / {stats.totalAchievements} Unlocked ({stats.percentage}%)
            </p>
          </div>

          <div className="w-24"></div>
        </div>

        {/* Overall Progress */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl text-white mb-1">Achievement Progress</h2>
              <p className="text-sm text-slate-400">Collect badges by reaching milestones</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500"
            />
          </div>
        </div>

        {/* Achievement Categories */}
        <div className="space-y-8">
          {Object.entries(categories).map(([categoryKey, { name, achievements }]) => (
            <div key={categoryKey}>
              <h2 className="text-xl text-white mb-4">{name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement, index) => {
                  const isUnlocked = unlockedIds.has(achievement.id);
                  const currentValue = getCurrentValue(achievement);
                  const progress = getAchievementProgress(achievement, currentValue);
                  const rarityColors = getRarityColor(achievement.badge.rarity);

                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-5 rounded-xl border transition-all ${
                        isUnlocked
                          ? `bg-gradient-to-br ${achievement.badge.color} border-white/20 ${achievement.badge.glow} shadow-lg`
                          : 'bg-slate-800/30 border-slate-700/50 grayscale opacity-60'
                      }`}
                    >
                      {/* Icon & Badge */}
                      <div className="flex items-start justify-between mb-3">
                        <div className={`text-4xl ${isUnlocked ? '' : 'opacity-50'}`}>
                          {isUnlocked ? achievement.icon : '🔒'}
                        </div>
                        {isUnlocked && (
                          <div className={`px-2 py-1 rounded text-xs ${rarityColors.bg} ${rarityColors.border} border ${rarityColors.text} uppercase tracking-wider`}>
                            {achievement.badge.rarity}
                          </div>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className={`text-lg mb-1 ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                        {achievement.name}
                      </h3>
                      <p className={`text-sm mb-3 ${isUnlocked ? 'text-slate-200' : 'text-slate-500'}`}>
                        {achievement.description}
                      </p>

                      {/* Progress */}
                      {!isUnlocked && (
                        <div>
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Progress</span>
                            <span>{currentValue} / {achievement.requirement}</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {isUnlocked && (
                        <div className="flex items-center gap-2 text-sm text-white/80">
                          <Trophy className="w-4 h-4" />
                          <span>Unlocked!</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Locked Achievement Notice */}
        {stats.unlockedCount < stats.totalAchievements && (
          <div className="mt-8 p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-center">
            <Lock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              Keep playing to unlock more achievements!
            </p>
            <p className="text-sm text-slate-500 mt-2">
              {stats.totalAchievements - stats.unlockedCount} achievements remaining
            </p>
          </div>
        )}
      </div>
    </div>
  );
}