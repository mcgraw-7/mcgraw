'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';

type GamePhase = 'menu' | 'connecting' | 'waiting' | 'drawing' | 'guessing' | 'roundEnd' | 'gameEnd';
type PlayerRole = 'drawer' | 'guesser';

interface DrawPoint {
  x: number;
  y: number;
  color: string;
  size: number;
  isStart: boolean;
}

interface GameMessage {
  type: 'draw' | 'clear' | 'guess' | 'correct' | 'newRound' | 'gameState' | 'chat' | 'timeUp' | 'skipWord';
  data?: DrawPoint | string | GameState;
}

interface GameState {
  currentWord: string;
  drawerScore: number;
  guesserScore: number;
  round: number;
  totalRounds: number;
  timeLeft: number;
  isDrawer: boolean;
}

// Christmas-themed words for Pictionary
const CHRISTMAS_WORDS = [
  // Easy
  'snowman', 'tree', 'star', 'bell', 'candy cane', 'gift', 'stocking', 'santa', 
  'reindeer', 'snowflake', 'ornament', 'wreath', 'sleigh', 'elf', 'angel',
  'candle', 'mittens', 'scarf', 'hot cocoa', 'cookies', 'fireplace', 'chimney',
  // Medium
  'gingerbread house', 'christmas lights', 'snow globe', 'nutcracker', 'ice skating',
  'carolers', 'mistletoe', 'candy', 'present', 'bow', 'ribbon', 'tinsel',
  'snowball fight', 'north pole', 'toy workshop', 'christmas card',
  // Fun/Silly
  'rudolph', 'frosty', 'grinch', 'polar bear', 'penguin', 'igloo', 
  'hot chocolate', 'christmas sweater', 'snow angel', 'jack frost'
];

const COLORS = [
  '#FF0000', // Red
  '#00AA00', // Green
  '#0066FF', // Blue
  '#FFD700', // Gold
  '#FF69B4', // Pink
  '#8B4513', // Brown
  '#FFFFFF', // White
  '#000000', // Black
  '#FF8C00', // Orange
  '#9400D3', // Purple
];

const BRUSH_SIZES = [4, 8, 16, 24];

