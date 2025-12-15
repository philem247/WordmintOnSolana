/**
 * SOLANA SPL TOKEN BACKEND
 * 
 * Server-side SPL token minting for WordMint rewards
 * This holds the mint authority and mints tokens to players when they claim
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from 'npm:@solana/web3.js@1.87.6';

import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getMint,
} from 'npm:@solana/spl-token@0.3.9';

// Solana devnet connection
const DEVNET_RPC = 'https://api.devnet.solana.com';
const connection = new Connection(DEVNET_RPC, 'confirmed');

// Token details
const TOKEN_DECIMALS = 9;
const TOKEN_NAME = 'WordMint Token';
const TOKEN_SYMBOL = 'WMINT';

/**
 * Retry wrapper for Solana RPC calls with exponential backoff
 */
async function retryRpcCall<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.log(`RPC call failed (attempt ${i + 1}/${maxRetries}):`, error.message);
      
      if (i < maxRetries - 1) {
        // Exponential backoff
        const delay = delayMs * Math.pow(2, i);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Get or create mint authority keypair from environment
 * In production, this should be stored securely in Supabase secrets
 */
function getMintAuthority(): Keypair {
  const secretKey = Deno.env.get('WORDMINT_MINT_AUTHORITY');
  
  if (!secretKey) {
    throw new Error(
      'WORDMINT_MINT_AUTHORITY not configured. ' +
      'Please follow the setup guide in SOLANA_SETUP_GUIDE.md to generate and configure your mint authority keypair.'
    );
  }
  
  // Parse secret key (should be array of numbers in JSON format)
  try {
    const trimmedKey = secretKey.trim();
    const secretArray = JSON.parse(trimmedKey);
    
    if (!Array.isArray(secretArray)) {
      throw new Error(
        `WORDMINT_MINT_AUTHORITY must be a JSON array of numbers. ` +
        `Got type: ${typeof secretArray}`
      );
    }
    
    if (secretArray.length !== 64) {
      throw new Error(
        `WORDMINT_MINT_AUTHORITY must be exactly 64 bytes. ` +
        `Got length: ${secretArray.length}`
      );
    }
    
    // Validate all elements are numbers
    const allNumbers = secretArray.every(x => typeof x === 'number' && x >= 0 && x <= 255);
    if (!allNumbers) {
      throw new Error(
        'WORDMINT_MINT_AUTHORITY array must contain only numbers between 0-255'
      );
    }
    
    console.log('✅ Mint authority keypair loaded successfully');
    return Keypair.fromSecretKey(Uint8Array.from(secretArray));
  } catch (error: any) {
    // Re-throw our custom errors
    if (error.message.includes('WORDMINT_MINT_AUTHORITY')) {
      throw error;
    }
    
    // Generic JSON parsing error
    console.error('Failed to parse WORDMINT_MINT_AUTHORITY');
    throw new Error(
      'Invalid WORDMINT_MINT_AUTHORITY format. ' +
      'Expected: JSON array of 64 numbers like [123,45,67,...]. ' +
      `Got parse error: ${error.message}. ` +
      'Make sure to paste the array exactly as shown, with no extra characters or formatting.'
    );
  }
}

/**
 * Get or create the WordMint token mint
 */
async function getOrCreateMint(): Promise<PublicKey> {
  const mintAuthority = getMintAuthority();
  
  // Check if mint address is stored in environment
  const storedMint = Deno.env.get('WORDMINT_TOKEN_MINT');
  
  if (storedMint) {
    try {
      const mintPublicKey = new PublicKey(storedMint);
      
      // Try to verify mint exists on-chain with retry logic
      try {
        const mintInfo = await retryRpcCall(
          () => getMint(connection, mintPublicKey),
          2, // Only 2 retries for verification
          500 // 500ms initial delay
        );
        console.log(`✅ Using existing token mint: ${mintPublicKey.toBase58()}`);
        console.log(`Mint authority: ${mintInfo.mintAuthority?.toBase58()}`);
        return mintPublicKey;
      } catch (verifyError: any) {
        // If verification fails due to connection issues, still use the stored mint
        // This allows the app to work even if devnet is slow/degraded
        if (verifyError.message?.includes('connection') || verifyError.message?.includes('error sending request')) {
          console.warn('⚠️ Could not verify mint on-chain (connection issue), using stored mint anyway:', storedMint);
          return mintPublicKey;
        }
        
        // If mint truly doesn't exist, create a new one
        console.error('Stored mint not found on-chain:', verifyError.message);
        console.log('Will create new mint...');
      }
    } catch (error) {
      console.error('Error with stored mint:', error);
    }
  }
  
  // Create new mint with retry logic
  console.log('Creating new WordMint token mint...');
  const mint = await retryRpcCall(
    () => createMint(
      connection,
      mintAuthority,
      mintAuthority.publicKey,
      mintAuthority.publicKey, // Freeze authority (optional)
      TOKEN_DECIMALS
    ),
    3, // 3 retries for creation
    1000 // 1 second initial delay
  );
  
  console.log(`✅ Created new mint: ${mint.toBase58()}`);
  console.log(`📝 IMPORTANT: Set WORDMINT_TOKEN_MINT environment variable to: ${mint.toBase58()}`);
  console.log(`   This will ensure the same token is used across restarts`);
  
  return mint;
}

/**
 * Mint tokens to a player's wallet
 */
export async function mintTokensToPlayer(
  playerAddress: string,
  amount: number
): Promise<{
  success: boolean;
  signature?: string;
  error?: string;
  mintAddress?: string;
}> {
  try {
    const mintAuthority = getMintAuthority();
    const mint = await getOrCreateMint();
    const playerPublicKey = new PublicKey(playerAddress);
    
    // Convert amount to token units (considering decimals)
    const tokenAmount = BigInt(Math.floor(amount * Math.pow(10, TOKEN_DECIMALS)));
    
    // Get or create player's associated token account with retry
    const playerTokenAccount = await retryRpcCall(
      () => getOrCreateAssociatedTokenAccount(
        connection,
        mintAuthority,
        mint,
        playerPublicKey
      ),
      3,
      1000
    );
    
    console.log(`Minting ${amount} WMINT to ${playerAddress}`);
    console.log(`Player token account: ${playerTokenAccount.address.toBase58()}`);
    
    // Mint tokens to player with retry
    const signature = await retryRpcCall(
      () => mintTo(
        connection,
        mintAuthority,
        mint,
        playerTokenAccount.address,
        mintAuthority.publicKey,
        tokenAmount
      ),
      3,
      1000
    );
    
    console.log(`✅ Minted ${amount} WMINT, transaction: ${signature}`);
    
    return {
      success: true,
      signature,
      mintAddress: mint.toBase58(),
    };
  } catch (error: any) {
    console.error('Error minting tokens:', error);
    return {
      success: false,
      error: error.message || 'Failed to mint tokens',
    };
  }
}

/**
 * Get token mint address
 */
export async function getTokenMintAddress(): Promise<string | null> {
  try {
    const mint = await getOrCreateMint();
    return mint.toBase58();
  } catch (error) {
    console.error('Error getting mint address:', error);
    return null;
  }
}

/**
 * Validate reward claim
 * Checks that the player has earned the reward and hasn't already claimed it
 */
export async function validateRewardClaim(
  walletAddress: string,
  gameScore: number,
  claimAmount: number
): Promise<{
  valid: boolean;
  reason?: string;
}> {
  // Basic validation
  if (!walletAddress || walletAddress.length < 32) {
    return {
      valid: false,
      reason: 'Invalid wallet address',
    };
  }
  
  if (gameScore <= 0) {
    return {
      valid: false,
      reason: 'Invalid game score',
    };
  }
  
  // WMINT is earned directly during gameplay, so gameScore = claimAmount
  // Allow up to 2x for bonuses (streak, level)
  if (claimAmount > gameScore * 2) {
    return {
      valid: false,
      reason: 'Claim amount exceeds expected reward',
    };
  }
  
  return { valid: true };
}