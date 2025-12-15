import { CheckCircle2, XCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface ResultScreenProps {
  isCorrect: boolean;
  word: string;
  pointsEarned: number;
  txSignature?: string | null;
  onContinue: () => void;
}

export function ResultScreen({ isCorrect, word, pointsEarned, txSignature, onContinue }: ResultScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg w-full"
      >
        {/* Result Card */}
        <div className={`p-8 md:p-12 rounded-3xl border ${
          isCorrect 
            ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border-emerald-500/30' 
            : 'bg-gradient-to-br from-red-500/20 to-red-500/10 border-red-500/30'
        }`}>
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            {isCorrect ? (
              <div className="p-4 rounded-full bg-emerald-500/20">
                <CheckCircle2 className="w-16 h-16 md:w-20 md:h-20 text-emerald-400" />
              </div>
            ) : (
              <div className="p-4 rounded-full bg-red-500/20">
                <XCircle className="w-16 h-16 md:w-20 md:h-20 text-red-400" />
              </div>
            )}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-3xl md:text-4xl text-center mb-4 ${
              isCorrect ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </motion.h1>

          {/* Word Display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8 p-6 rounded-2xl bg-slate-900/50 border border-slate-800"
          >
            <p className="text-sm text-slate-400 text-center mb-2">
              {isCorrect ? 'You spelled it correctly' : 'The correct spelling is'}
            </p>
            <p className="text-2xl md:text-3xl text-white text-center tracking-wide">
              {word}
            </p>
          </motion.div>

          {/* WMINT Display */}
          {isCorrect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 text-center"
            >
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-lg text-slate-400">+</span>
                <span className="text-2xl text-emerald-400">{pointsEarned}</span>
                <span className="text-lg text-emerald-400">WMINT</span>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Tokens accumulated • Claim on dashboard
              </p>
            </motion.div>
          )}

          {/* Failure Message */}
          {!isCorrect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-8 text-center"
            >
              <p className="text-slate-400">
                Don't worry! Keep practicing to improve your streak.
              </p>
            </motion.div>
          )}

          {/* Continue Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onContinue}
            className={`w-full py-4 rounded-2xl text-white text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
              isCorrect
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/20 hover:shadow-emerald-500/30'
                : 'bg-gradient-to-r from-slate-700 to-slate-600 shadow-slate-700/20 hover:shadow-slate-700/30'
            }`}
          >
            <span>{isCorrect ? 'Back to Dashboard' : 'Back to Dashboard'}</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}