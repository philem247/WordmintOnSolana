import { useState, useEffect, useRef } from 'react';
import { Volume2, ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DifficultyMode, getRandomWord, getDifficultyColor, getDifficultyName } from '../utils/word-lists';
import { isPhantomMobileApp, isSolflareMobileApp } from '../utils/mobile-wallet-adapter';

interface GameScreenProps {
  onSubmit: (answer: string, word: string, difficulty: DifficultyMode) => void;
  onBack: () => void;
  level: number;
  difficulty: DifficultyMode;
}

export function GameScreen({ onSubmit, onBack, level, difficulty }: GameScreenProps) {
  const [currentWord, setCurrentWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasSubmittedRef = useRef(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    // Select random word based on difficulty
    const randomWord = getRandomWord(difficulty);
    setCurrentWord(randomWord);
    setIsPlaying(true);
    hasSubmittedRef.current = false;
    setAudioError(null);
  }, [difficulty]);

  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) {
      if (timeLeft === 0 && !hasSubmittedRef.current) {
        // Timer expired - submit with current answer (even if empty)
        hasSubmittedRef.current = true;
        onSubmit(userInput, currentWord, difficulty);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isPlaying, userInput, currentWord, difficulty, onSubmit]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (hasSubmittedRef.current) {
      return; // Prevent double submission
    }
    hasSubmittedRef.current = true;
    // Allow submission even with empty input (will be marked as incorrect)
    onSubmit(userInput, currentWord, difficulty);
  };

  const handlePlayAudio = () => {
    setAudioError(null);
    
    // Check if Speech Synthesis is supported
    if (!('speechSynthesis' in window)) {
      setAudioError('Audio not supported in this browser');
      return;
    }
    
    try {
      // Cancel any ongoing speech first
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(currentWord);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.lang = 'en-US';
      utterance.volume = 1;
      
      // Track if audio has started
      let hasStarted = false;
      
      // Event handlers
      utterance.onstart = () => {
        console.log('Audio started playing:', currentWord);
        hasStarted = true;
        setIsPlayingAudio(true);
        setAudioError(null);
      };
      
      utterance.onend = () => {
        console.log('Audio finished playing');
        setIsPlayingAudio(false);
      };
      
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('Speech synthesis error:', event.error, event);
        setIsPlayingAudio(false);
        
        // Handle specific error types
        const errorType = event.error;
        
        // Don't show error for interrupted/cancelled events
        if (errorType === 'interrupted' || errorType === 'canceled') {
          console.log('Speech interrupted or canceled, ignoring');
          return;
        }
        
        // Show user-friendly error messages
        if (errorType === 'not-allowed' || errorType === 'audio-busy') {
          setAudioError('Please tap the button to enable audio');
        } else if (errorType === 'network') {
          setAudioError('Network error. Check your connection.');
        } else if (errorType === 'synthesis-failed') {
          setAudioError('Audio failed. Try tapping again.');
        } else {
          // Generic error
          setAudioError('Audio unavailable. Try again.');
        }
      };
      
      // For mobile browsers (especially iOS), we need to ensure
      // the speech synthesis queue is ready
      if (window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
      
      // Wait a tiny bit for voices to load on some browsers
      setTimeout(() => {
        // Check if voices are available
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Prefer a US English voice
          const usVoice = voices.find(voice => voice.lang === 'en-US') || voices[0];
          utterance.voice = usVoice;
        }
        
        // Speak immediately for better mobile support
        window.speechSynthesis.speak(utterance);
        console.log('Speech synthesis started');
        
        // Fallback: If speech doesn't start within 500ms, show manual option
        const fallbackTimer = setTimeout(() => {
          if (!hasStarted) {
            console.log('Audio did not start, may need user interaction');
            // Don't set error - just let user try again
            setIsPlayingAudio(false);
          }
        }, 500);
        
        // Clear fallback timer when utterance starts or ends
        utterance.onstart = () => {
          clearTimeout(fallbackTimer);
          hasStarted = true;
          setIsPlayingAudio(true);
          setAudioError(null);
        };
        
        utterance.onend = () => {
          clearTimeout(fallbackTimer);
          setIsPlayingAudio(false);
        };
      }, 50);
      
    } catch (error) {
      console.error('Error playing audio:', error);
      setAudioError('Audio system error. Try refreshing.');
      setIsPlayingAudio(false);
    }
  };

  const progressPercentage = (timeLeft / 30) * 100;
  const difficultyColors = getDifficultyColor(difficulty);
  const difficultyLabel = getDifficultyName(difficulty);

  return (
    <div className="min-h-screen flex flex-col px-4 py-8">
      {/* Header */}
      <div className="max-w-2xl mx-auto w-full mb-8">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* Difficulty Badge */}
          <div className={`px-4 py-2 rounded-lg bg-gradient-to-br ${difficultyColors.bg} border ${difficultyColors.border}`}>
            <span className={`text-sm ${difficultyColors.text}`}>{difficultyLabel}</span>
          </div>

          <div className="px-4 py-2 rounded-lg bg-slate-800/50">
            <span className="text-sm text-slate-400">Level {level}</span>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          {/* Timer Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Time Remaining</span>
              <span className={`tabular-nums ${timeLeft <= 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${timeLeft <= 10 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}
                initial={{ width: '100%' }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Audio Prompt */}
          <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50 text-center">
            <div className="mb-6">
              <p className="text-slate-400 mb-4">Listen and spell the word</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlayAudio}
                className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                  isPlayingAudio 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/50' 
                    : 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/30 hover:shadow-emerald-500/50'
                } text-white shadow-lg transition-all`}
              >
                <Volume2 className={`w-8 h-8 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
              </motion.button>
              
              {/* Audio status feedback */}
              {isPlayingAudio && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-purple-400 mt-2"
                >
                  Playing audio...
                </motion.p>
              )}
              
              {audioError && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-red-400 mt-2"
                >
                  {audioError}
                </motion.p>
              )}
            </div>
            
            {/* Visual hint - show word length */}
            <div className="flex items-center justify-center gap-2">
              {currentWord.split('').map((_, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-full bg-slate-700"
                />
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">{currentWord.length} letters</p>
          </div>

          {/* Input Area */}
          <div className="space-y-4">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Type your answer..."
              autoFocus
              className="w-full px-6 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white text-xl text-center placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={!userInput.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-lg shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span>Submit Answer</span>
            </motion.button>
          </div>

          {/* Hint */}
          <div className="text-center">
            <p className="text-sm text-slate-500">
              Press <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400">Enter</kbd> to submit
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}