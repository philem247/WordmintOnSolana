/**
 * Web3 and Crypto Word Lists
 * 
 * All words are Web3/blockchain/crypto related terms
 * Categorized by difficulty for balanced gameplay
 */

export type DifficultyMode = 'easy' | 'normal' | 'hard';

/**
 * EASY MODE - 100 common Web3 terms
 * Simple, frequently used crypto/blockchain words
 * Reward: 30 WMINT per correct answer
 */
export const EASY_WORDS = [
  // Basic crypto terms
  'bitcoin', 'crypto', 'token', 'wallet', 'chain', 'block', 'mint', 'stake',
  'swap', 'trade', 'pool', 'farm', 'yield', 'node', 'peer', 'hash',
  'coin', 'digital', 'virtual', 'online', 'network', 'system', 'protocol',
  
  // Common Solana terms
  'solana', 'phantom', 'anchor', 'metaplex', 'candy', 'magic', 'serum',
  
  // Basic DeFi
  'defi', 'dex', 'nft', 'dao', 'gas', 'fee', 'price', 'value',
  'buy', 'sell', 'send', 'receive', 'transfer', 'balance', 'total',
  
  // Web3 basics
  'web', 'app', 'platform', 'market', 'exchange', 'bridge', 'link',
  'seed', 'key', 'sign', 'verify', 'scan', 'code', 'address',
  
  // Gaming & NFTs
  'game', 'play', 'earn', 'collect', 'rare', 'unique', 'art',
  'drop', 'launch', 'mint', 'burn', 'list', 'floor', 'volume',
  
  // Community terms
  'holder', 'whale', 'ape', 'degen', 'fomo', 'hodl', 'moon',
  'pump', 'dump', 'bull', 'bear', 'alpha', 'beta', 'launch',
  
  // Additional terms
  'claim', 'airdrop', 'snapshot', 'epoch', 'slot', 'vote', 'govern',
  'treasury', 'fund', 'pool', 'reserve', 'supply', 'demand', 'liquid'
];

/**
 * NORMAL MODE - 100 intermediate Web3 terms
 * More complex blockchain terminology
 * Reward: 50 WMINT per correct answer
 */
export const NORMAL_WORDS = [
  // Blockchain concepts
  'blockchain', 'consensus', 'validator', 'mining', 'staking', 'delegation',
  'transaction', 'signature', 'encryption', 'decentralized', 'distributed',
  'immutable', 'permissionless', 'trustless', 'censorship', 'resistant',
  
  // Solana specific
  'program', 'instruction', 'account', 'lamport', 'cluster', 'devnet',
  'mainnet', 'testnet', 'runtime', 'sealevel', 'turbine', 'gulfstream',
  'solflare', 'raydium', 'orca', 'marinade', 'jupiter', 'squads',
  
  // DeFi protocols
  'liquidity', 'automated', 'market', 'maker', 'impermanent', 'loss',
  'slippage', 'leverage', 'collateral', 'liquidation', 'oracle', 'aggregator',
  'composability', 'interoperability', 'synthetic', 'derivative',
  
  // NFT ecosystem
  'metadata', 'royalty', 'collection', 'edition', 'provenance', 'rarity',
  'generative', 'pfp', 'utility', 'community', 'whitelist', 'allowlist',
  
  // Tokenomics
  'tokenomics', 'emission', 'vesting', 'unlock', 'inflation', 'deflation',
  'buyback', 'circulating', 'maximum', 'dilution', 'governance',
  
  // Security
  'multisig', 'custody', 'noncustodial', 'recovery', 'backup', 'phishing',
  'exploit', 'vulnerability', 'audit', 'verification', 'authentication',
  
  // Additional
  'interface', 'protocol', 'standard', 'specification', 'implementation',
  'integration', 'migration', 'upgrade', 'deprecated', 'legacy'
];

/**
 * HARD MODE - 100 advanced Web3 terms
 * Technical, complex crypto/blockchain terminology
 * Reward: 70 WMINT per correct answer
 */
