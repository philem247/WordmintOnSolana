import { useState, useEffect } from 'react';
import { DifficultyMode, getWMINTForDifficulty } from './utils/word-lists';
import { clearWalletSession } from './utils/mobile-wallet-redirect';
import { 
  fetchPlayerData, 
  createOrUpdatePlayer, 
  updatePlayerStats,
  mintTokens,
  resetPlayerScore 
} from './utils/api';
import { LandingPage } from './components/landing-page';
import { PlayerDashboard } from './components/player-dashboard';
import { DifficultySelector } from './components/difficulty-selector';
import { GameScreen } from './components/game-screen';
import { ResultScreen } from './components/result-screen';
import { RewardsScreen } from './components/rewards-screen';
import { TokenRewardScreen } from './components/token-reward-screen';
import { AchievementsScreen } from './components/achievements-screen';
import { Toast } from './components/toast';

export type GameState = 'landing' | 'dashboard' | 'difficulty-select' | 'playing' | 'result' | 'rewards' | 'token-claim' | 'achievements';

export interface PlayerData {
  walletAddress: string;
  score: number; // Accumulated WMINT pending claim
  totalWmintEarned: number; // Total WMINT earned all-time (for leaderboard)
  level: number;
  streak: number;
  gamesPlayed: number;
}

export interface ToastData {
  message: string;
  type: 'success' | 'error' | 'info';
}

