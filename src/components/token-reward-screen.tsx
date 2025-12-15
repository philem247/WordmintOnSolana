/**
 * TOKEN REWARD CLAIM SCREEN
 * 
 * Complete blockchain flow for claiming SPL token rewards
 * Shows all states: calculating, claiming, pending, confirmed, failed
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, 
  Sparkles, 
  ExternalLink, 
  Check, 
  X, 
  Loader, 
  AlertCircle,
  Copy,
  CheckCircle
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export type TokenClaimState = 
  | 'calculating'      // Calculating reward amount
  | 'ready'            // Ready to claim
  | 'claiming'         // Calling backend API
  | 'pending'          // Transaction submitted to blockchain
  | 'confirming'       // Waiting for blockchain confirmation
  | 'confirmed'        // Transaction confirmed successfully
  | 'failed'           // Transaction failed
  | 'already-claimed'; // Reward already claimed

interface TokenRewardScreenProps {
  walletAddress: string;
  gameScore: number;
  streak: number;
  level: number;
  gameId: string;
  onComplete: () => void;
  onBack: () => void;
}

interface TokenRewardData {
  amount: number;
  baseReward: number;
  streakBonus: number;
  levelBonus: number;
}

interface TransactionData {
  signature: string;
  mintAddress: string;
  explorerUrl: string;
}

export function TokenRewardScreen({
  walletAddress,
  gameScore,
  streak,
  level,
  gameId,
  onComplete,
  onBack
}: TokenRewardScreenProps) {
  const [claimState, setClaimState] = useState<TokenClaimState>('confirmed');
  const [rewardData, setRewardData] = useState<TokenRewardData | null>(null);
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSignature, setCopiedSignature] = useState(false);

  // Get transaction signature from parent component
  useEffect(() => {
    // Extract transaction signature from URL or context
    // For now, we'll get it from the global window object or props
    const txSig = (window as any).__wordmint_last_tx__;
    const mintAddr = (window as any).__wordmint_mint_address__;
    
    if (txSig) {
      setTransactionData({
        signature: txSig,
        mintAddress: mintAddr || 'Unknown',
        explorerUrl: `https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
      });
    }
    
    setRewardData({
      amount: gameScore,
      baseReward: gameScore,
      streakBonus: 0,
      levelBonus: 0,
    });
  }, [gameScore]);

  const handleRetry = () => {
    setClaimState('ready');
    setError(null);
    setTransactionData(null);
  };

  const copySignature = async () => {
    if (!transactionData) return;
    
    try {
      await navigator.clipboard.writeText(transactionData.signature);
      setCopiedSignature(true);
      setTimeout(() => setCopiedSignature(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const input = document.createElement('input');
      input.value = transactionData.signature;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedSignature(true);
      setTimeout(() => setCopiedSignature(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full"
      >
        <div className="p-8 rounded-3xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm">
          {/* Calculating State */}
          {claimState === 'calculating' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <Loader className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
              <h2 className="text-2xl text-white mb-2">Calculating Reward</h2>
              <p className="text-slate-400">Computing your token rewards...</p>
            </div>
          )}

          {/* Ready to Claim State */}
          {claimState === 'ready' && rewardData && (
            <div>
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center"
                >
                  <Coins className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-3xl text-white mb-2">Processing Claim...</h2>
                <p className="text-slate-400">Your tokens are being minted</p>
              </div>

              <button
                onClick={onBack}
                className="w-full mt-3 py-3 rounded-xl bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          )}

          {/* Claiming State */}
          {claimState === 'claiming' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <Loader className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
              <h2 className="text-2xl text-white mb-2">Processing Claim</h2>
              <p className="text-slate-400">Submitting transaction to blockchain...</p>
              <p className="text-xs text-slate-500 mt-2">This may take a few seconds</p>
            </div>
          )}

          {/* Pending/Confirming State */}
          {(claimState === 'pending' || claimState === 'confirming') && transactionData && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <Loader className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
              <h2 className="text-2xl text-white mb-2">
                {claimState === 'pending' ? 'Transaction Pending' : 'Confirming Transaction'}
              </h2>
              <p className="text-slate-400 mb-6">
                {claimState === 'pending' 
                  ? 'Transaction submitted to Solana devnet...'
                  : 'Waiting for blockchain confirmation...'}
              </p>

              {/* Transaction Signature */}
              <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/50 mb-4">
                <p className="text-xs text-slate-400 mb-2">Transaction Signature</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-slate-300 font-mono truncate">
                    {transactionData.signature}
                  </code>
                  <button
                    onClick={copySignature}
                    className="p-2 rounded-lg bg-slate-600/50 hover:bg-slate-600 transition-colors"
                  >
                    {copiedSignature ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Solana devnet transactions typically confirm in 1-2 seconds
              </p>
            </div>
          )}

          {/* Confirmed State */}
          {claimState === 'confirmed' && transactionData && rewardData && (
            <div>
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-3xl text-white mb-2">Reward Claimed!</h2>
                <p className="text-slate-400">Your tokens have been minted successfully</p>
              </div>

              {/* Reward Summary */}
              <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-emerald-300 mb-1">You Received</p>
                  <p className="text-4xl text-emerald-400 font-bold">
                    {rewardData.amount.toFixed(2)} WMINT
                  </p>
                  <p className="text-xs text-emerald-500/70 mt-1">WordMint Tokens</p>
                </div>

                <div className="pt-4 border-t border-emerald-500/20 space-y-2">
                  {/* Network Badge */}
                  <div className="flex items-center justify-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                      <span className="text-xs text-emerald-300 font-medium">Solana Devnet</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-3 mb-6">
                {/* Mint Address */}
                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                  <p className="text-xs text-slate-400 mb-1">Token Mint Address</p>
                  <code className="text-xs text-slate-300 font-mono break-all">
                    {transactionData.mintAddress}
                  </code>
                </div>

                {/* Transaction Signature */}
                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                  <p className="text-xs text-slate-400 mb-2">Transaction Signature</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-slate-300 font-mono truncate">
                      {transactionData.signature}
                    </code>
                    <button
                      onClick={copySignature}
                      className="p-2 rounded-lg bg-slate-600/50 hover:bg-slate-600 transition-colors"
                    >
                      {copiedSignature ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Explorer Link */}
                <a
                  href={transactionData.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-sm text-blue-300 font-medium">
                          View on Solana Explorer
                        </p>
                        <p className="text-xs text-blue-400/70">Verify transaction on-chain</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                      <ExternalLink className="w-3 h-3 text-blue-400" />
                    </div>
                  </div>
                </a>
              </div>

              {/* Action Buttons */}
              <button
                onClick={onComplete}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all"
              >
                Continue Playing
              </button>
            </div>
          )}

          {/* Failed State */}
          {claimState === 'failed' && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <X className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-2xl text-white mb-2">Claim Failed</h2>
                <p className="text-slate-400 mb-4">Unable to process your reward claim</p>
                
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                >
                  Try Again
                </button>
                
                <button
                  onClick={onBack}
                  className="w-full py-3 rounded-xl bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Already Claimed State */}
          {claimState === 'already-claimed' && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-2xl text-white mb-2">Already Claimed</h2>
                <p className="text-slate-400">You've already claimed rewards for this game</p>
              </div>

              <button
                onClick={onBack}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}