export default function ChristmasPictionary() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [playerRole, setPlayerRole] = useState<PlayerRole>('drawer');
  const [currentWord, setCurrentWord] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [messages, setMessages] = useState<{text: string, isCorrect?: boolean, isSystem?: boolean}[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(8);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{x: number, y: number} | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const TOTAL_ROUNDS = 6; // Each player draws 3 times

  // Generate a fun Christmas room code
  const generateRoomCode = () => {
    const prefixes = ['SNOW', 'JINGLE', 'HOLLY', 'CANDY', 'FROST', 'MERRY'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}${num}`;
  };

  // Get a random word that hasn't been used
  const getNewWord = useCallback(() => {
    const availableWords = CHRISTMAS_WORDS.filter(w => !usedWords.has(w));
    if (availableWords.length === 0) {
      setUsedWords(new Set());
      return CHRISTMAS_WORDS[Math.floor(Math.random() * CHRISTMAS_WORDS.length)];
    }
    const word = availableWords[Math.floor(Math.random() * availableWords.length)];
    setUsedWords(prev => new Set([...prev, word]));
    return word;
  }, [usedWords]);

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctxRef.current = ctx;
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [gamePhase]);

  // Timer effect
  useEffect(() => {
    if ((gamePhase === 'drawing' || gamePhase === 'guessing') && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && (gamePhase === 'drawing' || gamePhase === 'guessing')) {
      // Time's up!
      handleTimeUp();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gamePhase]);

  const handleTimeUp = () => {
    if (connRef.current) {
      connRef.current.send({ type: 'timeUp', data: currentWord });
    }
    setMessages(prev => [...prev, { text: `⏰ Time's up! The word was: ${currentWord}`, isSystem: true }]);
    setGamePhase('roundEnd');
    setTimeout(() => startNextRound(), 3000);
  };

  // Send drawing data
  const sendDrawData = (point: DrawPoint) => {
    if (connRef.current && playerRole === 'drawer') {
      connRef.current.send({ type: 'draw', data: point });
    }
  };

  // Clear canvas
  const clearCanvas = () => {
    if (ctxRef.current && canvasRef.current) {
      ctxRef.current.fillStyle = '#FFFFFF';
      ctxRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    if (connRef.current && playerRole === 'drawer') {
      connRef.current.send({ type: 'clear' });
    }
  };

  // Draw on canvas
  const drawOnCanvas = (point: DrawPoint) => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;
    
    ctx.strokeStyle = point.color;
    ctx.lineWidth = point.size;
    
    if (point.isStart) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    } else {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  };

  // Get position from touch/mouse event
  const getPosition = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  // Drawing handlers
  const handleDrawStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (playerRole !== 'drawer' || gamePhase !== 'drawing') return;
    e.preventDefault();
    
    isDrawingRef.current = true;
    const pos = getPosition(e);
    lastPointRef.current = pos;
    
    const point: DrawPoint = { ...pos, color: selectedColor, size: brushSize, isStart: true };
    if (ctxRef.current) {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(pos.x, pos.y);
    }
    drawOnCanvas(point);
    sendDrawData(point);
  };

  const handleDrawMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawingRef.current || playerRole !== 'drawer' || gamePhase !== 'drawing') return;
    e.preventDefault();
    
    const pos = getPosition(e);
    const point: DrawPoint = { ...pos, color: selectedColor, size: brushSize, isStart: false };
    drawOnCanvas(point);
    sendDrawData(point);
    lastPointRef.current = pos;
  };

  const handleDrawEnd = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  // Submit guess
  const submitGuess = () => {
    if (!guessInput.trim() || playerRole !== 'guesser') return;
    
    const guess = guessInput.trim().toLowerCase();
    const correct = guess === currentWord.toLowerCase();
    
    setMessages(prev => [...prev, { text: `You guessed: ${guessInput}`, isCorrect: correct }]);
    
    if (connRef.current) {
      connRef.current.send({ type: 'guess', data: guessInput });
    }
    
    if (correct) {
      // Guesser gets points based on time left
      const points = Math.max(10, Math.floor(timeLeft * 1.5));
      setMyScore(prev => prev + points);
      
      if (connRef.current) {
        connRef.current.send({ type: 'correct', data: points.toString() });
      }
      
      setMessages(prev => [...prev, { text: `🎉 Correct! +${points} points!`, isSystem: true }]);
      setGamePhase('roundEnd');
      setTimeout(() => startNextRound(), 2000);
    }
    
    setGuessInput('');
  };

  // Start next round
  const startNextRound = () => {
    if (round >= TOTAL_ROUNDS) {
      setGamePhase('gameEnd');
      return;
    }
    
    const newRound = round + 1;
    setRound(newRound);
    setTimeLeft(60);
    
    // Swap roles
    const newRole = playerRole === 'drawer' ? 'guesser' : 'drawer';
    setPlayerRole(newRole);
    
    // Clear canvas
    if (ctxRef.current && canvasRef.current) {
      ctxRef.current.fillStyle = '#FFFFFF';
      ctxRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    
    if (newRole === 'drawer') {
      const word = getNewWord();
      setCurrentWord(word);
      if (connRef.current) {
        connRef.current.send({ 
          type: 'newRound', 
          data: { round: newRound, wordLength: word.length, isDrawer: false } 
        });
      }
      setGamePhase('drawing');
    } else {
      setCurrentWord('');
      setGamePhase('guessing');
    }
    
    setMessages([]);
  };

  // Skip word (drawer only)
  const skipWord = () => {
    if (playerRole !== 'drawer') return;
    const newWord = getNewWord();
    setCurrentWord(newWord);
    clearCanvas();
    if (connRef.current) {
      connRef.current.send({ type: 'skipWord', data: newWord.length.toString() });
    }
    setMessages(prev => [...prev, { text: '⏭️ Word skipped!', isSystem: true }]);
  };

  // Handle incoming messages
  const handleMessage = useCallback((msg: GameMessage) => {
    switch (msg.type) {
      case 'draw':
        if (msg.data && typeof msg.data === 'object' && 'x' in msg.data) {
          drawOnCanvas(msg.data as DrawPoint);
        }
        break;
      case 'clear':
        if (ctxRef.current && canvasRef.current) {
          ctxRef.current.fillStyle = '#FFFFFF';
          ctxRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        break;
      case 'guess':
        setMessages(prev => [...prev, { text: `Opponent guessed: ${msg.data}` }]);
        break;
      case 'correct':
        const drawerPoints = Math.floor(parseInt(msg.data as string) * 0.5);
        setMyScore(prev => prev + drawerPoints);
        setOpponentScore(prev => prev + parseInt(msg.data as string));
        setMessages(prev => [...prev, { text: `🎉 They got it! You earned ${drawerPoints} points for drawing!`, isSystem: true }]);
        setGamePhase('roundEnd');
        setTimeout(() => startNextRound(), 2000);
        break;
      case 'newRound':
        const state = msg.data as { round: number, wordLength: number, isDrawer: boolean };
        setRound(state.round);
        setTimeLeft(60);
        setPlayerRole(state.isDrawer ? 'drawer' : 'guesser');
        if (!state.isDrawer) {
          setCurrentWord('_'.repeat(state.wordLength));
        }
        setGamePhase(state.isDrawer ? 'drawing' : 'guessing');
        setMessages([]);
        if (ctxRef.current && canvasRef.current) {
          ctxRef.current.fillStyle = '#FFFFFF';
          ctxRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        break;
      case 'timeUp':
        setMessages(prev => [...prev, { text: `⏰ Time's up! The word was: ${msg.data}`, isSystem: true }]);
        setGamePhase('roundEnd');
        setTimeout(() => startNextRound(), 3000);
        break;
      case 'skipWord':
        setCurrentWord('_'.repeat(parseInt(msg.data as string)));
        if (ctxRef.current && canvasRef.current) {
          ctxRef.current.fillStyle = '#FFFFFF';
          ctxRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        setMessages(prev => [...prev, { text: '⏭️ New word!', isSystem: true }]);
        break;
      case 'gameState':
        const gs = msg.data as GameState;
        setOpponentScore(gs.drawerScore);
        break;
    }
  }, []);

  // Create game (host)
  const createGame = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    setIsHost(true);
    setGamePhase('connecting');
    
    const peer = new Peer(`xmas-pictionary-${code}`, {
      debug: 2,
    });
    peerRef.current = peer;
    
    peer.on('open', () => {
      setGamePhase('waiting');
    });
    
    peer.on('connection', (conn) => {
      connRef.current = conn;
      
      conn.on('open', () => {
        // Host starts as drawer
        const word = getNewWord();
        setCurrentWord(word);
        setPlayerRole('drawer');
        setGamePhase('drawing');
        
        conn.send({ 
          type: 'newRound', 
          data: { round: 1, wordLength: word.length, isDrawer: false } 
        });
      });
      
      conn.on('data', (data) => handleMessage(data as GameMessage));
      
      conn.on('close', () => {
        setGamePhase('menu');
        setMessages([{ text: 'Opponent disconnected', isSystem: true }]);
      });
    });
    
    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setGamePhase('menu');
    });
  };

  // Join game
  const joinGame = () => {
    if (!inputCode.trim()) return;
    
    const code = inputCode.trim().toUpperCase();
    setRoomCode(code);
    setIsHost(false);
    setGamePhase('connecting');
    
    const peer = new Peer({
      debug: 2,
    });
    peerRef.current = peer;
    
    peer.on('open', () => {
      const conn = peer.connect(`xmas-pictionary-${code}`, { reliable: true });
      connRef.current = conn;
      
      conn.on('open', () => {
        setPlayerRole('guesser');
        setGamePhase('guessing');
      });
      
      conn.on('data', (data) => handleMessage(data as GameMessage));
      
      conn.on('close', () => {
        setGamePhase('menu');
        setMessages([{ text: 'Disconnected from game', isSystem: true }]);
      });
    });
    
    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setGamePhase('menu');
    });
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (connRef.current) connRef.current.close();
      if (peerRef.current) peerRef.current.destroy();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Reset game
  const resetGame = () => {
    if (connRef.current) connRef.current.close();
    if (peerRef.current) peerRef.current.destroy();
    setGamePhase('menu');
    setMyScore(0);
    setOpponentScore(0);
    setRound(1);
    setUsedWords(new Set());
    setMessages([]);
  };

  // Render word hint for guesser
  const renderWordHint = () => {
    if (playerRole === 'drawer') {
      return <span className="text-2xl font-bold text-yellow-300">{currentWord.toUpperCase()}</span>;
    }
    // Show underscores with spaces for multi-word
    const hint = currentWord.split('').map((c, i) => 
      c === ' ' ? '  ' : '_ '
    ).join('');
    return <span className="text-2xl font-mono tracking-widest">{hint}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 text-white p-4">
      {/* Decorative snowflakes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-white/20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 20 + 10}px`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            ❄️
          </div>
        ))}
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold mb-1">
            🎨 Christmas Pictionary ✏️
          </h1>
          {gamePhase !== 'menu' && (
            <div className="flex justify-center gap-6 text-sm">
              <span>Round {round}/{TOTAL_ROUNDS}</span>
              <span className="text-green-400">You: {myScore}</span>
              <span className="text-pink-400">Them: {opponentScore}</span>
            </div>
          )}
        </div>

        {/* Menu */}
        {gamePhase === 'menu' && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
            <div className="text-6xl mb-4">🎄✏️🎅</div>
            <p className="text-lg mb-6 text-gray-200">
              Draw and guess Christmas things with your sister!
            </p>
            
            <button
              onClick={createGame}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 px-6 rounded-xl mb-4 text-xl shadow-lg transform hover:scale-105 transition-all"
            >
              🎨 Create Game
            </button>
            
            <div className="text-gray-400 my-4">— or join a game —</div>
            
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Enter room code..."
              className="w-full bg-white/20 border-2 border-white/30 rounded-xl px-4 py-3 text-center text-xl uppercase tracking-widest mb-4 placeholder-gray-400"
              maxLength={10}
            />
            
            <button
              onClick={joinGame}
              disabled={!inputCode.trim()}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl text-xl shadow-lg transform hover:scale-105 transition-all"
            >
              🖌️ Join Game
            </button>
          </div>
        )}

        {/* Connecting */}
        {gamePhase === 'connecting' && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4 animate-bounce">🔗</div>
            <p className="text-xl">Connecting...</p>
          </div>
        )}

        {/* Waiting for player */}
        {gamePhase === 'waiting' && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
            <div className="text-5xl mb-4 animate-pulse">⏳</div>
            <p className="text-xl mb-4">Waiting for your sister to join...</p>
            <div className="bg-black/30 rounded-xl p-4 mb-4">
              <p className="text-gray-400 text-sm mb-2">Share this code:</p>
              <p className="text-4xl font-bold tracking-widest text-yellow-300">{roomCode}</p>
            </div>
            <p className="text-sm text-gray-400">They enter this code on their tablet</p>
          </div>
        )}

        {/* Game Phase */}
        {(gamePhase === 'drawing' || gamePhase === 'guessing' || gamePhase === 'roundEnd') && (
          <div className="space-y-4">
            {/* Timer and Word */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 flex items-center justify-between">
              <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                ⏱️ {timeLeft}s
              </div>
              <div className="text-center flex-1">
                {playerRole === 'drawer' ? (
                  <div>
                    <span className="text-sm text-gray-400">Draw: </span>
                    {renderWordHint()}
                  </div>
                ) : (
                  <div>
                    <span className="text-sm text-gray-400">Guess: </span>
                    {renderWordHint()}
                  </div>
                )}
              </div>
              <div className="text-sm">
                {playerRole === 'drawer' ? '🎨 Drawing' : '🤔 Guessing'}
              </div>
            </div>

            {/* Canvas */}
            <div className="bg-white rounded-xl p-2 shadow-lg">
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className="w-full touch-none rounded-lg"
                style={{ 
                  aspectRatio: '3/2',
                  cursor: playerRole === 'drawer' && gamePhase === 'drawing' ? 'crosshair' : 'default'
                }}
                onMouseDown={handleDrawStart}
                onMouseMove={handleDrawMove}
                onMouseUp={handleDrawEnd}
                onMouseLeave={handleDrawEnd}
                onTouchStart={handleDrawStart}
                onTouchMove={handleDrawMove}
                onTouchEnd={handleDrawEnd}
              />
            </div>

            {/* Drawing Tools (drawer only) */}
            {playerRole === 'drawer' && gamePhase === 'drawing' && (
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 space-y-3">
                {/* Colors */}
                <div className="flex flex-wrap justify-center gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        selectedColor === color ? 'border-yellow-400 scale-125' : 'border-white/50'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                {/* Brush sizes */}
                <div className="flex justify-center gap-3">
                  {BRUSH_SIZES.map(size => (
                    <button
                      key={size}
                      onClick={() => setBrushSize(size)}
                      className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center transition-all ${
                        brushSize === size ? 'ring-2 ring-yellow-400 bg-white/40' : ''
                      }`}
                    >
                      <div 
                        className="rounded-full bg-current"
                        style={{ width: size, height: size, color: selectedColor }}
                      />
                    </button>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex justify-center gap-3">
                  <button
                    onClick={clearCanvas}
                    className="bg-red-500/80 hover:bg-red-500 px-4 py-2 rounded-lg font-bold"
                  >
                    🗑️ Clear
                  </button>
                  <button
                    onClick={skipWord}
                    className="bg-yellow-500/80 hover:bg-yellow-500 px-4 py-2 rounded-lg font-bold text-black"
                  >
                    ⏭️ Skip Word
                  </button>
                </div>
              </div>
            )}

            {/* Guess input (guesser only) */}
            {playerRole === 'guesser' && gamePhase === 'guessing' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
                  placeholder="Type your guess..."
                  className="flex-1 bg-white/20 border-2 border-white/30 rounded-xl px-4 py-3 text-lg"
                  autoFocus
                />
                <button
                  onClick={submitGuess}
                  className="bg-green-500 hover:bg-green-400 px-6 py-3 rounded-xl font-bold text-lg"
                >
                  Guess!
                </button>
              </div>
            )}

            {/* Messages */}
            {messages.length > 0 && (
              <div className="bg-black/30 rounded-xl p-3 max-h-32 overflow-y-auto">
                {messages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`text-sm py-1 ${
                      msg.isSystem ? 'text-yellow-300 font-bold' : 
                      msg.isCorrect ? 'text-green-400' : 
                      msg.isCorrect === false ? 'text-red-400' : 
                      'text-gray-300'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Game End */}
        {gamePhase === 'gameEnd' && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
            <div className="text-6xl mb-4">
              {myScore > opponentScore ? '🏆' : myScore < opponentScore ? '🎉' : '🤝'}
            </div>
            <h2 className="text-3xl font-bold mb-4">
              {myScore > opponentScore ? 'You Win!' : myScore < opponentScore ? 'They Win!' : 'It\'s a Tie!'}
            </h2>
            <div className="text-xl mb-6">
              <p className="text-green-400">Your Score: {myScore}</p>
              <p className="text-pink-400">Their Score: {opponentScore}</p>
            </div>
            <button
              onClick={resetGame}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 px-8 rounded-xl text-lg shadow-lg"
            >
              🎨 Play Again
            </button>
          </div>
        )}

        {/* Back button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.href = '/christmas-adventure'}
            className="text-white/60 hover:text-white text-sm"
          >
            ← Back to Games
          </button>
        </div>
      </div>
    </div>
  );
}
