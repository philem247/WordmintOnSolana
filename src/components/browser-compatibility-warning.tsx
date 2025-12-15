import { AlertTriangle, Chrome, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { isPhantomMobileApp, isSolflareMobileApp } from '../utils/mobile-wallet-adapter';

interface BrowserCompatibilityWarningProps {
  onDismiss: () => void;
  onContinueAnyway: () => void;
}

/**
 * BROWSER COMPATIBILITY WARNING
 * 
 * Shows a warning when user is in a wallet's in-app browser
 * which may have limited audio support for the game
 */
export function BrowserCompatibilityWarning({ 
  onDismiss, 
  onContinueAnyway 
}: BrowserCompatibilityWarningProps) {
  const [copied, setCopied] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);
  const isPhantom = isPhantomMobileApp();
  const isSolflare = isSolflareMobileApp();
  const walletName = isPhantom ? 'Phantom' : isSolflare ? 'Solflare' : 'wallet';
  const appUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  const copyUrlToClipboard = async () => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(appUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch (error) {
      console.log('Clipboard API blocked, showing URL field instead');
    }
    
    // Fallback: Show the URL in a text field for manual copying
    setShowUrlField(true);
  };
  
  const handleUrlFieldFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when field is focused
    e.target.select();
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-md w-full bg-slate-800 rounded-3xl border border-slate-700/50 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-b border-amber-500/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl text-white mb-1">Audio May Not Work</h3>
                <p className="text-sm text-amber-300/80">
                  {walletName} browser has limited audio support
                </p>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-300">
              WordMint uses audio to read words aloud, but the {walletName} in-app browser may not support speech synthesis.
            </p>
            
            <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/50">
              <p className="text-xs text-slate-400 mb-3">
                <strong className="text-slate-300">Recommended:</strong> Open in your regular browser
              </p>
              <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside">
                <li>Copy the URL below</li>
                <li>Open Safari or Chrome on your phone</li>
                <li>Paste and visit the URL</li>
                <li>Connect your wallet from there</li>
              </ol>
            </div>
            
            {/* Copy URL Button */}
            <button
              onClick={copyUrlToClipboard}
              className="w-full p-4 rounded-xl bg-slate-700/50 border border-slate-600/50 hover:bg-slate-700 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Chrome className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm text-slate-300">Copy App URL</div>
                    <div className="text-xs text-slate-500 truncate">{window.location.hostname}</div>
                  </div>
                </div>
                {copied ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 text-emerald-400"
                  >
                    <Check className="w-4 h-4" />
                    <span className="text-xs">Copied!</span>
                  </motion.div>
                ) : (
                  <Copy className="w-5 h-5 text-slate-400 group-hover:text-slate-300 transition-colors" />
                )}
              </div>
            </button>
            
            {/* URL Field (Fallback) */}
            {showUrlField && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
              >
                <p className="text-xs text-emerald-300 mb-2">
                  <strong>Long-press the URL below to copy:</strong>
                </p>
                <input
                  type="text"
                  value={appUrl}
                  readOnly
                  onFocus={handleUrlFieldFocus}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 text-slate-300 text-sm focus:outline-none focus:border-emerald-500/50"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Tap and hold the URL, then select "Copy"
                </p>
              </motion.div>
            )}
          </div>
          
          {/* Actions */}
          <div className="p-6 bg-slate-900/50 border-t border-slate-700/50 space-y-3">
            <button
              onClick={onDismiss}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
            >
              Got It, I'll Switch Browsers
            </button>
            
            <button
              onClick={onContinueAnyway}
              className="w-full py-3 rounded-xl bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-all"
            >
              Continue Anyway (Audio may not work)
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}