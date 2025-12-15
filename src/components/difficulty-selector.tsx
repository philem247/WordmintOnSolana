import { motion } from 'motion/react';
import { Zap, TrendingUp, Flame } from 'lucide-react';
import { DifficultyMode, getDifficultyColor, getDifficultyDescription } from '../utils/word-lists';

interface DifficultySelectorProps {
  selectedDifficulty: DifficultyMode;
  onSelect: (difficulty: DifficultyMode) => void;
}

export function DifficultySelector({ selectedDifficulty, onSelect }: DifficultySelectorProps) {
  const difficulties: { mode: DifficultyMode; icon: typeof Zap; label: string }[] = [
    { mode: 'easy', icon: Zap, label: 'Easy' },
    { mode: 'normal', icon: TrendingUp, label: 'Normal' },
    { mode: 'hard', icon: Flame, label: 'Hard' }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg text-white mb-2">Select Difficulty</h3>
        <p className="text-sm text-slate-400">Higher difficulty = More XP</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {difficulties.map(({ mode, icon: Icon, label }) => {
          const colors = getDifficultyColor(mode);
          const description = getDifficultyDescription(mode);
          const isSelected = selectedDifficulty === mode;

          return (
            <motion.button
              key={mode}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(mode)}
              className={`p-4 rounded-xl bg-gradient-to-br ${colors.bg} border-2 transition-all ${
                isSelected 
                  ? `${colors.border} ring-2 ring-offset-2 ring-offset-slate-900 ${colors.border.replace('border-', 'ring-')}` 
                  : 'border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                
                <div>
                  <div className={`text-lg mb-1 ${isSelected ? colors.text : 'text-white'}`}>
                    {label}
                  </div>
                  <div className="text-xs text-slate-400">
                    {description}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
