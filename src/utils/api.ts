import { getServerUrl } from './supabase/client';
import { publicAnonKey } from './supabase/info';
import { PlayerData } from '../App';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`
};

export async function fetchPlayerData(walletAddress: string): Promise<PlayerData | null> {
  try {
    const response = await fetch(getServerUrl(`/player/${walletAddress}`), {
      headers
    });
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error fetching player data:', error);
      throw new Error(error.error || 'Failed to fetch player data');
    }
    
    const result = await response.json();
    return result.exists ? result.player : null;
  } catch (error) {
    console.error('Error in fetchPlayerData:', error);
    throw error;
  }
}

export async function createOrUpdatePlayer(playerData: PlayerData): Promise<PlayerData> {
  try {
    const response = await fetch(getServerUrl('/player'), {
      method: 'POST',
      headers,
      body: JSON.stringify(playerData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error saving player data:', error);
      throw new Error(error.error || 'Failed to save player data');
    }
    
    const result = await response.json();
    return result.player;
  } catch (error) {
    console.error('Error in createOrUpdatePlayer:', error);
    throw error;
  }
}

export async function updatePlayerStats(
  walletAddress: string, 
  scoreIncrease: number, 
  isCorrect: boolean
): Promise<PlayerData> {
  try {
    const response = await fetch(getServerUrl(`/player/${walletAddress}/stats`), {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ scoreIncrease, isCorrect })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error updating player stats:', error);
      throw new Error(error.error || 'Failed to update player stats');
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error in updatePlayerStats:', error);
    throw error;
  }
}

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  score: number;
  level: number;
  gamesPlayed: number;
}

export async function fetchLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(getServerUrl(`/leaderboard?limit=${limit}`), {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error fetching leaderboard:', error);
      throw new Error(error.error || 'Failed to fetch leaderboard');
    }
    
    const result = await response.json();
    return result.leaderboard;
  } catch (error) {
    console.error('Error in fetchLeaderboard:', error);
    throw error;
  }
}

export async function deletePlayerData(walletAddress: string): Promise<void> {
  try {
    const response = await fetch(getServerUrl(`/player/${walletAddress}`), {
      method: 'DELETE',
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error deleting player data:', error);
      throw new Error(error.error || 'Failed to delete player data');
    }
  } catch (error) {
    console.error('Error in deletePlayerData:', error);
    throw error;
  }
}

export interface MintTokensResult {
  success: boolean;
  signature?: string;
  mintAddress?: string;
  amount?: number;
  explorerUrl?: string;
  error?: string;
}

export async function mintTokens(
  walletAddress: string,
  amount: number,
  gameId: string
): Promise<MintTokensResult> {
  try {
    const response = await fetch(getServerUrl('/mint-tokens'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        walletAddress,
        amount,
        gameScore: amount,
        gameId
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Error minting tokens:', result);
      throw new Error(result.error || 'Failed to mint tokens');
    }
    
    return result;
  } catch (error) {
    console.error('Error in mintTokens:', error);
    throw error;
  }
}

export async function resetPlayerScore(
  walletAddress: string,
  claimedAmount: number
): Promise<PlayerData> {
  try {
    const response = await fetch(getServerUrl('/reset-score'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        walletAddress,
        claimedAmount
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error resetting score:', error);
      throw new Error(error.error || 'Failed to reset score');
    }
    
    const result = await response.json();
    return result.player;
  } catch (error) {
    console.error('Error in resetPlayerScore:', error);
    throw error;
  }
}