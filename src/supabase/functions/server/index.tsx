import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.tsx';
import { mintTokensToPlayer, getTokenMintAddress, validateRewardClaim } from './solana-token.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Health check
app.get('/make-server-02a4aef8/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get player data by wallet address
app.get('/make-server-02a4aef8/player/:walletAddress', async (c) => {
  try {
    const walletAddress = c.req.param('walletAddress');
    const key = `player:${walletAddress}`;
    
    const playerData = await kv.get(key);
    
    if (!playerData) {
      return c.json({ exists: false }, 404);
    }
    
    return c.json({ 
      exists: true, 
      player: playerData 
    });
  } catch (error) {
    console.log(`Error fetching player data: ${error}`);
    return c.json({ error: 'Failed to fetch player data', details: String(error) }, 500);
  }
});

// Create or update player data
app.post('/make-server-02a4aef8/player', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, score, level, streak, gamesPlayed } = body;
    
    if (!walletAddress) {
      return c.json({ error: 'Wallet address is required' }, 400);
    }
    
    const key = `player:${walletAddress}`;
    const playerData = {
      walletAddress,
      score: score || 0,
      totalWmintEarned: 0, // Always start at 0 for new players
      level: level || 1,
      streak: streak || 0,
      gamesPlayed: gamesPlayed || 0,
      lastUpdated: new Date().toISOString()
    };
    
    await kv.set(key, playerData);
    
    return c.json({ 
      success: true, 
      player: playerData 
    });
  } catch (error) {
    console.log(`Error saving player data: ${error}`);
    return c.json({ error: 'Failed to save player data', details: String(error) }, 500);
  }
});

// Update player stats after a game
app.patch('/make-server-02a4aef8/player/:walletAddress/stats', async (c) => {
  try {
    const walletAddress = c.req.param('walletAddress');
    const body = await c.req.json();
    const { scoreIncrease, isCorrect } = body;
    
    const key = `player:${walletAddress}`;
    const existingData = await kv.get(key);
    
    if (!existingData) {
      return c.json({ error: 'Player not found' }, 404);
    }
    
    const updatedData = {
      ...existingData,
      score: existingData.score + (scoreIncrease || 0),
      streak: isCorrect ? existingData.streak + 1 : 0,
      gamesPlayed: existingData.gamesPlayed + 1,
      level: Math.floor((existingData.gamesPlayed + 1) / 5) + 1,
      lastUpdated: new Date().toISOString()
    };
    
    await kv.set(key, updatedData);
    
    return c.json({ 
      success: true, 
      data: updatedData 
    });
  } catch (error) {
    console.log(`Error updating player stats: ${error}`);
    return c.json({ error: 'Failed to update player stats', details: String(error) }, 500);
  }
});

// Get leaderboard (top players by score)
app.get('/make-server-02a4aef8/leaderboard', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    
    // Get all player records
    const allPlayers = await kv.getByPrefix('player:');
    
    // Sort by totalWmintEarned and take top N
    const leaderboard = allPlayers
      .sort((a, b) => (b.totalWmintEarned || 0) - (a.totalWmintEarned || 0))
      .slice(0, limit)
      .map((player, index) => ({
        rank: index + 1,
        walletAddress: player.walletAddress,
        score: player.totalWmintEarned || 0, // Use total WMINT earned for leaderboard
        level: player.level,
        gamesPlayed: player.gamesPlayed
      }));
    
    return c.json({ 
      leaderboard,
      total: allPlayers.length 
    });
  } catch (error) {
    console.log(`Error fetching leaderboard: ${error}`);
    return c.json({ error: 'Failed to fetch leaderboard', details: String(error) }, 500);
  }
});

// Delete player data (for testing/cleanup)
app.delete('/make-server-02a4aef8/player/:walletAddress', async (c) => {
  try {
    const walletAddress = c.req.param('walletAddress');
    const key = `player:${walletAddress}`;
    
    await kv.del(key);
    
    return c.json({ 
      success: true, 
      message: 'Player data deleted' 
    });
  } catch (error) {
    console.log(`Error deleting player data: ${error}`);
    return c.json({ error: 'Failed to delete player data', details: String(error) }, 500);
  }
});

