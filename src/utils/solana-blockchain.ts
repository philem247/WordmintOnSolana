/**
 * SOLANA BLOCKCHAIN INTEGRATION
 * 
 * Real Solana devnet integration for WordMint SPL token rewards
 * This is NOT a mock - all transactions are real and verifiable on-chain
 */

import { 
  Connection, 
  PublicKey, 
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Keypair
} from '@solana/web3.js';

import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress
} from '@solana/spl-token';

// Solana Devnet RPC endpoint
export const DEVNET_RPC = 'https://api.devnet.solana.com';

// Initialize connection to Solana devnet
export const connection = new Connection(DEVNET_RPC, 'confirmed');

// WordMint SPL Token details (will be stored in backend after mint creation)
export const WORDMINT_TOKEN = {
  name: 'WordMint Token',
  symbol: 'WMINT',
  decimals: 9,
  // Mint address will be fetched from backend
  mintAddress: null as string | null,
};

/**
 * Transaction state type
 */
export type TransactionState = 
  | 'idle'
  | 'requesting-approval'  // Waiting for user to approve in wallet
  | 'pending'              // Transaction submitted, waiting for confirmation
  | 'confirming'           // Transaction confirmed, waiting for finalization
  | 'confirmed'            // Transaction finalized successfully
  | 'failed'               // Transaction failed
  | 'rejected';            // User rejected in wallet

/**
 * Transaction result
 */
export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
  explorerUrl?: string;
}

/**
 * Get Solana Explorer URL for devnet transaction
 */
export function getExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

/**
 * Get Solana Explorer URL for devnet address
 */
export function getAddressExplorerUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

/**
 * Shorten a public key or signature for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Check if wallet has sufficient SOL for transaction fees
 */
export async function checkSolBalance(publicKey: string): Promise<{
  balance: number;
  hasSufficientBalance: boolean;
}> {
  try {
    const pubKey = new PublicKey(publicKey);
    const balance = await connection.getBalance(pubKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    
    // Require at least 0.01 SOL for transaction fees
    const hasSufficientBalance = solBalance >= 0.01;
    
    return {
      balance: solBalance,
      hasSufficientBalance
    };
  } catch (error) {
    console.error('Error checking SOL balance:', error);
    return {
      balance: 0,
      hasSufficientBalance: false
    };
  }
}

/**
 * BLOCKCHAIN INTERACTION: Fetch SPL token balance
 * 
 * Queries the Solana blockchain for the user's WordMint token balance
 */
export async function fetchTokenBalance(
  walletAddress: string,
  mintAddress: string
): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress);
    const mintPublicKey = new PublicKey(mintAddress);
    
    // Get associated token account address
    const tokenAccountAddress = await getAssociatedTokenAddress(
      mintPublicKey,
      publicKey
    );
    
    // Fetch account info
    const accountInfo = await getAccount(connection, tokenAccountAddress);
    
    // Convert from token units to human-readable amount
    const balance = Number(accountInfo.amount) / Math.pow(10, WORDMINT_TOKEN.decimals);
    
    return balance;
  } catch (error: any) {
    // Account doesn't exist yet (zero balance)
    if (error.message?.includes('could not find account')) {
      return 0;
    }
    console.error('Error fetching token balance:', error);
    return 0;
  }
}

/**
 * BLOCKCHAIN INTERACTION: Request token reward from backend
 * 
 * Requests the backend to mint SPL tokens to the user's wallet
 * The backend holds the mint authority and will sign the transaction
 */
export async function requestTokenReward(
  walletAddress: string,
  amount: number,
  gameScore: number
): Promise<TransactionResult> {
  try {
    // Call backend API to mint tokens
    const response = await fetch('/api/mint-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        amount,
        gameScore,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to mint tokens');
    }
    
    const result = await response.json();
    
    return {
      success: true,
      signature: result.signature,
      explorerUrl: getExplorerUrl(result.signature),
    };
  } catch (error: any) {
    console.error('Error requesting token reward:', error);
    return {
      success: false,
      error: error.message || 'Failed to mint tokens',
    };
  }
}

/**
 * BLOCKCHAIN INTERACTION: Create associated token account
 * 
 * Creates a token account for the user if they don't have one yet
 * This is required before they can receive SPL tokens
 */
export async function createTokenAccount(
  walletAddress: string,
  mintAddress: string,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<TransactionResult> {
  try {
    const publicKey = new PublicKey(walletAddress);
    const mintPublicKey = new PublicKey(mintAddress);
    
    // Get associated token account address
    const tokenAccountAddress = await getAssociatedTokenAddress(
      mintPublicKey,
      publicKey
    );
    
    // Check if account already exists
    try {
      await getAccount(connection, tokenAccountAddress);
      // Account exists, no need to create
      return {
        success: true,
        signature: 'account-already-exists',
      };
    } catch (error: any) {
      // Account doesn't exist, create it
      if (!error.message?.includes('could not find account')) {
        throw error;
      }
    }
    
    // Create instruction to create associated token account
    const instruction = createAssociatedTokenAccountInstruction(
      publicKey,        // payer
      tokenAccountAddress, // associated token account
      publicKey,        // owner
      mintPublicKey     // mint
    );
    
    // Create transaction
    const transaction = new Transaction().add(instruction);
    
    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;
    
    // Request wallet signature
    const signedTransaction = await signTransaction(transaction);
    
    // Send transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize()
    );
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    
    return {
      success: true,
      signature,
      explorerUrl: getExplorerUrl(signature),
    };
  } catch (error: any) {
    console.error('Error creating token account:', error);
    
    // Check if user rejected
    if (error.message?.includes('User rejected') || error.code === 4001) {
      return {
        success: false,
        error: 'Transaction rejected by user',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to create token account',
    };
  }
}

/**
 * Wait for transaction confirmation with timeout
 */
export async function waitForConfirmation(
  signature: string,
  timeout: number = 60000
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const status = await connection.getSignatureStatus(signature);
      
      if (status.value?.confirmationStatus === 'confirmed' || 
          status.value?.confirmationStatus === 'finalized') {
        return true;
      }
      
      if (status.value?.err) {
        console.error('Transaction failed:', status.value.err);
        return false;
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error checking transaction status:', error);
    }
  }
  
  return false;
}

/**
 * Calculate token reward based on game score
 * 
 * Reward formula:
 * - Base reward: 10 WMINT per correct answer
 * - Streak bonus: +1 WMINT per streak point
 * - Level bonus: +0.5 WMINT per level
 */
export function calculateTokenReward(
  score: number,
  streak: number,
  level: number
): number {
  const baseReward = score * 10;
  const streakBonus = streak * 1;
  const levelBonus = level * 0.5;
  
  const totalReward = baseReward + streakBonus + levelBonus;
  
  // Round to 2 decimal places
  return Math.round(totalReward * 100) / 100;
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Check if transaction exists on-chain
 */
export async function verifyTransaction(signature: string): Promise<boolean> {
  try {
    const status = await connection.getSignatureStatus(signature);
    return status.value !== null;
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return false;
  }
}
