'use client';
import { useState, useEffect, useCallback } from 'react';

interface ScavengerItem {
  id: string;
  category: 'easy' | 'medium' | 'hard' | 'bonus';
  description: string;
  points: number;
  found: boolean;
  emoji: string;
}

interface PlayerConfig {
  name: string;
  color: string;
}

interface ScavengerHuntProps {
  players?: PlayerConfig[];
  onBack?: () => void;
}

const defaultItems: Omit<ScavengerItem, 'found'>[] = [
  // Easy (1 point each) - Made 25% harder with more specific requirements
  { id: 'e1', category: 'easy', description: 'Christmas tree tied to a car roof', points: 1, emoji: '🎄' },
  { id: 'e2', category: 'easy', description: 'Red pickup truck', points: 1, emoji: '🚗' },
  { id: 'e3', category: 'easy', description: 'Wreath with a red bow', points: 1, emoji: '🌿' },
  { id: 'e4', category: 'easy', description: 'House with colored Christmas lights', points: 1, emoji: '✨' },
  { id: 'e5', category: 'easy', description: 'Red and green decorations on same house', points: 1, emoji: '🔴' },
  { id: 'e6', category: 'easy', description: 'Giant candy cane decoration (taller than you)', points: 1, emoji: '🍬' },
  { id: 'e7', category: 'easy', description: 'Snowman with a hat and scarf', points: 1, emoji: '⛄' },
  { id: 'e8', category: 'easy', description: 'Lit star on top of a tree or house', points: 1, emoji: '⭐' },
  
  // Medium (3 points each) - Made 25% harder with specific details
  { id: 'm1', category: 'medium', description: 'Inflatable Santa (not snowman)', points: 3, emoji: '🎈' },
  { id: 'm2', category: 'medium', description: 'Car with BOTH antlers AND red nose', points: 3, emoji: '🦌' },
  { id: 'm3', category: 'medium', description: 'Person wearing full Santa suit (not just hat)', points: 3, emoji: '🎅' },
  { id: 'm4', category: 'medium', description: 'Elf decoration with pointy shoes visible', points: 3, emoji: '🧝' },
  { id: 'm5', category: 'medium', description: 'Gingerbread house decoration (not just man)', points: 3, emoji: '🍪' },
  { id: 'm6', category: 'medium', description: 'Lit angel decoration on rooftop', points: 3, emoji: '👼' },
  { id: 'm7', category: 'medium', description: 'House with ONLY blue Christmas lights', points: 3, emoji: '💙' },
  { id: 'm8', category: 'medium', description: 'Person wearing ugly Christmas sweater outside', points: 3, emoji: '🧥' },
  
  // Hard (5 points each) - Made 25% harder with challenging requirements
  { id: 'h1', category: 'hard', description: 'Santa on a business billboard (not yard sign)', points: 5, emoji: '📋' },
  { id: 'h2', category: 'hard', description: 'House with lights synced to music', points: 5, emoji: '🏠' },
  { id: 'h3', category: 'hard', description: 'Complete nativity scene with 3+ figures', points: 5, emoji: '🌟' },
  { id: 'h4', category: 'hard', description: 'Christmas tree lot with customers shopping', points: 5, emoji: '🌲' },
  { id: 'h5', category: 'hard', description: 'Neon or LED Merry Christmas sign', points: 5, emoji: '🎊' },
  { id: 'h6', category: 'hard', description: 'Moving train decoration (animated)', points: 5, emoji: '🚂' },
  
  // Bonus challenges (10 points each) - Made 25% harder
  { id: 'b1', category: 'bonus', description: '5 decorated houses in a row on same street', points: 10, emoji: '🌈' },
  { id: 'b2', category: 'bonus', description: 'Same inflatable on 3 different houses', points: 10, emoji: '🏘️' },
  { id: 'b3', category: 'bonus', description: 'Decoration that makes everyone say WOW', points: 10, emoji: '🏆' },
  { id: 'b4', category: 'bonus', description: 'Dog wearing reindeer antlers OR Santa outfit', points: 10, emoji: '🐕' },
];

