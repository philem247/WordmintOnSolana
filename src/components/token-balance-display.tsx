/**
 * TOKEN BALANCE DISPLAY
 * 
 * Shows user's SPL token balance fetched from Solana blockchain
 * Includes loading, zero-balance, and error states
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Coins, RefreshCw, ExternalLink, AlertCircle, Loader } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

type BalanceState = 'loading' | 'loaded' | 'error' | 'zero';

interface TokenBalanceDisplayProps {
  walletAddress: string;
}

interface TokenInfo {
  mintAddress: string;
  name: string;
  symbol: string;
  decimals: number;
}

export function TokenBalanceDisplay({ walletAddress }: TokenBalanceDisplayProps) {
  const [balanceState, setBalanceState] = useState<BalanceState>('loading');
  const [balance, setBalance] = useState<number>(0);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchTokenInfo();
  }, []);

  useEffect(() => {
    if (tokenInfo) {
      fetchBalance();
    }
  }, [tokenInfo, walletAddress]);

  /**
   * BLOCKCHAIN INTERACTION: Fetch token mint info
   */
  const fetchTokenInfo = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-02a4aef8/token/mint`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Check if this is a setup error
        if (data.setupRequired) {
          setError(data.message || 'Solana setup required. Please configure WORDMINT_MINT_AUTHORITY.');
        } else {
          throw new Error(data.message || 'Failed to fetch token info');
        }
        setBalanceState('error');
        return;
      }

      setTokenInfo({
        mintAddress: data.mintAddress,
        name: data.name,
        symbol: data.symbol,
        decimals: data.decimals,
      });
    } catch (err: any) {
      console.error('Error fetching token info:', err);
      setError(err.message || 'Unable to load token info');
      setBalanceState('error');
    }
  };

  /**
   * BLOCKCHAIN INTERACTION: Fetch token balance from Solana
   * 
   * Queries the user's associated token account on-chain
   */
  const fetchBalance = async () => {
    if (!tokenInfo) return;

    try {
      setBalanceState('loading');
      setError(null);

      // Retry wrapper for connection issues
      const maxRetries = 3;
      let lastError: any;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await fetch(
            `https://api.devnet.solana.com`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTokenAccountsByOwner',
                params: [
                  walletAddress,
                  {
                    mint: tokenInfo.mintAddress,
                  },
                  {
                    encoding: 'jsonParsed',
                  },
                ],
              }),
            }
          );

          const data = await response.json();

          if (data.error) {
            // Check if it's a "could not find mint" error
            if (data.error.message?.includes('could not find mint')) {
              // Mint doesn't exist yet - treat as zero balance
              console.warn('Token mint not found on-chain yet, showing zero balance');
              setBalance(0);
              setBalanceState('zero');
              return;
            }
            throw new Error(data.error.message);
          }

          if (data.result.value.length === 0) {
            // No token account found = zero balance
            setBalance(0);
            setBalanceState('zero');
          } else {
            const tokenAccount = data.result.value[0];
            const tokenAmount = tokenAccount.account.data.parsed.info.tokenAmount;
            const balanceValue = parseFloat(tokenAmount.uiAmountString || '0');
            
            setBalance(balanceValue);
            setBalanceState(balanceValue === 0 ? 'zero' : 'loaded');
          }
          
          // Success - exit retry loop
          return;
        } catch (err: any) {
          lastError = err;
          console.warn(`Balance fetch attempt ${attempt + 1}/${maxRetries} failed:`, err.message);
          
          // If not the last attempt, wait before retrying
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
      }
      
      // All retries failed
      throw lastError;
    } catch (err: any) {
      console.error('Error fetching balance after retries:', err);
      setError('Unable to fetch balance. Devnet may be slow.');
      setBalanceState('error');
      // Set balance to 0 on error (assume no balance)
      setBalance(0);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBalance();
  };

  const openExplorer = () => {
    if (!tokenInfo) return;
    window.open(
      `https://explorer.solana.com/address/${tokenInfo.mintAddress}?cluster=devnet`,
      '_blank'
    );
  };

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium">Token Balance</h3>
            <p className="text-xs text-slate-400">SPL Token on Devnet</p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || balanceState === 'loading'}
          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading State */}
      {balanceState === 'loading' && !isRefreshing && (
        <div className="py-8 text-center">
          <Loader className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Fetching balance from blockchain...</p>
        </div>
      )}

      {/* Loaded State */}
      {(balanceState === 'loaded' || (balanceState === 'zero' && !isRefreshing)) && tokenInfo && (
        <div>
          <div className="py-6 text-center">
            <p className="text-4xl text-amber-400 font-bold mb-1">
              {balance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-slate-400">{tokenInfo.symbol}</p>
          </div>

          {/* Zero Balance Message */}
          {balanceState === 'zero' && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-blue-300">
                    <strong>No tokens yet</strong>
                  </p>
                  <p className="text-xs text-blue-400/70 mt-1">
                    Play games and claim rewards to earn {tokenInfo.symbol} tokens
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Token Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Token Name</span>
              <span className="text-slate-300">{tokenInfo.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Network</span>
              <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <span className="text-emerald-300">Solana Devnet</span>
              </div>
            </div>
          </div>

          {/* View on Explorer */}
          <button
            onClick={openExplorer}
            className="w-full mt-4 p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-all group"
          >
            <div className="flex items-center justify-center gap-2">
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
              <span className="text-sm text-slate-400 group-hover:text-slate-300">
                View Token on Explorer
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Error State */}
      {balanceState === 'error' && (
        <div className="py-6">
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-sm text-amber-300 mb-1">Setup Required</p>
            <p className="text-xs text-amber-400/70 mb-3">{error || 'Unable to load token info'}</p>
            
            <div className="text-left space-y-2 mb-4">
              <p className="text-xs text-amber-300">
                <strong>Quick Setup:</strong>
              </p>
              <ol className="text-xs text-amber-400/80 space-y-1 list-decimal list-inside">
                <li>Generate keypair: <code className="text-amber-300">solana-keygen new</code></li>
                <li>Get devnet SOL: <code className="text-amber-300">solana airdrop 2</code></li>
                <li>Add keypair to <code className="text-amber-300">WORDMINT_MINT_AUTHORITY</code> secret</li>
              </ol>
            </div>
            
            <p className="text-xs text-blue-300">
              📖 See <code className="text-blue-200">SOLANA_SETUP_GUIDE.md</code> for details
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            className="w-full mt-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-all"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}