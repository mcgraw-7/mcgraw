'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';

// Types
interface Ship {
  id: string;
  name: string;
  emoji: string;
  size: number;
  positions: { row: number; col: number }[];
  hits: number;
  sunk: boolean;
}

interface Cell {
  hasShip: boolean;
  shipId: string | null;
  isHit: boolean;
  isMiss: boolean;
}

interface GameMessage {
  type: 'ready' | 'fire' | 'result' | 'gameover' | 'rematch' | 'chat';
  payload: unknown;
}

interface ChristmasBattleshipProps {
  playerName?: string;
  onBack?: () => void;
}

const GRID_SIZE = 8;
const SHIP_TYPES = [
  { id: 'sleigh', name: "Santa's Sleigh", emoji: '🛷', size: 4, shipEmojis: ['🛷', '🎅', '🎁', '✨'] },
  { id: 'reindeer', name: 'Reindeer Team', emoji: '🦌', size: 3, shipEmojis: ['🦌', '🦌', '🔔'] },
  { id: 'tree', name: 'Tree Ship', emoji: '🎄', size: 3, shipEmojis: ['⭐', '🎄', '🎄'] },
  { id: 'snowman', name: 'Frosty Float', emoji: '⛄', size: 2, shipEmojis: ['⛄', '❄️'] },
  { id: 'present', name: 'Gift Boat', emoji: '🎁', size: 2, shipEmojis: ['🎁', '🎀'] },
];

interface ShipTypeWithEmojis {
  id: string;
  name: string;
  emoji: string;
  size: number;
  shipEmojis: string[];
}

const generateRoomCode = () => {
  const words = ['SNOW', 'TREE', 'GIFT', 'STAR', 'BELL', 'SLED', 'DEER', 'COAL', 'NOEL', 'YULE', 'JINGLE', 'HOLLY'];
  return words[Math.floor(Math.random() * words.length)] + Math.floor(Math.random() * 100).toString().padStart(2, '0');
};