export const HARD_WORDS = [
  // Advanced blockchain
  'merkle', 'patricia', 'trie', 'sharding', 'rollup', 'optimistic',
  'zeroknowledge', 'cryptographic', 'elliptic', 'curve', 'schnorr',
  'threshold', 'polynomial', 'commitment', 'homomorphic', 'encryption',
  
  // Solana technical
  'turbovote', 'cloudbreak', 'pipelining', 'parallelization', 'sealevel',
  'gulfstream', 'archivers', 'replicators', 'validators', 'leaders',
  'gossip', 'entrypoint', 'blockstore', 'accountsdb', 'snapshots',
  
  // Advanced DeFi
  'bonding', 'curve', 'liquidity', 'bootstrapping', 'flashloan',
  'arbitrage', 'sandwich', 'frontrunning', 'maximal', 'extractable',
  'rebalancing', 'concentrated', 'volatility', 'perpetual', 'futures',
  
  // Cryptography
  'asymmetric', 'symmetric', 'hashing', 'salting', 'nonce', 'signature',
  'verification', 'authentication', 'authorization', 'certification',
  'revocation', 'timestamping', 'notarization', 'attestation',
  
  // Protocol design
  'byzantine', 'tolerance', 'finality', 'liveness', 'safety',
  'equivocation', 'slashing', 'griefing', 'sybil', 'resistance',
  'incentive', 'mechanism', 'gametheory', 'adversarial', 'conditions',
  
  // Advanced NFT
  'programmable', 'composable', 'fractional', 'ownership', 'tokenization',
  'semifungible', 'dynamic', 'evolving', 'interactive', 'onchain',
  
  // MEV & Trading
  'searcher', 'builder', 'proposer', 'separation', 'inclusion',
  'censorship', 'resistance', 'mempool', 'transaction', 'ordering',
  
  // Additional technical
  'deterministic', 'nondeterministic', 'idempotent', 'stateless',
  'stateful', 'atomic', 'eventual', 'consistency', 'replication'
];

/**
 * Get random word from specific difficulty
 */
export function getRandomWord(difficulty: DifficultyMode): string {
  let wordList: string[];
  
  switch (difficulty) {
    case 'easy':
      wordList = EASY_WORDS;
      break;
    case 'normal':
      wordList = NORMAL_WORDS;
      break;
    case 'hard':
      wordList = HARD_WORDS;
      break;
    default:
      wordList = NORMAL_WORDS;
  }
  
  const randomIndex = Math.floor(Math.random() * wordList.length);
  return wordList[randomIndex];
}

/**
 * Get base WMINT reward for difficulty (multiplied by 10 in the game)
 * Returns the multiplier used to calculate WMINT:
 * - Easy: 3 * 10 = 30 WMINT base
 * - Normal: 5 * 10 = 50 WMINT base
 * - Hard: 7 * 10 = 70 WMINT base
 */
export function getWMINTForDifficulty(difficulty: DifficultyMode): number {
  switch (difficulty) {
    case 'easy':
      return 3;  // 3 * 10 = 30 WMINT
    case 'normal':
      return 5;  // 5 * 10 = 50 WMINT
    case 'hard':
      return 7;  // 7 * 10 = 70 WMINT
    default:
      return 5;
  }
}

// Legacy alias for backward compatibility (deprecated)
/** @deprecated Use getWMINTForDifficulty instead */
export const getXPForDifficulty = getWMINTForDifficulty;

/**
 * Get difficulty color scheme
 */
export function getDifficultyColor(difficulty: DifficultyMode): {
  bg: string;
  border: string;
  text: string;
  glow: string;
} {
  switch (difficulty) {
    case 'easy':
      return {
        bg: 'from-emerald-500/10 to-emerald-500/5',
        border: 'border-emerald-500/20',
        text: 'text-emerald-400',
        glow: 'shadow-emerald-500/20'
      };
    case 'normal':
      return {
        bg: 'from-blue-500/10 to-blue-500/5',
        border: 'border-blue-500/20',
        text: 'text-blue-400',
        glow: 'shadow-blue-500/20'
      };
    case 'hard':
      return {
        bg: 'from-purple-500/10 to-purple-500/5',
        border: 'border-purple-500/20',
        text: 'text-purple-400',
        glow: 'shadow-purple-500/20'
      };
  }
}

/**
 * Get difficulty display name
 */
export function getDifficultyName(difficulty: DifficultyMode): string {
  switch (difficulty) {
    case 'easy':
      return 'Easy Mode';
    case 'normal':
      return 'Normal Mode';
    case 'hard':
      return 'Hard Mode';
    default:
      return 'Normal Mode';
  }
}

/**
 * Get difficulty description
 */
export function getDifficultyDescription(difficulty: DifficultyMode): string {
  switch (difficulty) {
    case 'easy':
      return 'Common Web3 terms • 30 WMINT per word';
    case 'normal':
      return 'Intermediate concepts • 50 WMINT per word';
    case 'hard':
      return 'Advanced terminology • 70 WMINT per word';
    default:
      return 'Balanced gameplay';
  }
}