// Clear all leaderboard data (for testing/cleanup)
app.post('/make-server-02a4aef8/clear-leaderboard', async (c) => {
  try {
    const allPlayers = await kv.getByPrefix('player:');
    const deletePromises = allPlayers.map(player => 
      kv.del(`player:${player.walletAddress}`)
    );
    
    await Promise.all(deletePromises);
    
    console.log(`🗑️ Cleared ${allPlayers.length} players from leaderboard`);
    
    return c.json({ 
      success: true, 
      message: `Deleted ${allPlayers.length} players`,
      count: allPlayers.length
    });
  } catch (error) {
    console.log(`Error clearing leaderboard: ${error}`);
    return c.json({ error: 'Failed to clear leaderboard', details: String(error) }, 500);
  }
});

/**
 * BLOCKCHAIN ENDPOINT: Get WordMint token mint address
 * Returns the SPL token mint address for frontend to query balances
 */
app.get('/make-server-02a4aef8/token/mint', async (c) => {
  try {
    const mintAddress = await getTokenMintAddress();
    
    if (!mintAddress) {
      return c.json({ 
        error: 'Token mint not configured',
        message: 'Please complete the Solana setup. See SOLANA_SETUP_GUIDE.md for instructions.',
        setupRequired: true
      }, 500);
    }
    
    return c.json({
      mintAddress,
      name: 'WordMint Token',
      symbol: 'WMINT',
      decimals: 9,
      network: 'devnet',
    });
  } catch (error: any) {
    console.log(`Error getting token mint: ${error}`);
    
    const errorMessage = error.message || 'Failed to get token mint';
    const isConfigError = errorMessage.includes('WORDMINT_MINT_AUTHORITY');
    
    return c.json({ 
      error: 'Failed to get token mint', 
      message: errorMessage,
      setupRequired: isConfigError,
      details: String(error) 
    }, 500);
  }
});

/**
 * BLOCKCHAIN ENDPOINT: Mint tokens to player (reward claim)
 * 
 * This endpoint performs a real SPL token mint transaction on Solana devnet
 * The transaction is signed by the server's mint authority
 * 
 * Flow:
 * 1. Validate reward claim
 * 2. Check player hasn't already claimed this reward
 * 3. Mint SPL tokens to player's wallet
 * 4. Record claim in database
 * 5. Return transaction signature
 */
app.post('/make-server-02a4aef8/token/claim', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, amount, gameScore, gameId } = body;
    
    if (!walletAddress) {
      return c.json({ error: 'Wallet address is required' }, 400);
    }
    
    if (!amount || amount <= 0) {
      return c.json({ error: 'Invalid reward amount' }, 400);
    }
    
    // Validate the claim
    const validation = await validateRewardClaim(walletAddress, gameScore, amount);
    if (!validation.valid) {
      return c.json({ error: validation.reason }, 400);
    }
    
    // Check if this game has already been claimed
    const claimKey = `claim:${walletAddress}:${gameId || Date.now()}`;
    const existingClaim = await kv.get(claimKey);
    
    if (existingClaim) {
      return c.json({ error: 'Reward already claimed for this game' }, 400);
    }
    
    // Mint tokens (REAL BLOCKCHAIN TRANSACTION)
    console.log(`Minting ${amount} WMINT to ${walletAddress}`);
    const result = await mintTokensToPlayer(walletAddress, amount);
    
    if (!result.success) {
      return c.json({ 
        error: result.error || 'Failed to mint tokens',
        details: result.error 
      }, 500);
    }
    
    // Record the claim
    await kv.set(claimKey, {
      walletAddress,
      amount,
      gameScore,
      signature: result.signature,
      timestamp: new Date().toISOString(),
    });
    
    // Update player's total token earnings
    const playerKey = `player:${walletAddress}`;
    const playerData = await kv.get(playerKey);
    if (playerData) {
      playerData.totalWmintEarned = (playerData.totalWmintEarned || 0) + amount;
      await kv.set(playerKey, playerData);
    }
    
    return c.json({
      success: true,
      signature: result.signature,
      mintAddress: result.mintAddress,
      amount,
      explorerUrl: `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`,
    });
  } catch (error) {
    console.log(`Error claiming tokens: ${error}`);
    return c.json({ error: 'Failed to claim tokens', details: String(error) }, 500);
  }
});

