/**
 * SOLANA SETUP BANNER
 * 
 * Shows when Solana mint authority is not configured
 * Guides admin/developer to complete setup
 */

import { AlertCircle, ExternalLink, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface SolanaSetupBannerProps {
  error?: string;
}

export function SolanaSetupBanner({ error }: SolanaSetupBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-amber-400" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg text-amber-300 font-medium mb-2">
            Solana Setup Required
          </h3>
          <p className="text-sm text-amber-400/80 mb-4">
            To enable SPL token rewards, you need to configure the Solana mint authority.
            This is a one-time setup that takes about 5 minutes.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-300 font-mono">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-xs text-amber-300">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-amber-300">
                  <strong>Generate a Solana keypair</strong>
                </p>
                <p className="text-xs text-amber-400/70 mt-1">
                  Run: <code className="text-amber-300">solana-keygen new --outfile ~/wordmint-mint-authority.json</code>
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-xs text-amber-300">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-amber-300">
                  <strong>Get devnet SOL</strong>
                </p>
                <p className="text-xs text-amber-400/70 mt-1">
                  Run: <code className="text-amber-300">solana airdrop 2 $(solana-keygen pubkey ~/wordmint-mint-authority.json)</code>
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-xs text-amber-300">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-amber-300">
                  <strong>Add to Supabase secrets</strong>
                </p>
                <p className="text-xs text-amber-400/70 mt-1">
                  Copy the keypair array and add it to the <code className="text-amber-300">WORDMINT_MINT_AUTHORITY</code> secret
                </p>
              </div>
            </div>
          </div>

          {/* Documentation Link */}
          <a
            href="https://github.com/solana-labs/solana/blob/master/docs/src/cli/usage.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 transition-all group"
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span className="text-sm text-amber-300">View Setup Guide</span>
            <ExternalLink className="w-3 h-3 text-amber-400/70 group-hover:text-amber-400" />
          </a>

          {/* Info Box */}
          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-300">
              💡 <strong>For developers:</strong> See <code className="text-blue-200">SOLANA_SETUP_GUIDE.md</code> for detailed instructions
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
