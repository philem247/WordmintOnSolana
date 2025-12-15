import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />
  };

  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/30',
    error: 'bg-red-500/10 border-red-500/30',
    info: 'bg-blue-500/10 border-blue-500/30'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed top-4 right-4 z-50 max-w-sm w-full mx-4 sm:mx-0"
      >
        <div className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-sm ${styles[type]}`}>
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          <p className="flex-1 text-sm text-white">{message}</p>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