/**
 * REAL-TIME BLOCKCHAIN ENDPOINT: Mint tokens immediately during gameplay
 * Unlike /token/claim, this mints tokens instantly without validation
 * Used for real-time rewards during word spelling
 */
app.post('/make-server-02a4aef8/mint-tokens', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, amount, gameScore, gameId } = body;
    
    if (!walletAddress) {
      return c.json({ error: 'Wallet address is required' }, 400);
    }
    
    if (!amount || amount <= 0) {
      return c.json({ error: 'Invalid amount' }, 400);
    }
    
    // Basic sanity check: no single word should give more than 200 WMINT
    // (70 base + 100 bonus + 30 streak is max ~200)
    if (amount > 200) {
      return c.json({ error: 'Amount too high for single word reward' }, 400);
    }
    
    // Mint tokens (REAL BLOCKCHAIN TRANSACTION)
    // No complex validation needed - this is real-time per-word minting
    console.log(`🪙 Real-time minting ${amount} WMINT to ${walletAddress}`);
    const result = await mintTokensToPlayer(walletAddress, amount);
    
    if (!result.success) {
      console.error(`❌ Minting failed: ${result.error}`);
      return c.json({ 
        error: result.error || 'Failed to mint tokens',
        details: result.error 
      }, 500);
    }
    
    console.log(`✅ Minted ${amount} WMINT! TX: ${result.signature}`);
    
    // Record the mint transaction
    const mintKey = `mint:${walletAddress}:${gameId || Date.now()}`;
    await kv.set(mintKey, {
      walletAddress,
      amount,
      gameScore,
      signature: result.signature,
      timestamp: new Date().toISOString(),
    });
    
    return c.json({
      success: true,
      signature: result.signature,
      mintAddress: result.mintAddress,
      amount,
      explorerUrl: `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`,
    });
  } catch (error) {
    console.log(`❌ Error minting tokens: ${error}`);
    return c.json({ error: 'Failed to mint tokens', details: String(error) }, 500);
  }
});

/**
 * Update player stats after answering a word
 * Simpler endpoint for updating score and streak in real-time
 */
app.post('/make-server-02a4aef8/update-stats', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, wmintEarned, correct } = body;
    
    if (!walletAddress) {
      return c.json({ error: 'Wallet address is required' }, 400);
    }
    
    const key = `player:${walletAddress}`;
    const existingData = await kv.get(key);
    
    if (!existingData) {
      return c.json({ error: 'Player not found' }, 404);
    }
    
    // Update stats based on correctness
    const updatedData = {
      ...existingData,
      score: existingData.score + (wmintEarned || 0),
      streak: correct ? existingData.streak + 1 : 0,
      gamesPlayed: existingData.gamesPlayed + 1,
      level: Math.floor(existingData.score / 500) + 1, // Level up every 500 WMINT
      lastUpdated: new Date().toISOString()
    };
    
    await kv.set(key, updatedData);
    
    return c.json({ 
      success: true, 
      player: updatedData 
    });
  } catch (error) {
    console.log(`Error updating player stats: ${error}`);
    return c.json({ error: 'Failed to update player stats', details: String(error) }, 500);
  }
});

/**
 * Reset player score to 0 after claiming rewards
 * This prevents double-claiming of the same tokens
 */
app.post('/make-server-02a4aef8/reset-score', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, claimedAmount } = body;
    
    if (!walletAddress) {
      return c.json({ error: 'Wallet address is required' }, 400);
    }
    
    const key = `player:${walletAddress}`;
    const existingData = await kv.get(key);
    
    if (!existingData) {
      return c.json({ error: 'Player not found' }, 404);
    }
    
    // Reset score to 0, add claimed amount to total WMINT earned
    const updatedData = {
      ...existingData,
      score: 0,
      totalWmintEarned: (existingData.totalWmintEarned || 0) + (claimedAmount || 0),
      lastUpdated: new Date().toISOString()
    };
    
    await kv.set(key, updatedData);
    
    console.log(`✅ Reset score for ${walletAddress}, total earned: ${updatedData.totalWmintEarned}`);
    
    return c.json({ 
      success: true, 
      player: updatedData 
    });
  } catch (error) {
    console.log(`Error resetting player score: ${error}`);
    return c.json({ error: 'Failed to reset player score', details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);