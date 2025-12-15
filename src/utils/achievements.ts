/**
 * Achievements & Badges System
 * 
 * Defines all available achievements and badge unlock conditions
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon identifier
  category: 'xp' | 'streak' | 'games' | 'level' | 'difficulty' | 'special';
  requirement: number;
  badge: {
    color: string;
    glow: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
}

export const ACHIEVEMENTS: Achievement[] = [
  // WMINT Token Milestones (replacing XP)
  {
    id: 'first-wmint',
    name: 'First Coin',
    description: 'Earn your first WMINT token',
    icon: '🪙',
    category: 'xp',
    requirement: 1,
    badge: {
      color: 'from-emerald-500 to-emerald-600',
      glow: 'shadow-emerald-500/50',
      rarity: 'common'
    }
  },
  {
    id: 'wmint-100',
    name: 'Pocket Change',
    description: 'Accumulate 100 WMINT',
    icon: '💰',
    category: 'xp',
    requirement: 100,
    badge: {
      color: 'from-green-500 to-emerald-600',
      glow: 'shadow-green-500/50',
      rarity: 'common'
    }
  },
  {
    id: 'wmint-500',
    name: 'Token Collector',
    description: 'Accumulate 500 WMINT',
    icon: '💎',
    category: 'xp',
    requirement: 500,
    badge: {
      color: 'from-blue-500 to-cyan-600',
      glow: 'shadow-blue-500/50',
      rarity: 'rare'
    }
  },
  {
    id: 'wmint-1000',
    name: 'Whale Watcher',
    description: 'Accumulate 1,000 WMINT',
    icon: '🐋',
    category: 'xp',
    requirement: 1000,
    badge: {
      color: 'from-purple-500 to-pink-600',
      glow: 'shadow-purple-500/50',
      rarity: 'epic'
    }
  },
  {
    id: 'wmint-5000',
    name: 'Token Tycoon',
    description: 'Accumulate 5,000 WMINT',
    icon: '👑',
    category: 'xp',
    requirement: 5000,
    badge: {
      color: 'from-amber-500 to-yellow-400',
      glow: 'shadow-amber-500/50',
      rarity: 'legendary'
    }
  },

  // Streak Achievements
  {
    id: 'streak-3',
    name: 'Getting Hot',
    description: 'Get 3 words correct in a row',
    icon: '🔥',
    category: 'streak',
    requirement: 3,
    badge: {
      color: 'from-orange-500 to-red-500',
      glow: 'shadow-orange-500/50',
      rarity: 'common'
    }
  },
  {
    id: 'streak-5',
    name: 'On Fire',
    description: 'Get 5 words correct in a row',
    icon: '🌶️',
    category: 'streak',
    requirement: 5,
    badge: {
      color: 'from-red-500 to-orange-500',
      glow: 'shadow-red-500/50',
      rarity: 'common'
    }
  },
  {
    id: 'streak-10',
    name: 'Blazing',
    description: 'Get 10 words correct in a row',
    icon: '💥',
    category: 'streak',
    requirement: 10,
    badge: {
      color: 'from-orange-500 to-red-600',
      glow: 'shadow-red-500/50',
      rarity: 'rare'
    }
  },
  {
    id: 'streak-20',
    name: 'Inferno',
    description: 'Get 20 words correct in a row',
    icon: '⚡',
    category: 'streak',
    requirement: 20,
    badge: {
      color: 'from-yellow-500 to-orange-600',
      glow: 'shadow-yellow-500/50',
      rarity: 'epic'
    }
  },
  {
    id: 'streak-50',
    name: 'Unstoppable Force',
    description: 'Get 50 words correct in a row',
    icon: '🌟',
    category: 'streak',
    requirement: 50,
    badge: {
      color: 'from-amber-400 to-yellow-500',
      glow: 'shadow-amber-500/50',
      rarity: 'legendary'
    }
  },

  // Games Played
  {
    id: 'games-1',
    name: 'Rookie',
    description: 'Complete your first game',
    icon: '🎮',
    category: 'games',
    requirement: 1,
    badge: {
      color: 'from-slate-500 to-slate-600',
      glow: 'shadow-slate-500/50',
      rarity: 'common'
    }
  },
  {
    id: 'games-10',
    name: 'Regular Player',
    description: 'Complete 10 games',
    icon: '🎯',
    category: 'games',
    requirement: 10,
    badge: {
      color: 'from-cyan-500 to-blue-500',
      glow: 'shadow-cyan-500/50',
      rarity: 'common'
    }
  },
  {
    id: 'games-25',
    name: 'Word Warrior',
    description: 'Complete 25 games',
    icon: '⚔️',
    category: 'games',
    requirement: 25,
    badge: {
      color: 'from-blue-500 to-indigo-600',
      glow: 'shadow-blue-500/50',
      rarity: 'rare'
    }
  },
  {
    id: 'games-50',
    name: 'Spelling Specialist',
    description: 'Complete 50 games',
    icon: '🏆',
    category: 'games',
    requirement: 50,
    badge: {
      color: 'from-indigo-500 to-purple-600',
      glow: 'shadow-indigo-500/50',
      rarity: 'epic'
    }
  },
  {
    id: 'games-100',
    name: 'WordMint Legend',
    description: 'Complete 100 games',
    icon: '🥇',
    category: 'games',
    requirement: 100,
    badge: {
      color: 'from-yellow-400 to-amber-500',
      glow: 'shadow-yellow-500/50',
      rarity: 'legendary'
    }
  },

  // Level Achievements
  {
    id: 'level-3',
    name: 'Learning Fast',
    description: 'Reach Level 3',
    icon: '📖',
    category: 'level',
    requirement: 3,
    badge: {
      color: 'from-green-500 to-emerald-600',
      glow: 'shadow-green-500/50',
      rarity: 'common'
    }
  },
  {
    id: 'level-5',
    name: 'Rising Star',
    description: 'Reach Level 5',
    icon: '⭐',
    category: 'level',
    requirement: 5,
    badge: {
      color: 'from-blue-500 to-cyan-600',
      glow: 'shadow-blue-500/50',
      rarity: 'common'
    }
  },
  {
    id: 'level-10',
    name: 'Expert Speller',
    description: 'Reach Level 10',
    icon: '🎓',
    category: 'level',
    requirement: 10,
    badge: {
      color: 'from-purple-500 to-indigo-600',
      glow: 'shadow-purple-500/50',
      rarity: 'rare'
    }
  },
  {
    id: 'level-20',
    name: 'Word Wizard',
    description: 'Reach Level 20',
    icon: '🧙',
    category: 'level',
    requirement: 20,
    badge: {
      color: 'from-purple-500 to-pink-600',
      glow: 'shadow-purple-500/50',
      rarity: 'epic'
    }
  },
  {
    id: 'level-50',
    name: 'Dictionary Master',
    description: 'Reach Level 50',
    icon: '📚',
    category: 'level',
    requirement: 50,
    badge: {
      color: 'from-amber-500 to-yellow-400',
      glow: 'shadow-amber-500/50',
      rarity: 'legendary'
    }
  },

  // Special Achievements
  {
    id: 'first-win',
    name: 'First Success',
    description: 'Spell your first word correctly',
    icon: '✨',
    category: 'special',
    requirement: 1,
    badge: {
      color: 'from-emerald-500 to-teal-500',
      glow: 'shadow-emerald-500/50',
      rarity: 'common'
    }
  },
  {
    id: 'wallet-connected',
    name: 'Solana Native',
    description: 'Connect your Solana wallet',
    icon: '🔗',
    category: 'special',
    requirement: 1,
    badge: {
      color: 'from-purple-500 to-purple-600',
      glow: 'shadow-purple-500/50',
      rarity: 'common'
    }
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a word in under 5 seconds',
    icon: '⚡',
    category: 'special',
    requirement: 1,
    badge: {
      color: 'from-yellow-500 to-amber-600',
      glow: 'shadow-yellow-500/50',
      rarity: 'rare'
    }
  },
  {
    id: 'perfect-game',
    name: 'Flawless Victory',
    description: 'Get all words correct in a session',
    icon: '💯',
    category: 'special',
    requirement: 1,
    badge: {
      color: 'from-pink-500 to-rose-600',
      glow: 'shadow-pink-500/50',
      rarity: 'epic'
    }
  },
  {
    id: 'token-claimer',
    name: 'Token Claimer',
    description: 'Claim your first WMINT rewards',
    icon: '🎁',
    category: 'special',
    requirement: 1,
    badge: {
      color: 'from-emerald-500 to-green-600',
      glow: 'shadow-emerald-500/50',
      rarity: 'common'
    }
  }
];

/**
 * Check which achievements a player has unlocked
 */
