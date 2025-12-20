'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports to avoid SSR issues with Three.js
const SnowballSurvival = dynamic(() => import('../app/components/christmas-adventure/SnowballSurvival'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">Loading game...</div>
});

const ChristmasBattleship = dynamic(() => import('../app/components/christmas-adventure/ChristmasBattleship'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">Loading game...</div>
});

const ScavengerHunt = dynamic(() => import('../app/components/christmas-adventure/ScavengerHunt'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">Loading...</div>
});

interface PlayerConfig {
  name: string;
  color: string;
}

interface PlayerScore {
  playerIndex: number;
  round: number;
  score: number;
}

type GameMode = 'menu' | 'snowball' | 'battleship' | 'scavenger' | 'setup' | 'roundsetup' | 'results';

export default function ChristmasAdventure() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [players, setPlayers] = useState<PlayerConfig[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [showSetup, setShowSetup] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerColor, setPlayerColor] = useState('#ff6b6b');
  const [snowParticles, setSnowParticles] = useState<{x: number, y: number, speed: number, size: number}[]>([]);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [pendingGame, setPendingGame] = useState<'snowball' | null>(null);

  // Initialize snow effect
  useEffect(() => {
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: 0.5 + Math.random() * 1,
      size: 2 + Math.random() * 4
    }));
    setSnowParticles(particles);

    // Load saved players
    const saved = localStorage.getItem('christmas-adventure-players');
    if (saved) {
      setPlayers(JSON.parse(saved));
    }
  }, []);

  // Animate snow
  useEffect(() => {
    if (gameMode !== 'menu' && gameMode !== 'roundsetup' && gameMode !== 'results') return;
    
    const interval = setInterval(() => {
      setSnowParticles(prev => prev.map(p => ({
        ...p,
        y: p.y > 100 ? -5 : p.y + p.speed * 0.3,
        x: p.x + Math.sin(p.y * 0.1) * 0.1
      })));
    }, 50);

    return () => clearInterval(interval);
  }, [gameMode]);

  const addPlayer = () => {
    if (!playerName.trim()) return;
    
    const newPlayers = [...players, { name: playerName.trim(), color: playerColor }];
    setPlayers(newPlayers);
    localStorage.setItem('christmas-adventure-players', JSON.stringify(newPlayers));
    setPlayerName('');
    setPlayerColor(`hsl(${Math.random() * 360}, 70%, 50%)`);
  };

  const removePlayer = (index: number) => {
    const newPlayers = players.filter((_, i) => i !== index);
    setPlayers(newPlayers);
    localStorage.setItem('christmas-adventure-players', JSON.stringify(newPlayers));
  };

  const startGame = (game: 'snowball') => {
    if (players.length === 0) {
      setShowSetup(true);
      return;
    }
    setPendingGame(game);
    setGameMode('roundsetup');
  };

  const beginRounds = () => {
    setActivePlayerIndex(0);
    setCurrentRound(1);
    setScores([]);
    setGameMode('snowball');
  };

  const handleGameOver = (score: number) => {
    // Record this player's score for this round
    const newScore: PlayerScore = {
      playerIndex: activePlayerIndex,
      round: currentRound,
      score
    };
    const updatedScores = [...scores, newScore];
    setScores(updatedScores);

    // Determine next player or round
    const nextPlayerIndex = activePlayerIndex + 1;
    
    if (nextPlayerIndex < players.length) {
      // Next player's turn in same round
      setActivePlayerIndex(nextPlayerIndex);
    } else if (currentRound < totalRounds) {
      // All players done this round, start next round
      setCurrentRound(currentRound + 1);
      setActivePlayerIndex(0);
    } else {
      // All rounds complete - show results
      setGameMode('results');
      return;
    }
  };

  const handleBackToMenu = () => {
    // Check if we're mid-game
    if (scores.length > 0 && gameMode !== 'results') {
      const confirmExit = window.confirm('Exit game? Current progress will be lost.');
      if (!confirmExit) return;
    }
    setGameMode('menu');
    setScores([]);
    setCurrentRound(1);
    setActivePlayerIndex(0);
    setPendingGame(null);
  };

  const getPlayerTotalScore = (playerIndex: number) => {
    return scores
      .filter(s => s.playerIndex === playerIndex)
      .reduce((sum, s) => sum + s.score, 0);
  };

  const getWinner = () => {
    if (players.length === 0) return null;
    let maxScore = -1;
    let winnerIndex = 0;
    players.forEach((_, index) => {
      const total = getPlayerTotalScore(index);
      if (total > maxScore) {
        maxScore = total;
        winnerIndex = index;
      }
    });
    return players[winnerIndex];
  };

  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
    '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe'
  ];

  // Game screens with turn tracking
  if (gameMode === 'snowball') {
    return (
      <div className="w-screen h-screen relative">
        {/* Turn indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/70 backdrop-blur-sm rounded-xl px-6 py-2 text-center">
          <div className="text-white font-bold">
            Round {currentRound} of {totalRounds}
          </div>
          <div 
            className="text-lg font-bold px-3 py-1 rounded-full mt-1"
            style={{ backgroundColor: players[activePlayerIndex]?.color }}
          >
            {players[activePlayerIndex]?.name}&apos;s Turn
          </div>
        </div>
        
        <SnowballSurvival 
          player={players[activePlayerIndex]}
          onGameOver={handleGameOver}
          onBack={handleBackToMenu}
        />
      </div>
    );
  }

  if (gameMode === 'battleship') {
    return (
      <div className="w-screen h-screen relative">
        <ChristmasBattleship 
          playerName={players[0]?.name || 'Player'}
          onBack={() => setGameMode('menu')}
        />
      </div>
    );
  }

  if (gameMode === 'scavenger') {
    return (
      <div className="w-screen h-screen overflow-auto">
        <ScavengerHunt 
          players={players}
          onBack={() => setGameMode('menu')}
        />
      </div>
    );
  }

  // Round setup screen
  if (gameMode === 'roundsetup') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-indigo-950 relative overflow-hidden flex items-center justify-center">
        {/* Snow effect */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {snowParticles.map((particle, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white opacity-80"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
              }}
            />
          ))}
        </div>

        <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full mx-4 border-2 border-yellow-500 relative z-10">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🎮</div>
            <h2 className="text-2xl font-bold text-white">Game Setup</h2>
            <p className="text-gray-400 mt-2">
              {pendingGame === 'snowball' ? '❄️ Snowball Survival' : '🧝 Elf Runner'}
            </p>
          </div>

          {/* Players playing */}
          <div className="mb-6">
            <h3 className="text-sm text-gray-400 mb-2">Players:</h3>
            <div className="flex flex-wrap gap-2">
              {players.map((player, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 rounded-full text-sm font-bold"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name}
                </span>
              ))}
            </div>
          </div>

          {/* Round selection */}
          <div className="mb-6">
            <h3 className="text-sm text-gray-400 mb-3">Number of Rounds:</h3>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => setTotalRounds(num)}
                  className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
                    totalRounds === num 
                      ? 'bg-yellow-500 text-black scale-110' 
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-center text-gray-500 text-sm mt-2">
              {players.length} player{players.length !== 1 ? 's' : ''} × {totalRounds} round{totalRounds !== 1 ? 's' : ''} = {players.length * totalRounds} turn{players.length * totalRounds !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Turn order preview */}
          <div className="bg-black/30 rounded-xl p-4 mb-6">
            <h3 className="text-sm text-gray-400 mb-2">Turn Order:</h3>
            <div className="flex flex-wrap gap-1 text-xs">
              {Array.from({ length: totalRounds }, (_, roundIdx) => (
                players.map((player, playerIdx) => (
                  <span 
                    key={`${roundIdx}-${playerIdx}`}
                    className="px-2 py-1 rounded"
                    style={{ backgroundColor: player.color + '80' }}
                  >
                    R{roundIdx + 1}: {player.name}
                  </span>
                ))
              )).flat()}
            </div>
          </div>

          <button
            onClick={beginRounds}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-lg transition-colors mb-3"
          >
            🎬 Start Game!
          </button>
          
          <button
            onClick={() => { setGameMode('menu'); setPendingGame(null); }}
            className="w-full text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Menu
          </button>
        </div>
      </main>
    );
  }

  // Results screen
  if (gameMode === 'results') {
    const winner = getWinner();
    const sortedPlayers = [...players].sort((a, b) => 
      getPlayerTotalScore(players.indexOf(b)) - getPlayerTotalScore(players.indexOf(a))
    );

    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-indigo-950 relative overflow-hidden flex items-center justify-center">
        {/* Snow effect */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {snowParticles.map((particle, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white opacity-80"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
              }}
            />
          ))}
        </div>

        <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-8 max-w-lg w-full mx-4 border-2 border-yellow-500 relative z-10">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="text-3xl font-bold text-white">Game Complete!</h2>
            <p className="text-yellow-400 mt-2">{totalRounds} Round{totalRounds !== 1 ? 's' : ''} Finished</p>
          </div>

          {/* Winner announcement */}
          {winner && players.length > 1 && (
            <div className="text-center mb-6 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-xl p-4">
              <div className="text-2xl font-bold text-black">
                🎉 {winner.name} Wins! 🎉
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="space-y-3 mb-6">
            {sortedPlayers.map((player, rank) => {
              const playerIndex = players.indexOf(player);
              const totalScore = getPlayerTotalScore(playerIndex);
              const playerScores = scores.filter(s => s.playerIndex === playerIndex);
              
              return (
                <div 
                  key={playerIndex}
                  className={`rounded-xl p-4 ${rank === 0 ? 'bg-yellow-500/20 border-2 border-yellow-500' : 'bg-black/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
                      </span>
                      <span 
                        className="px-3 py-1 rounded-full font-bold"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.name}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-white">{totalScore}</span>
                  </div>
                  <div className="mt-2 flex gap-2 text-xs text-gray-400">
                    {playerScores.map((s, i) => (
                      <span key={i} className="bg-black/30 px-2 py-1 rounded">
                        R{s.round}: {s.score}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => { 
              setScores([]);
              setCurrentRound(1);
              setActivePlayerIndex(0);
              setGameMode('roundsetup');
            }}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-lg transition-colors mb-3"
          >
            🔄 Play Again
          </button>
          
          <button
            onClick={() => setGameMode('menu')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl text-lg transition-colors"
          >
            ← Back to Menu
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-indigo-950 relative overflow-hidden">
      {/* Animated snow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {snowParticles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-80"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              filter: 'blur(0.5px)'
            }}
          />
        ))}
      </div>

      {/* Stars */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
              width: 2 + Math.random() * 2,
              height: 2 + Math.random() * 2,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🎄</div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">
            Christmas Adventure
          </h1>
          <p className="text-xl text-blue-200">Road Trip Edition 🚗</p>
          <p className="text-sm text-blue-300 mt-1">For Kinsley &amp; Emma</p>
          
          {/* Player badges */}
          {players.length > 0 && (
            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              {players.map((player, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 rounded-full text-sm font-bold"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name}
                </span>
              ))}
              <button 
                onClick={() => setShowSetup(true)}
                className="px-3 py-1 rounded-full text-sm bg-white/20 hover:bg-white/30 transition-colors"
              >
                ✏️ Edit Players
              </button>
            </div>
          )}
        </div>

        {/* Game Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Snowball Survival */}
          <button
            onClick={() => startGame('snowball')}
            className="group bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl p-6 text-left hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-cyan-500/30"
          >
            <div className="text-5xl mb-4 group-hover:animate-bounce">❄️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Snowball Survival</h2>
            <p className="text-blue-100 text-sm mb-4">
              Dodge incoming snowballs! Move with mouse/touch. Collect power-ups to survive longer!
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="px-2 py-1 bg-white/20 rounded text-xs">3D Graphics</span>
              <span className="px-2 py-1 bg-white/20 rounded text-xs">Touch Controls</span>
              <span className="px-2 py-1 bg-white/20 rounded text-xs">Multiplayer Turns</span>
            </div>
          </button>

          {/* Christmas Battleship */}
          <button
            onClick={() => setGameMode('battleship')}
            className="group bg-gradient-to-br from-sky-400 to-cyan-600 rounded-2xl p-6 text-left hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-sky-400/30"
          >
            <div className="text-5xl mb-4 group-hover:animate-bounce">⚓</div>
            <h2 className="text-2xl font-bold text-white mb-2">Christmas Battleship</h2>
            <p className="text-sky-100 text-sm mb-4">
              Play on separate tablets! Sink Santa&apos;s sleigh, reindeer, and Christmas tree ships on a snowy sea!
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="px-2 py-1 bg-white/20 rounded text-xs">2 Players</span>
              <span className="px-2 py-1 bg-white/20 rounded text-xs">Cross-Device</span>
              <span className="px-2 py-1 bg-white/20 rounded text-xs">Room Codes</span>
            </div>
          </button>
        </div>

        {/* Scavenger Hunt Card - Full Width */}
        <button
          onClick={() => setGameMode('scavenger')}
          className="group w-full bg-gradient-to-br from-red-600 to-pink-700 rounded-2xl p-6 text-left hover:scale-[1.02] transition-all duration-300 shadow-xl hover:shadow-red-500/30 mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="text-5xl group-hover:animate-bounce">🔍</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">Road Trip Scavenger Hunt</h2>
              <p className="text-red-100 text-sm mb-4">
                Spot Christmas decorations, cars, and more during your road trip! Track your finds and compete for points.
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-2 py-1 bg-white/20 rounded text-xs">26 Items</span>
                <span className="px-2 py-1 bg-white/20 rounded text-xs">Auto-Save</span>
                <span className="px-2 py-1 bg-white/20 rounded text-xs">Photo Challenges</span>
                <span className="px-2 py-1 bg-white/20 rounded text-xs">Cooperative</span>
              </div>
            </div>
          </div>
        </button>

        {/* No players prompt */}
        {players.length === 0 && (
          <div className="text-center">
            <button
              onClick={() => setShowSetup(true)}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-xl text-lg transition-colors shadow-lg hover:shadow-yellow-500/30"
            >
              🎅 Add Players to Get Started!
            </button>
          </div>
        )}
      </div>

      {/* Player Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border-2 border-green-500">
            <h2 className="text-2xl font-bold text-white mb-4">👥 Player Setup</h2>
            
            {/* Current players */}
            {players.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm text-gray-400 mb-2">Current Players:</h3>
                <div className="flex flex-wrap gap-2">
                  {players.map((player, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 px-3 py-1 rounded-full"
                      style={{ backgroundColor: player.color }}
                    >
                      <span className="font-bold">{player.name}</span>
                      <button 
                        onClick={() => removePlayer(index)}
                        className="hover:text-red-300 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quick add for Kinsley & Emma */}
            {players.length === 0 && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    const presets = [
                      { name: 'Kinsley', color: '#ff6b6b' },
                      { name: 'Emma', color: '#4ecdc4' }
                    ];
                    setPlayers(presets);
                    localStorage.setItem('christmas-adventure-players', JSON.stringify(presets));
                  }}
                  className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold py-3 rounded-xl mb-2"
                >
                  ⚡ Quick Add: Kinsley &amp; Emma
                </button>
                <p className="text-center text-gray-500 text-xs">Or add custom players below</p>
              </div>
            )}
            
            {/* Add new player */}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                  placeholder="Enter name..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white mt-1"
                  maxLength={20}
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Color</label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setPlayerColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        playerColor === color ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <button
                onClick={addPlayer}
                disabled={!playerName.trim()}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg transition-colors"
              >
                Add Player
              </button>
            </div>
            
            <button
              onClick={() => setShowSetup(false)}
              className="w-full mt-4 text-gray-400 hover:text-white transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  );
}