// Cute falling snow particles - SLOW & GENTLE
const SnowParticles = () => {
  const [particles] = useState(() => 
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 15 + Math.random() * 20,
      size: 6 + Math.random() * 10,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute animate-fall"
          style={{
            left: `${p.x}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          <span style={{ fontSize: p.size }}>❄️</span>
        </div>
      ))}
      <style jsx>{`
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { transform: translateY(100vh) rotate(180deg); opacity: 0; }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
};

const createEmptyGrid = (): Cell[][] => {
  return Array(GRID_SIZE).fill(null).map(() =>
    Array(GRID_SIZE).fill(null).map(() => ({
      hasShip: false,
      shipId: null,
      isHit: false,
      isMiss: false,
    }))
  );
};

const ChristmasBattleship = ({ playerName = 'Player', onBack }: ChristmasBattleshipProps) => {
  // Connection state
  const [gamePhase, setGamePhase] = useState<'menu' | 'waiting' | 'placing' | 'playing' | 'gameover'>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);
  const [opponentName, setOpponentName] = useState('Opponent');
  const [connectionError, setConnectionError] = useState('');

  // Game state
  const [myGrid, setMyGrid] = useState<Cell[][]>(createEmptyGrid());
  const [opponentGrid, setOpponentGrid] = useState<Cell[][]>(createEmptyGrid());
  const [myShips, setMyShips] = useState<Ship[]>([]);
  const [opponentShipsRemaining, setOpponentShipsRemaining] = useState(5);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [lastHit, setLastHit] = useState<{ row: number; col: number } | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
  const [shipPositionMap, setShipPositionMap] = useState<Map<string, number>>(new Map());

  // Ship placement state
  const [placingShipIndex, setPlacingShipIndex] = useState(0);
  const [isHorizontal, setIsHorizontal] = useState(true);
  const [previewCells, setPreviewCells] = useState<{ row: number; col: number }[]>([]);
  const [isValidPlacement, setIsValidPlacement] = useState(false);

  // Refs
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  // Cleanup peer connection
  useEffect(() => {
    return () => {
      connRef.current?.close();
      peerRef.current?.destroy();
    };
  }, []);

  // Send message to opponent
  const sendMessage = useCallback((message: GameMessage) => {
    if (connRef.current?.open) {
      connRef.current.send(message);
    }
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((message: GameMessage) => {
    switch (message.type) {
      case 'ready':
        setOpponentReady(true);
        setOpponentName((message.payload as { name: string }).name || 'Opponent');
        break;
      case 'fire': {
        const { row, col } = message.payload as { row: number; col: number };
        const cell = myGrid[row][col];
        let result: 'hit' | 'miss' | 'sunk' = 'miss';
        let sunkShip: Ship | null = null;

        if (cell.hasShip) {
          result = 'hit';
          // Update my grid
          setMyGrid(prev => {
            const newGrid = prev.map(r => r.map(c => ({ ...c })));
            newGrid[row][col].isHit = true;
            return newGrid;
          });
          // Update ship hits
          setMyShips(prev => {
            const newShips = prev.map(ship => {
              if (ship.id === cell.shipId) {
                const newHits = ship.hits + 1;
                const isSunk = newHits >= ship.size;
                if (isSunk) {
                  result = 'sunk';
                  sunkShip = { ...ship, hits: newHits, sunk: true };
                }
                return { ...ship, hits: newHits, sunk: isSunk };
              }
              return ship;
            });
            // Check if all ships sunk
            const allSunk = newShips.every(s => s.sunk);
            if (allSunk) {
              setTimeout(() => {
                sendMessage({ type: 'gameover', payload: { winner: opponentName } });
                setWinner(opponentName);
                setGamePhase('gameover');
              }, 500);
            }
            return newShips;
          });
        } else {
          setMyGrid(prev => {
            const newGrid = prev.map(r => r.map(c => ({ ...c })));
            newGrid[row][col].isMiss = true;
            return newGrid;
          });
        }
        sendMessage({ type: 'result', payload: { row, col, result, sunkShip } });
        setIsMyTurn(true);
        break;
      }
      case 'result': {
        const { row, col, result, sunkShip } = message.payload as {
          row: number;
          col: number;
          result: 'hit' | 'miss' | 'sunk';
          sunkShip: Ship | null;
        };
        setOpponentGrid(prev => {
          const newGrid = prev.map(r => r.map(c => ({ ...c })));
          if (result === 'hit' || result === 'sunk') {
            newGrid[row][col].isHit = true;
            setLastHit({ row, col });
          } else {
            newGrid[row][col].isMiss = true;
          }
          return newGrid;
        });
        if (result === 'sunk' && sunkShip) {
          setOpponentShipsRemaining(prev => prev - 1);
          setMessages(prev => [...prev, { from: '🎯', text: `You sunk their ${sunkShip.emoji} ${sunkShip.name}!` }]);
        }
        setIsMyTurn(false);
        break;
      }
      case 'gameover': {
        const { winner: w } = message.payload as { winner: string };
        setWinner(w);
        setGamePhase('gameover');
        break;
      }
      case 'chat': {
        const { text } = message.payload as { text: string };
        setMessages(prev => [...prev, { from: opponentName, text }]);
        break;
      }
      case 'rematch':
        resetGame();
        break;
    }
  }, [myGrid, opponentName, sendMessage]);

  // Create game (host)
  const createGame = useCallback(() => {
    const code = generateRoomCode();
    setRoomCode(code);
    setIsHost(true);
    setGamePhase('waiting');
    setConnectionError('');

    const peer = new Peer(`xmas-battleship-${code}`, { debug: 0 });
    peerRef.current = peer;

    peer.on('open', () => console.log('Host ready'));
    peer.on('connection', (conn) => {
      connRef.current = conn;
      conn.on('open', () => {
        setConnected(true);
        setGamePhase('placing');
        conn.send({ type: 'ready', payload: { name: playerName } });
      });
      conn.on('data', (data) => handleMessage(data as GameMessage));
      conn.on('close', () => {
        setConnected(false);
        setConnectionError('Opponent disconnected 😢');
      });
    });
    peer.on('error', (err) => setConnectionError(`Connection error: ${err.type}`));
  }, [playerName, handleMessage]);

  // Join game (guest)
  const joinGame = useCallback(() => {
    if (!inputCode.trim()) return;
    
    setRoomCode(inputCode.toUpperCase());
    setIsHost(false);
    setGamePhase('waiting');
    setConnectionError('');

    const peer = new Peer({ debug: 0 });
    peerRef.current = peer;

    peer.on('open', () => {
      const conn = peer.connect(`xmas-battleship-${inputCode.toUpperCase()}`);
      connRef.current = conn;
      conn.on('open', () => {
        setConnected(true);
        setGamePhase('placing');
        conn.send({ type: 'ready', payload: { name: playerName } });
      });
      conn.on('data', (data) => handleMessage(data as GameMessage));
      conn.on('close', () => {
        setConnected(false);
        setConnectionError('Host disconnected 😢');
      });
      conn.on('error', () => setConnectionError('Could not connect'));
    });
    peer.on('error', (err) => {
      if (err.type === 'peer-unavailable') {
        setConnectionError('Game not found! Check the code 🔍');
      } else {
        setConnectionError(`Error: ${err.type}`);
      }
      setGamePhase('menu');
    });
  }, [inputCode, playerName, handleMessage]);

  // Ship placement preview
  const handleCellHover = useCallback((row: number, col: number) => {
    if (gamePhase !== 'placing' || placingShipIndex >= SHIP_TYPES.length) return;

    const ship = SHIP_TYPES[placingShipIndex];
    const cells: { row: number; col: number }[] = [];
    let valid = true;

    for (let i = 0; i < ship.size; i++) {
      const r = isHorizontal ? row : row + i;
      const c = isHorizontal ? col + i : col;

      if (r >= GRID_SIZE || c >= GRID_SIZE) {
        valid = false;
        break;
      }
      if (myGrid[r][c].hasShip) {
        valid = false;
      }
      cells.push({ row: r, col: c });
    }

    setPreviewCells(cells);
    setIsValidPlacement(valid && cells.length === ship.size);
  }, [gamePhase, placingShipIndex, isHorizontal, myGrid]);

  // Place ship
  const placeShip = useCallback((row: number, col: number) => {
    if (!isValidPlacement || placingShipIndex >= SHIP_TYPES.length) return;

    const shipType = SHIP_TYPES[placingShipIndex];
    const positions = previewCells;

    // Add ship
    const newShip: Ship = {
      ...shipType,
      positions,
      hits: 0,
      sunk: false,
    };
    setMyShips(prev => [...prev, newShip]);

    // Track position index for each cell (for multi-emoji ships)
    const newMap = new Map(shipPositionMap);
    positions.forEach((pos, idx) => {
      newMap.set(`${pos.row}-${pos.col}`, idx);
    });
    setShipPositionMap(newMap);

    // Update grid
    setMyGrid(prev => {
      const newGrid = prev.map(r => r.map(c => ({ ...c })));
      positions.forEach(pos => {
        newGrid[pos.row][pos.col].hasShip = true;
        newGrid[pos.row][pos.col].shipId = shipType.id;
      });
      return newGrid;
    });

    setPlacingShipIndex(prev => prev + 1);
    setPreviewCells([]);
    setIsValidPlacement(false);

    // Check if all ships placed
    if (placingShipIndex === SHIP_TYPES.length - 1) {
      // Start playing - host goes first
      setGamePhase('playing');
      setIsMyTurn(isHost);
    }
  }, [isValidPlacement, placingShipIndex, previewCells, isHost, shipPositionMap]);

  // Fire at opponent
  const fireAt = useCallback((row: number, col: number) => {
    if (!isMyTurn || opponentGrid[row][col].isHit || opponentGrid[row][col].isMiss) return;

    sendMessage({ type: 'fire', payload: { row, col } });
    setIsMyTurn(false);
  }, [isMyTurn, opponentGrid, sendMessage]);

  // Reset game for rematch
  const resetGame = useCallback(() => {
    setMyGrid(createEmptyGrid());
    setOpponentGrid(createEmptyGrid());
    setMyShips([]);
    setOpponentShipsRemaining(5);
    setPlacingShipIndex(0);
    setPreviewCells([]);
    setIsValidPlacement(false);
    setWinner(null);
    setLastHit(null);
    setMessages([]);
    setOpponentReady(false);
    setShipPositionMap(new Map());
    setGamePhase('placing');
    setIsMyTurn(isHost);
  }, [isHost]);

  // Request rematch
  const requestRematch = useCallback(() => {
    sendMessage({ type: 'rematch', payload: {} });
    resetGame();
  }, [sendMessage, resetGame]);

  // Get ship emoji for a specific cell position (multi-emoji ships)
  const getShipEmoji = (cell: Cell, row: number, col: number): string => {
    if (!cell.hasShip || !cell.shipId) return '';
    const shipType = SHIP_TYPES.find(s => s.id === cell.shipId) as ShipTypeWithEmojis | undefined;
    if (!shipType) return '🚢';
    
    const posIndex = shipPositionMap.get(`${row}-${col}`);
    if (posIndex !== undefined && shipType.shipEmojis?.[posIndex]) {
      return shipType.shipEmojis[posIndex];
    }
    return shipType.emoji;
  };

  // Render grid cell - CUTE CHRISTMAS THEME
  const renderCell = (
    cell: Cell,
    row: number,
    col: number,
    isMyBoard: boolean,
    onClick?: () => void
  ) => {
    const isPreview = previewCells.some(p => p.row === row && p.col === col);
    const isLastHitCell = lastHit?.row === row && lastHit?.col === col;
    
    // Cute water animation pattern for snowy seas
    const waveOffset = (row + col) % 3;

    let content = '';
    let cellStyle = '';
    let animationClass = '';

    if (cell.isHit) {
      content = '💥';
      cellStyle = 'bg-red-400/60 border-red-300 shadow-inner';
      animationClass = 'animate-bounce';
    } else if (cell.isMiss) {
      content = '🌊';
      cellStyle = 'bg-cyan-200/50 border-cyan-100';
    } else if (isMyBoard && cell.hasShip) {
      content = getShipEmoji(cell, row, col);
      cellStyle = 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-300 shadow-md';
    } else if (isPreview) {
      cellStyle = isValidPlacement 
        ? 'bg-green-300/70 border-green-400 scale-105 shadow-lg' 
        : 'bg-red-300/70 border-red-400';
    } else {
      // Beautiful snowy water cells - bright cyan and white
      cellStyle = waveOffset === 0 
        ? 'bg-gradient-to-br from-cyan-300 via-white to-blue-300' 
        : waveOffset === 1 
          ? 'bg-gradient-to-br from-blue-300 via-cyan-200 to-white'
          : 'bg-gradient-to-br from-white via-cyan-300 to-blue-400';
    }

    return (
      <button
        key={`${row}-${col}`}
        className={`
          w-10 h-10 sm:w-12 sm:h-12 
          border-2 border-white/50 rounded-lg
          flex items-center justify-center 
          text-xl sm:text-2xl
          transition-all duration-200 ease-out
          shadow-sm hover:shadow-lg
          ${cellStyle}
          ${!isMyBoard && isMyTurn && !cell.isHit && !cell.isMiss 
            ? 'hover:bg-yellow-200/80 hover:scale-110 cursor-crosshair hover:border-yellow-400 hover:shadow-xl' 
            : ''}
          ${isLastHitCell ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
          ${animationClass}
        `}
        onClick={onClick}
        onMouseEnter={isMyBoard && gamePhase === 'placing' ? () => handleCellHover(row, col) : undefined}
        disabled={isMyBoard || !isMyTurn || cell.isHit || cell.isMiss}
      >
        {content}
      </button>
    );
  };

  // Render game grid with cute styling
  const renderGrid = (grid: Cell[][], isMyBoard: boolean, title: string, icon: string) => {
    const letters = 'ABCDEFGH';
    
    return (
      <div className="bg-white/30 backdrop-blur-md rounded-3xl p-4 shadow-2xl border-4 border-white/60">
        <h3 className="text-center text-white font-bold mb-3 text-lg drop-shadow-lg">
          {icon} {title}
        </h3>
        <div className="inline-block">
          {/* Column headers */}
          <div className="flex ml-10 sm:ml-12">
            {Array(GRID_SIZE).fill(0).map((_, i) => (
              <div key={i} className="w-10 h-6 sm:w-12 text-center text-sm font-bold text-white drop-shadow">
                {i + 1}
              </div>
            ))}
          </div>
          
          {/* Grid rows */}
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              <div className="w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center text-sm font-bold text-white drop-shadow">
                {letters[rowIndex]}
              </div>
              {row.map((cell, colIndex) =>
                renderCell(
                  cell,
                  rowIndex,
                  colIndex,
                  isMyBoard,
                  isMyBoard ? () => placeShip(rowIndex, colIndex) : () => fireAt(rowIndex, colIndex)
                )
              )}
            </div>
          ))}
        </div>
        
        {/* Ship count */}
        <div className="text-center mt-3 text-white/90 text-sm font-medium drop-shadow">
          {isMyBoard 
            ? `🚢 Ships: ${myShips.filter(s => !s.sunk).length}/${SHIP_TYPES.length}`
            : `🎯 Targets: ${opponentShipsRemaining}/${SHIP_TYPES.length}`
          }
        </div>
      </div>
    );
  };

  // ============ MENU SCREEN - CUTE CHRISTMAS ============
  if (gamePhase === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 via-cyan-400 to-blue-500 flex items-center justify-center p-4 relative overflow-hidden">
        <SnowParticles />
        
        {/* Decorative Christmas trees */}
        <div className="absolute top-4 left-4 text-6xl animate-bounce">🎄</div>
        <div className="absolute top-4 right-4 text-6xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎄</div>
        <div className="absolute bottom-4 left-1/4 text-4xl">⛄</div>
        <div className="absolute bottom-4 right-1/4 text-4xl">🦌</div>
        
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border-4 border-red-400 shadow-2xl relative z-10">
          {/* Title with cute decorations */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🎅⚓🎄</div>
            <h1 className="text-4xl font-bold text-red-600 drop-shadow-sm">Christmas</h1>
            <h1 className="text-4xl font-bold text-green-600 -mt-1">Battleship!</h1>
            <p className="text-blue-600 mt-2 font-medium">Sink your opponent&apos;s holiday fleet! 🛷</p>
          </div>

          {connectionError && (
            <div className="bg-red-100 border-2 border-red-400 rounded-xl p-3 mb-4 text-red-600 text-center font-medium">
              {connectionError}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={createGame}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-bold py-4 rounded-2xl text-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 border-b-4 border-green-700"
            >
              🎁 Create Game
            </button>

            <div className="text-center text-gray-500 font-medium">— or join a game —</div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="Enter code..."
                className="flex-1 bg-blue-50 border-2 border-blue-300 rounded-xl px-4 py-3 text-blue-700 text-center text-xl tracking-widest uppercase font-bold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                maxLength={8}
              />
              <button
                onClick={joinGame}
                disabled={!inputCode.trim()}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold px-6 rounded-xl transition-all shadow-lg hover:shadow-xl border-b-4 border-blue-700 disabled:border-gray-600"
              >
                🎯
              </button>
            </div>
          </div>

          {/* Fleet preview */}
          <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
            <p className="text-center text-blue-600 text-sm font-medium mb-2">Your Holiday Fleet:</p>
            <div className="flex justify-center gap-3 text-2xl">
              {SHIP_TYPES.map(ship => (
                <span key={ship.id} title={ship.name} className="hover:scale-125 transition-transform cursor-help">
                  {ship.emoji}
                </span>
              ))}
            </div>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="w-full mt-4 text-gray-500 hover:text-gray-700 transition-colors font-medium"
            >
              ← Back to Games
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============ WAITING SCREEN - CUTE CHRISTMAS ============
  if (gamePhase === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 via-cyan-400 to-blue-500 flex items-center justify-center p-4 relative overflow-hidden">
        <SnowParticles />
        
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border-4 border-yellow-400 shadow-2xl text-center relative z-10">
          <div className="text-6xl mb-4 animate-bounce">🎅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {isHost ? 'Waiting for Player 2!' : 'Connecting...'}
          </h2>

          {isHost && (
            <div className="bg-gradient-to-br from-red-100 to-green-100 rounded-2xl p-6 mb-6 border-2 border-dashed border-red-300">
              <p className="text-gray-600 text-sm mb-2 font-medium">Share this secret code:</p>
              <div className="text-4xl font-mono font-bold text-red-600 tracking-widest bg-white rounded-xl py-3 border-2 border-red-200 shadow-inner">
                {roomCode}
              </div>
              <p className="text-xs text-gray-500 mt-2">🤫 Tell your opponent this code!</p>
            </div>
          )}

          <div className="flex justify-center gap-2 text-3xl">
            <span className="animate-bounce" style={{ animationDelay: '0s' }}>🎄</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>⭐</span>
            <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>🎄</span>
          </div>

          <button
            onClick={() => {
              connRef.current?.close();
              peerRef.current?.destroy();
              setGamePhase('menu');
            }}
            className="mt-6 text-gray-500 hover:text-red-500 transition-colors font-medium"
          >
            ❌ Cancel
          </button>
        </div>
      </div>
    );
  }

  // ============ SHIP PLACEMENT SCREEN - CUTE CHRISTMAS ============
  if (gamePhase === 'placing') {
    const currentShip = SHIP_TYPES[placingShipIndex];
    const allPlaced = placingShipIndex >= SHIP_TYPES.length;

    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 via-cyan-400 to-blue-500 p-4 relative overflow-hidden">
        <SnowParticles />
        
        <div className="max-w-lg mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-4 bg-white/80 backdrop-blur rounded-2xl p-4 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800">🚢 Place Your Fleet!</h2>
            <p className="text-blue-600 font-medium">
              {allPlaced
                ? opponentReady ? '✨ Let the battle begin!' : '⏳ Waiting for opponent...'
                : `Placing: ${currentShip?.emoji} ${currentShip?.name}`}
            </p>
          </div>

          {/* Rotation button */}
          {!allPlaced && (
            <div className="text-center mb-4">
              <button
                onClick={() => setIsHorizontal(!isHorizontal)}
                className="bg-white hover:bg-yellow-100 text-gray-800 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all border-2 border-yellow-400"
              >
                🔄 Rotate ({isHorizontal ? '➡️ Horizontal' : '⬇️ Vertical'})
              </button>
            </div>
          )}

          {/* Grid */}
          <div className="flex justify-center mb-4">
            {renderGrid(myGrid, true, 'Your Waters', '🏠')}
          </div>

          {/* Ships to place */}
          <div className="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-lg">
            <h3 className="text-sm text-gray-600 mb-3 text-center font-medium">Your Christmas Fleet:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {SHIP_TYPES.map((ship, index) => (
                <div
                  key={ship.id}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    index < placingShipIndex
                      ? 'bg-green-500 text-white shadow-md'
                      : index === placingShipIndex
                      ? 'bg-yellow-400 text-gray-800 scale-110 shadow-lg animate-pulse'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {ship.emoji} {ship.name} ({ship.size})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ MAIN GAME SCREEN - CUTE CHRISTMAS ============
  if (gamePhase === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 via-cyan-400 to-blue-500 p-2 sm:p-4 relative overflow-hidden">
        <SnowParticles />
        
        <div className="max-w-5xl mx-auto relative z-10">
          {/* Turn indicator */}
          <div className={`text-center py-4 rounded-2xl mb-4 shadow-lg transition-all ${
            isMyTurn 
              ? 'bg-gradient-to-r from-green-400 to-green-500 scale-105' 
              : 'bg-gradient-to-r from-gray-400 to-gray-500'
          }`}>
            <span className="text-white font-bold text-xl drop-shadow">
              {isMyTurn ? '🎯 Your Turn - Fire Away!' : `⏳ ${opponentName} is aiming...`}
            </span>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 justify-items-center">
            {/* Opponent's grid - Attack here! */}
            <div className="order-1">
              {renderGrid(opponentGrid, false, `${opponentName}'s Fleet`, '🎯')}
            </div>

            {/* My grid - Defense */}
            <div className="order-2">
              {renderGrid(myGrid, true, 'Your Fleet', '🛡️')}
            </div>
          </div>

          {/* Battle log */}
          {messages.length > 0 && (
            <div className="mt-4 bg-white/80 backdrop-blur rounded-2xl p-4 shadow-lg max-h-24 overflow-y-auto">
              {messages.slice(-3).map((msg, i) => (
                <div key={i} className="text-sm text-gray-700 font-medium">
                  <span className="text-lg">{msg.from}</span> {msg.text}
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 flex justify-center gap-6 text-sm bg-white/60 backdrop-blur rounded-xl py-2 px-4">
            <span>💥 Hit</span>
            <span>🌊 Miss</span>
            <span className="hidden sm:inline">🛷🦌🎄⛄🎁 Ships</span>
          </div>
        </div>
      </div>
    );
  }

  // ============ GAME OVER SCREEN - CUTE CHRISTMAS ============
  if (gamePhase === 'gameover') {
    const didWin = winner === playerName;
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 via-cyan-400 to-blue-500 flex items-center justify-center p-4 relative overflow-hidden">
        <SnowParticles />
        
        <div className={`bg-white/95 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border-4 ${
          didWin ? 'border-yellow-400' : 'border-blue-400'
        } shadow-2xl text-center relative z-10`}>
          <div className="text-7xl mb-4">
            {didWin ? '🏆' : '🎄'}
          </div>
          <h2 className={`text-4xl font-bold mb-2 ${didWin ? 'text-yellow-600' : 'text-blue-600'}`}>
            {didWin ? 'Victory!' : 'Good Game!'}
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            {didWin
              ? '🎉 You sunk all their ships!'
              : `${winner} wins this battle!`}
          </p>

          <div className="flex justify-center gap-4 text-4xl mb-6">
            {didWin ? (
              <>
                <span className="animate-bounce">🎁</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>⭐</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🎁</span>
              </>
            ) : (
              <>
                <span>❄️</span>
                <span>⛄</span>
                <span>❄️</span>
              </>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={requestRematch}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-bold py-4 rounded-2xl text-lg transition-all shadow-lg hover:shadow-xl border-b-4 border-green-700"
            >
              🔄 Play Again!
            </button>
            <button
              onClick={() => {
                connRef.current?.close();
                peerRef.current?.destroy();
                setGamePhase('menu');
              }}
              className="w-full bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-300 hover:to-gray-400 text-white font-bold py-3 rounded-2xl transition-all shadow-lg border-b-4 border-gray-600"
            >
              🏠 Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ChristmasBattleship;
