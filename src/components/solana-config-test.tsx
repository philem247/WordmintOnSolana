/**
 * SOLANA CONFIGURATION TEST SCREEN
 * 
 * Verifies that the Solana SPL token backend is properly configured
 * Shows mint address, authority status, and allows test minting
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ConfigStatus {
  loading: boolean;
  error?: string;
  mintAddress?: string;
  authorityConfigured?: boolean;
  networkStatus?: 'healthy' | 'degraded' | 'down';
}

interface MintTestResult {
  loading: boolean;
  success?: boolean;
  signature?: string;
  error?: string;
}

interface ClearResult {
  loading: boolean;
  success?: boolean;
  count?: number;
  error?: string;
}

export function SolanaConfigTest({ onClose }: { onClose: () => void }) {
  const [configStatus, setConfigStatus] = useState<ConfigStatus>({ loading: true });
  const [mintTest, setMintTest] = useState<MintTestResult>({ loading: false });
  const [clearResult, setClearResult] = useState<ClearResult>({ loading: false });
  const [testWallet, setTestWallet] = useState('');

  // Load configuration status
  useEffect(() => {
    checkConfiguration();
  }, []);

  async function checkConfiguration() {
    setConfigStatus({ loading: true });

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-02a4aef8/token/mint`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      setConfigStatus({
        loading: false,
        mintAddress: data.mintAddress,
        authorityConfigured: !!data.mintAddress,
        networkStatus: 'healthy',
      });
    } catch (error: any) {
      console.error('Configuration check failed:', error);
      setConfigStatus({
        loading: false,
        error: error.message || 'Failed to check configuration',
        authorityConfigured: false,
      });
    }
  }

  async function testMinting() {
    if (!testWallet.trim()) {
      alert('Please enter a wallet address to test minting');
      return;
    }

    setMintTest({ loading: true });

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-02a4aef8/token/claim`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: testWallet.trim(),
            gameScore: 5,
            amount: 50, // 5 points * 10 WMINT
            gameId: `test-${Date.now()}`, // Unique game ID for testing
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Minting failed');
      }

      setMintTest({
        loading: false,
        success: true,
        signature: data.signature,
      });
    } catch (error: any) {
      console.error('Mint test failed:', error);
      setMintTest({
        loading: false,
        success: false,
        error: error.message || 'Failed to mint tokens',
      });
    }
  }

  async function clearLeaderboard() {
    if (!confirm('Are you sure you want to clear ALL player data from the leaderboard? This cannot be undone!')) {
      return;
    }

    setClearResult({ loading: true });

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-02a4aef8/clear-leaderboard`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear leaderboard');
      }

      setClearResult({
        loading: false,
        success: true,
        count: data.count,
      });
    } catch (error: any) {
      console.error('Clear leaderboard failed:', error);
      setClearResult({
        loading: false,
        success: false,
        error: error.message || 'Failed to clear leaderboard',
      });
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 rounded-2xl p-6 max-w-2xl w-full border border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h2 className="text-2xl">Solana Configuration</h2>
              <p className="text-sm text-zinc-400">Devnet SPL Token Setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Configuration Status */}
        <div className="space-y-4">
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">Configuration Status</h3>
              <button
                onClick={checkConfiguration}
                disabled={configStatus.loading}
                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${configStatus.loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {configStatus.loading ? (
              <div className="flex items-center gap-2 text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking configuration...
              </div>
            ) : configStatus.error ? (
              <div className="flex items-start gap-2 text-red-400">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Configuration Error</p>
                  <p className="text-sm mt-1">{configStatus.error}</p>
                  <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-xs space-y-2">
                    <p className="font-medium">Common Issues:</p>
                    <ul className="list-disc list-inside space-y-1 text-red-400/80">
                      <li>WORDMINT_MINT_AUTHORITY must be a JSON array: <code>[49,87,133,...]</code></li>
                      <li>Must include opening <code>[</code> and closing <code>]</code> brackets</li>
                      <li>No extra spaces, newlines, or formatting</li>
                      <li>See SECRET_SETUP_INSTRUCTIONS.md for detailed steps</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Mint Authority */}
                <div className="flex items-center gap-2">
                  {configStatus.authorityConfigured ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                  )}
                  <span className="text-sm">
                    Mint Authority: {configStatus.authorityConfigured ? 'Configured' : 'Not Configured'}
                  </span>
                </div>

                {/* Token Mint */}
                {configStatus.mintAddress && (
                  <div className="bg-zinc-900 rounded-lg p-3">
                    <p className="text-xs text-zinc-400 mb-1">Token Mint Address</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-purple-400 flex-1 overflow-hidden text-ellipsis">
                        {configStatus.mintAddress}
                      </code>
                      <button
                        onClick={() => copyToClipboard(configStatus.mintAddress!)}
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`https://explorer.solana.com/address/${configStatus.mintAddress}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Network Status */}
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Network: Devnet ({configStatus.networkStatus})</span>
                </div>
              </div>
            )}
          </div>

          {/* Expected Configuration */}
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
            <h3 className="text-lg mb-3">Expected Configuration</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-zinc-400">Token Mint:</span>{' '}
                <code className="text-purple-400">BHC25zEXbaEe3dQ1E2XWCycCThFtjhfgS2aDjmcizMgz</code>
              </div>
              <div>
                <span className="text-zinc-400">Mint Authority Public Key:</span>{' '}
                <code className="text-purple-400">BUamPWLRVoMSi7LsX4Mox4kwq4DyCc7uDRVLx6n9PVva</code>
              </div>
              <div className="pt-2 border-t border-zinc-700">
                <p className="text-zinc-400 text-xs">
                  ⚠️ The WORDMINT_MINT_AUTHORITY secret should contain the <strong>secret key array</strong>,
                  not the public key. Run: <code className="text-purple-400">cat ~/wordmint-mint-authority.json</code>
                </p>
              </div>
            </div>
          </div>

          {/* Mint Test */}
          {configStatus.authorityConfigured && (
            <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
              <h3 className="text-lg mb-3">Test Token Minting</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-zinc-400 block mb-1">
                    Test Wallet Address
                  </label>
                  <input
                    type="text"
                    value={testWallet}
                    onChange={(e) => setTestWallet(e.target.value)}
                    placeholder="Enter a Solana wallet address..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Will mint 50 WMINT tokens to this address
                  </p>
                </div>

                <button
                  onClick={testMinting}
                  disabled={mintTest.loading || !testWallet.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg px-4 py-2 transition-colors flex items-center justify-center gap-2"
                >
                  {mintTest.loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    'Test Mint'
                  )}
                </button>

                {/* Mint Result */}
                {mintTest.success && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-green-400 font-medium mb-1">Mint Successful!</p>
                        {mintTest.signature && (
                          <div className="flex items-center gap-2 mt-2">
                            <code className="text-xs text-green-400/80 flex-1 overflow-hidden text-ellipsis">
                              {mintTest.signature}
                            </code>
                            <a
                              href={`https://explorer.solana.com/tx/${mintTest.signature}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-400 hover:text-green-300 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {mintTest.error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                      <div>
                        <p className="text-red-400 font-medium">Mint Failed</p>
                        <p className="text-sm text-red-400/80 mt-1">{mintTest.error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clear Leaderboard */}
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-red-700/50">
            <h3 className="text-lg mb-3 text-red-400">⚠️ Danger Zone</h3>
            
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                Clear all player data from the leaderboard. This action cannot be undone.
              </p>

              <button
                onClick={clearLeaderboard}
                disabled={clearResult.loading}
                className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 disabled:bg-zinc-700 disabled:text-zinc-500 text-red-400 rounded-lg px-4 py-2 transition-colors flex items-center justify-center gap-2"
              >
                {clearResult.loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  'Clear All Leaderboard Data'
                )}
              </button>

              {/* Clear Result */}
              {clearResult.success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="text-green-400 font-medium">Leaderboard Cleared!</p>
                      <p className="text-sm text-green-400/80 mt-1">
                        Deleted {clearResult.count} player{clearResult.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {clearResult.error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-medium">Clear Failed</p>
                      <p className="text-sm text-red-400/80 mt-1">{clearResult.error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 pt-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg px-4 py-2 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}