export function checkUnlockedAchievements(
  totalWmintEarned: number,
  streak: number,
  gamesPlayed: number,
  level: number,
  specialAchievements: string[] = [] // Track special achievements separately
): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => {
    switch (achievement.category) {
      case 'xp':
        return totalWmintEarned >= achievement.requirement;
      case 'streak':
        return streak >= achievement.requirement;
      case 'games':
        return gamesPlayed >= achievement.requirement;
      case 'level':
        return level >= achievement.requirement;
      case 'special':
        // Special achievements need to be tracked separately
        // Check if this special achievement was earned
        if (specialAchievements.includes(achievement.id)) {
          return true;
        }
        
        // Auto-unlock based on basic conditions
        if (achievement.id === 'first-win') return totalWmintEarned >= 1;
        if (achievement.id === 'wallet-connected') return true; // Always unlocked if viewing
        if (achievement.id === 'token-claimer') return totalWmintEarned > 0; // Claimed at least once
        
        return false;
      default:
        return false;
    }
  });
}

/**
 * Get newly unlocked achievements (for notifications)
 */
export function getNewlyUnlockedAchievements(
  previousUnlocked: string[],
  currentUnlocked: Achievement[]
): Achievement[] {
  const previousIds = new Set(previousUnlocked);
  return currentUnlocked.filter(achievement => !previousIds.has(achievement.id));
}

/**
 * Calculate achievement progress percentage
 */
export function getAchievementProgress(achievement: Achievement, currentValue: number): number {
  const progress = (currentValue / achievement.requirement) * 100;
  return Math.min(progress, 100);
}

/**
 * Get rarity color scheme
 */
export function getRarityColor(rarity: Achievement['badge']['rarity']): {
  text: string;
  bg: string;
  border: string;
} {
  switch (rarity) {
    case 'common':
      return {
        text: 'text-slate-300',
        bg: 'bg-slate-500/20',
        border: 'border-slate-500/30'
      };
    case 'rare':
      return {
        text: 'text-blue-300',
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/30'
      };
    case 'epic':
      return {
        text: 'text-purple-300',
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/30'
      };
    case 'legendary':
      return {
        text: 'text-amber-300',
        bg: 'bg-amber-500/20',
        border: 'border-amber-500/30'
      };
  }
}

/**
 * Get achievement statistics
 */
export function getAchievementStats(unlockedCount: number): {
  totalAchievements: number;
  unlockedCount: number;
  percentage: number;
} {
  const total = ACHIEVEMENTS.length;
  return {
    totalAchievements: total,
    unlockedCount,
    percentage: Math.round((unlockedCount / total) * 100)
  };
}