function App() {
  const [gameState, setGameState] = useState<GameState>('landing');
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyMode>('normal');
  const [currentWord, setCurrentWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [wmintEarned, setWmintEarned] = useState(0);
  const [txSignature, setTxSignature] = useState<string | null>(null); // Blockchain transaction signature
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [round, setRound] = useState(1);
  const [showResult, setShowResult] = useState(false);
  const [gameId, setGameId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMintingTokens, setIsMintingTokens] = useState(false); // Minting in progress
  const [toast, setToast] = useState<ToastData | null>(null);

  const maxRounds = 5;

  // Load player data from Supabase on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('wordmint_wallet');
    if (savedWallet) {
      loadPlayerData(savedWallet);
    }
  }, []);

  const loadPlayerData = async (walletAddress: string) => {
    setIsLoading(true);
    try {
      const data = await fetchPlayerData(walletAddress);
      if (data) {
        setPlayerData(data);
        setGameState('dashboard');
      } else {
        // Create new player
        const newPlayer: PlayerData = {
          walletAddress,
          score: 0,
          totalWmintEarned: 0,
          level: 1,
          streak: 0,
          gamesPlayed: 0
        };
        const createdPlayer = await createOrUpdatePlayer(newPlayer);
        setPlayerData(createdPlayer);
        setGameState('dashboard');
      }
    } catch (error) {
      console.error('Failed to load player data:', error);
      showToast('Failed to load player data', 'error');
      localStorage.removeItem('wordmint_wallet');
      // Reset to landing page on error
      setGameState('landing');
      setPlayerData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletConnect = async (walletAddress: string) => {
    setIsLoading(true);
    try {
      /**
       * DEVELOPER NOTE: Real wallet integration
       * 
       * At this point, walletAddress is the user's actual Solana public key
       * from their connected wallet (Phantom, Solflare, etc.)
       * 
       * This is NOT a mock - it's the real address that can:
       * - Sign transactions
       * - Hold SOL and tokens
       * - Interact with Solana programs
       * 
       * Use this address to:
       * 1. Fetch player data from backend
       * 2. Associate game progress with this wallet
       * 3. Send on-chain rewards to this address
       */
      
      // Save wallet to localStorage for session persistence
      localStorage.setItem('wordmint_wallet', walletAddress);
      
      // Check if player exists in database
      const existingPlayer = await fetchPlayerData(walletAddress);
      
      if (existingPlayer) {
        setPlayerData(existingPlayer);
        showToast('Welcome back! Wallet connected successfully.', 'success');
      } else {
        // Create new player in database
        const newPlayer: PlayerData = {
          walletAddress,
          score: 0,
          totalWmintEarned: 0,
          level: 1,
          streak: 0,
          gamesPlayed: 0
        };
        
        const createdPlayer = await createOrUpdatePlayer(newPlayer);
        setPlayerData(createdPlayer);
        showToast('Wallet connected successfully!', 'success');
      }
      
      setGameState('dashboard');
    } catch (error) {
      console.error('Failed to load player data after wallet connection:', error);
      showToast('Failed to load player data', 'error');
      localStorage.removeItem('wordmint_wallet');
      // Reset to landing page on error
      setGameState('landing');
      setPlayerData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = () => {
    // Generate a unique game ID for this session
    setGameId(`game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
    setGameState('difficulty-select');
  };

  const handleDifficultySelect = (difficulty: DifficultyMode) => {
    setSelectedDifficulty(difficulty);
    setGameState('playing');
  };

  const handleSubmitAnswer = async (answer: string, word: string, difficulty: DifficultyMode) => {
    if (!playerData) return;
    
    const correct = answer.toLowerCase() === word.toLowerCase();
    setFeedback(correct ? 'correct' : 'incorrect');
    setCurrentWord(word);
    
    setIsLoading(true);
    setTxSignature(null); // Reset transaction signature
    
    try {
      if (correct) {
        // Calculate WMINT tokens earned (saved to database, not minted yet)
        const baseWMINT = getWMINTForDifficulty(difficulty) * 10;
        const streakBonus = Math.floor(playerData.streak / 5) * 10;
        const levelBonus = Math.floor(playerData.level / 10) * 10;
        const totalWMINT = baseWMINT + streakBonus + levelBonus;
        
        setWmintEarned(totalWMINT);
        
        // Update stats in database (tokens accumulated but not yet minted)
        const updatedPlayer = await updatePlayerStats(playerData.walletAddress, totalWMINT, true);
        setPlayerData(updatedPlayer);
      } else {
        setWmintEarned(0);
        
        // Update stats in database (failed attempt)
        const updatedPlayer = await updatePlayerStats(playerData.walletAddress, 0, false);
        setPlayerData(updatedPlayer);
      }
      
      setGameState('result');
    } catch (error) {
      console.error('Failed to update player stats:', error);
      showToast('Failed to save game results', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    // Tokens accumulated in database - go to dashboard to claim
    setGameState('dashboard');
  };
  
  const handleClaimRewards = async () => {
    if (!playerData || playerData.score <= 0) {
      showToast('No rewards to claim', 'info');
      return;
    }
    
    setIsMintingTokens(true);
    setTxSignature(null);
    
    try {
      // Mint accumulated WMINT tokens to player's wallet
      const mintResult = await mintTokens(
        playerData.walletAddress,
        playerData.score,
        `claim_${Date.now()}`
      );
      
      if (mintResult.signature) {
        setTxSignature(mintResult.signature);
        setWmintEarned(playerData.score); // Store claimed amount for the reward screen
        
        // Store transaction data globally for reward screen
        (window as any).__wordmint_last_tx__ = mintResult.signature;
        (window as any).__wordmint_mint_address__ = mintResult.mintAddress;
        
        // Reset player score after successful claim
        const updatedPlayer = await resetPlayerScore(
          playerData.walletAddress,
          playerData.score
        );
        setPlayerData(updatedPlayer);
        
        showToast(`Successfully claimed ${playerData.score} WMINT!`, 'success');
        console.log(`✅ Minted ${playerData.score} WMINT to player wallet!`);
        console.log(`Transaction: https://explorer.solana.com/tx/${mintResult.signature}?cluster=devnet`);
        
        // Show rewards screen with transaction details
        setGameState('token-claim');
      } else {
        console.error('Failed to mint tokens:', mintResult.error);
        showToast(`Failed to claim tokens: ${mintResult.error}`, 'error');
      }
    } catch (error) {
      console.error('Claim error:', error);
      showToast('Failed to claim tokens', 'error');
    } finally {
      setIsMintingTokens(false);
    }
  };

  const handlePlayAgain = () => {
    setGameState('playing');
  };

  const handleBackToDashboard = () => {
    setGameState('dashboard');
  };

  const handleDisconnect = () => {
    // Clear all player data and state
    setPlayerData(null);
    setGameState('landing');
    
    // Clear localStorage AND wallet session
    localStorage.removeItem('wordmint_wallet');
    localStorage.setItem('wordmint_intentional_disconnect', 'true');
    clearWalletSession(); // Clear the mobile wallet session
    
    showToast('Wallet disconnected successfully', 'success');
  };

  const showToast = (message: string, type: ToastData['type']) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Loading...</p>
          </div>
        </div>
      )}
      
      {gameState === 'landing' && (
        <LandingPage onConnect={handleWalletConnect} />
      )}
      
      {gameState === 'dashboard' && playerData && (
        <PlayerDashboard 
          playerData={playerData}
          onStartGame={handleStartGame}
          onDisconnect={handleDisconnect}
          onViewAchievements={() => setGameState('achievements')}
          onClaimRewards={handleClaimRewards}
          isClaiming={isMintingTokens}
        />
      )}

      {gameState === 'difficulty-select' && (
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
          <div className="max-w-4xl w-full">
            <div className="p-8 rounded-3xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm">
              <DifficultySelector
                selectedDifficulty={selectedDifficulty}
                onSelect={handleDifficultySelect}
              />
              <button
                onClick={handleBackToDashboard}
                className="mt-6 w-full py-3 rounded-xl bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
      
      {gameState === 'playing' && (
        <GameScreen 
          onSubmit={handleSubmitAnswer}
          onBack={handleBackToDashboard}
          level={playerData!.level}
          difficulty={selectedDifficulty}
        />
      )}
      
      {gameState === 'result' && (
        <ResultScreen 
          isCorrect={feedback === 'correct'}
          word={currentWord}
          pointsEarned={wmintEarned}
          txSignature={txSignature}
          onContinue={handleContinue}
        />
      )}
      
      {gameState === 'rewards' && playerData && (
        <RewardsScreen 
          pointsEarned={wmintEarned}
          totalScore={playerData.score}
          level={playerData.level}
          streak={playerData.streak}
          onPlayAgain={handlePlayAgain}
          onBackToDashboard={handleBackToDashboard}
          onClaimTokens={() => setGameState('token-claim')}
        />
      )}

      {gameState === 'token-claim' && playerData && (
        <TokenRewardScreen 
          walletAddress={playerData.walletAddress}
          gameScore={wmintEarned}
          streak={playerData.streak}
          level={playerData.level}
          gameId={gameId}
          onComplete={() => {
            // Refresh player data to show updated token balance
            loadPlayerData(playerData.walletAddress);
            setGameState('dashboard');
          }}
          onBack={handleBackToDashboard}
        />
      )}

      {gameState === 'achievements' && playerData && (
        <AchievementsScreen 
          playerData={playerData}
          onBack={handleBackToDashboard}
        />
      )}

      {toast && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;