const ScavengerHunt = ({ players = [], onBack }: ScavengerHuntProps) => {
  const [items, setItems] = useState<ScavengerItem[]>([]);
  const [activePlayer, setActivePlayer] = useState(0);
  const [playerScores, setPlayerScores] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  // Initialize game
  useEffect(() => {
    const savedGame = localStorage.getItem('christmas-scavenger-hunt');
    if (savedGame) {
      const parsed = JSON.parse(savedGame);
      setItems(parsed.items);
      setPlayerScores(parsed.scores);
      setActivePlayer(parsed.activePlayer || 0);
    } else {
      setItems(defaultItems.map(item => ({ ...item, found: false })));
      setPlayerScores(players.length > 0 ? players.map(() => 0) : [0]);
    }
  }, [players]);

  // Save game state
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('christmas-scavenger-hunt', JSON.stringify({
        items,
        scores: playerScores,
        activePlayer
      }));
      setCompletedCount(items.filter(i => i.found).length);
    }
  }, [items, playerScores, activePlayer]);

  const toggleItem = useCallback((itemId: string) => {
    setItems(prev => {
      const newItems = prev.map(item => {
        if (item.id === itemId) {
          const newFound = !item.found;
          
          // Update score
          setPlayerScores(scores => {
            const newScores = [...scores];
            newScores[activePlayer] += newFound ? item.points : -item.points;
            return newScores;
          });
          
          // Show confetti for hard/bonus items
          if (newFound && (item.category === 'hard' || item.category === 'bonus')) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2000);
          }
          
          return { ...item, found: newFound };
        }
        return item;
      });
      return newItems;
    });
  }, [activePlayer]);

  const resetGame = useCallback(() => {
    setItems(defaultItems.map(item => ({ ...item, found: false })));
    setPlayerScores(players.length > 0 ? players.map(() => 0) : [0]);
    setActivePlayer(0);
    localStorage.removeItem('christmas-scavenger-hunt');
  }, [players]);

  const getCategoryItems = (category: 'easy' | 'medium' | 'hard' | 'bonus') => {
    return items.filter(item => item.category === category);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'easy': return 'border-green-500 bg-green-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      case 'hard': return 'border-red-500 bg-red-500/10';
      case 'bonus': return 'border-purple-500 bg-purple-500/10';
      default: return 'border-gray-500';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'easy': return { label: 'EASY', color: 'text-green-400', points: '1 pt' };
      case 'medium': return { label: 'MEDIUM', color: 'text-yellow-400', points: '3 pts' };
      case 'hard': return { label: 'HARD', color: 'text-red-400', points: '5 pts' };
      case 'bonus': return { label: 'BONUS', color: 'text-purple-400', points: '10 pts' };
      default: return { label: '', color: '', points: '' };
    }
  };

  const totalPossiblePoints = items.reduce((sum, item) => sum + item.points, 0);
  const currentScore = playerScores[activePlayer] || 0;
  const progress = (completedCount / items.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-red-950 to-gray-900 text-white p-4 relative overflow-auto">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
                fontSize: `${1 + Math.random()}rem`
              }}
            >
              {['🎉', '⭐', '🎄', '❄️', '🎁'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack}
            className="text-white hover:text-red-400 transition-colors text-sm bg-black/30 px-4 py-2 rounded-lg"
          >
            ← Back
          </button>
          <button 
            onClick={resetGame}
            className="text-white hover:text-yellow-400 transition-colors text-sm bg-black/30 px-4 py-2 rounded-lg"
          >
            🔄 Reset
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            🎄 Christmas Road Trip 🚗
          </h1>
          <h2 className="text-2xl text-red-400">Scavenger Hunt</h2>
        </div>

        {/* Player selector (if multiple players) */}
        {players.length > 1 && (
          <div className="flex justify-center gap-2 mb-6">
            {players.map((player, index) => (
              <button
                key={index}
                onClick={() => setActivePlayer(index)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  activePlayer === index 
                    ? 'bg-red-600 scale-110' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                style={{ 
                  borderColor: player.color,
                  borderWidth: activePlayer === index ? '3px' : '1px'
                }}
              >
                {player.name}: {playerScores[index] || 0} pts
              </button>
            ))}
          </div>
        )}

        {/* Score & Progress */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-4xl font-bold text-green-400">{currentScore}</div>
              <div className="text-sm text-gray-400">of {totalPossiblePoints} possible points</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{completedCount}/{items.length}</div>
              <div className="text-sm text-gray-400">items found</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {progress === 100 && (
            <div className="text-center mt-4 text-2xl animate-pulse">
              🎉 COMPLETE! You found everything! 🎉
            </div>
          )}
        </div>

        {/* Categories */}
        {(['easy', 'medium', 'hard', 'bonus'] as const).map(category => {
          const categoryInfo = getCategoryLabel(category);
          const categoryItems = getCategoryItems(category);
          const foundInCategory = categoryItems.filter(i => i.found).length;
          
          return (
            <div key={category} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-lg font-bold ${categoryInfo.color}`}>
                  {categoryInfo.label}
                </span>
                <span className="text-gray-500 text-sm">
                  ({categoryInfo.points} each)
                </span>
                <span className="text-gray-400 text-sm ml-auto">
                  {foundInCategory}/{categoryItems.length} found
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoryItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      getCategoryColor(category)
                    } ${
                      item.found 
                        ? 'opacity-60 scale-95' 
                        : 'hover:scale-102 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <span className={`flex-1 ${item.found ? 'line-through text-gray-500' : ''}`}>
                        {item.description}
                      </span>
                      <span className={`text-2xl transition-transform duration-300 ${
                        item.found ? 'scale-110' : 'opacity-30'
                      }`}>
                        {item.found ? '✅' : '⬜'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Tips */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 mt-8 mb-8">
          <h3 className="font-bold text-blue-400 mb-2">📱 Tips for the Hunt</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Tap an item when you spot it to mark it found</li>
            <li>• Tap again if you made a mistake</li>
            <li>• Your progress is saved automatically</li>
            <li>• Try to get all the BONUS items for max points!</li>
            <li>• Take photos of your finds to share later!</li>
          </ul>
        </div>

        {/* Photo challenge section */}
        <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4 mb-8">
          <h3 className="font-bold text-purple-400 mb-3">📸 Bonus Photo Challenges</h3>
          <p className="text-sm text-gray-300 mb-3">
            Take these photos during the trip for extra fun to look at later!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="bg-black/20 p-2 rounded">📸 Silliest face in front of decorations</div>
            <div className="bg-black/20 p-2 rounded">📸 Best surprised Christmas face</div>
            <div className="bg-black/20 p-2 rounded">📸 Pretending to be a reindeer</div>
            <div className="bg-black/20 p-2 rounded">📸 Your favorite decoration</div>
            <div className="bg-black/20 p-2 rounded">📸 Family selfie by a Christmas tree</div>
            <div className="bg-black/20 p-2 rounded">📸 Acting like opening a giant gift</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScavengerHunt;
