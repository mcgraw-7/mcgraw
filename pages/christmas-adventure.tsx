'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports to avoid SSR issues
const ChristmasPictionary = dynamic(() => import('../app/components/christmas-adventure/ChristmasPictionary'), {
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

type GameMode = 'menu' | 'pictionary' | 'battleship' | 'scavenger' | 'setup';

export default function ChristmasAdventure() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [players, setPlayers] = useState<PlayerConfig[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerColor, setPlayerColor] = useState('#ff6b6b');
  const [snowParticles, setSnowParticles] = useState<{x: number, y: number, speed: number, size: number}[]>([]);

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
    if (gameMode !== 'menu') return;
    
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

  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
    '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe'
  ];

  // Game screens
  if (gameMode === 'pictionary') {
    return (
      <div className="w-screen h-screen relative">
        <ChristmasPictionary />
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
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">
            McGriswold Christmas Vacation
          </h1>
          <p className="text-xl text-blue-200">2025 Edition</p>
          <p className="text-sm text-blue-300 mt-1">For Kinsley and Emma</p>
          
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
                Edit Players
              </button>
            </div>
          )}
        </div>

        {/* Game Cards - Stacked Layout */}
        <div className="flex flex-col gap-6 mb-8">
          
          {/* Christmas Pictionary */}
          <button
            onClick={() => setGameMode('pictionary')}
            className="group bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-left hover:scale-[1.02] transition-all duration-300 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-white mb-3">Christmas Pictionary</h2>
            <p className="text-purple-100 mb-4">
              A classic drawing and guessing game with a holiday twist! One player draws Christmas-themed words while the other tries to guess what it is.
            </p>
            <div className="bg-white/10 rounded-xl p-4 mb-4">
              <h3 className="text-white font-semibold mb-2">How to Play:</h3>
              <ol className="text-purple-100 text-sm space-y-1 list-decimal list-inside">
                <li>One player creates a room and shares the code</li>
                <li>The other player joins using the room code</li>
                <li>Take turns drawing Christmas words on the canvas</li>
                <li>Guess correctly to earn points - faster guesses = more points!</li>
                <li>Play 6 rounds and see who wins</li>
              </ol>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="px-2 py-1 bg-white/20 rounded text-xs">2 Players</span>
              <span className="px-2 py-1 bg-white/20 rounded text-xs">Cross-Device</span>
              <span className="px-2 py-1 bg-white/20 rounded text-xs">60 Second Rounds</span>
            </div>
          </button>

          {/* Christmas Battleship */}
          <button
            onClick={() => setGameMode('battleship')}
            className="group bg-gradient-to-br from-sky-400 to-cyan-600 rounded-2xl p-6 text-left hover:scale-[1.02] transition-all duration-300 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-white mb-3">Christmas Battleship</h2>
            <p className="text-sky-100 mb-4">
              The classic naval battle game reimagined for Christmas! Hide your holiday fleet and try to sink your opponents ships on a snowy sea.
            </p>
            <div className="bg-white/10 rounded-xl p-4 mb-4">
              <h3 className="text-white font-semibold mb-2">How to Play:</h3>
              <ol className="text-sky-100 text-sm space-y-1 list-decimal list-inside">
                <li>One player creates a game room and shares the code</li>
                <li>The other player joins with the room code</li>
                <li>Each player secretly places their Christmas ships</li>
                <li>Take turns tapping the grid to fire at opponents ships</li>
                <li>First player to sink all enemy ships wins!</li>
              </ol>
            </div>
            <div className="bg-white/10 rounded-xl p-4 mb-4">
              <h3 className="text-white font-semibold mb-2">Your Fleet:</h3>
              <ul className="text-sky-100 text-sm space-y-1">
                <li>Sleigh (5 spaces) - Santas main ride</li>
                <li>Reindeer Team (4 spaces) - The flying crew</li>
                <li>Christmas Tree (3 spaces) - Festive and tall</li>
                <li>Snowman (3 spaces) - Frosty friend</li>
                <li>Present (2 spaces) - Small but valuable</li>
              </ul>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="px-2 py-1 bg-white/20 rounded text-xs">2 Players</span>
              <span className="px-2 py-1 bg-white/20 rounded text-xs">Cross-Device</span>
              <span className="px-2 py-1 bg-white/20 rounded text-xs">Turn-Based Strategy</span>
            </div>
          </button>

          {/* Scavenger Hunt */}
          <button
            onClick={() => setGameMode('scavenger')}
            className="group bg-gradient-to-br from-red-600 to-pink-700 rounded-2xl p-6 text-left hover:scale-[1.02] transition-all duration-300 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-white mb-3">Road Trip Scavenger Hunt</h2>
            <p className="text-red-100 mb-4">
              Look out the window and spot Christmas items during the drive! Work together or compete to find holiday decorations, special cars, and more.
            </p>
            <div className="bg-white/10 rounded-xl p-4 mb-4">
              <h3 className="text-white font-semibold mb-2">How to Play:</h3>
              <ol className="text-red-100 text-sm space-y-1 list-decimal list-inside">
                <li>Browse the list of items to find</li>
                <li>When you spot something, tap the item to mark it found</li>
                <li>Some items are worth more points than others</li>
                <li>Try to find everything before the trip ends!</li>
                <li>Your progress auto-saves so you can continue later</li>
              </ol>
            </div>
            <div className="bg-white/10 rounded-xl p-4 mb-4">
              <h3 className="text-white font-semibold mb-2">Item Categories:</h3>
              <ul className="text-red-100 text-sm grid grid-cols-2 gap-1">
                <li>Christmas Lights</li>
                <li>Decorated Houses</li>
                <li>Special Vehicles</li>
                <li>Holiday Characters</li>
                <li>Nature Items</li>
                <li>Bonus Challenges</li>
              </ul>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="px-2 py-1 bg-white/20 rounded text-xs">26 Items</span>
              <span className="px-2 py-1 bg-white/20 rounded text-xs">Auto-Save</span>
              <span className="px-2 py-1 bg-white/20 rounded text-xs">Play Together</span>
            </div>
          </button>
        </div>

        {/* No players prompt */}
        {players.length === 0 && (
          <div className="text-center">
            <button
              onClick={() => setShowSetup(true)}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-xl text-lg transition-colors shadow-lg"
            >
              Add Players to Get Started
            </button>
          </div>
        )}
      </div>

      {/* Player Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border-2 border-green-500">
            <h2 className="text-2xl font-bold text-white mb-4">Player Setup</h2>
            
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
                        x
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
                  Quick Add: Kinsley and Emma
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
