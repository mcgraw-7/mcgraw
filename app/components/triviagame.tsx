'use client';
import React, { useEffect, useState } from 'react';

interface Question {
  id: string;
  question: { text: string };
  correctAnswer: string;
  incorrectAnswers: string[];
  category: string;
  difficulty: string;
}

const CATEGORIES = [
  { id: 'general_knowledge', name: 'General Knowledge' },
  { id: 'science', name: 'Science' },
  { id: 'history', name: 'History' },
  { id: 'geography', name: 'Geography' },
  { id: 'film_and_tv', name: 'Film & TV' },
  { id: 'music', name: 'Music' },
  { id: 'sport_and_leisure', name: 'Sports' },
  { id: 'arts_and_literature', name: 'Arts & Literature' },
  { id: 'food_and_drink', name: 'Food & Drink' },
  { id: 'society_and_culture', name: 'Society & Culture' },
];

const DIFFICULTIES = ['easy', 'medium', 'hard'];

// ASCII Hangman stages - retro terminal style
const HANGMAN_STAGES = [
  // Stage 0 - Empty gallows
  `
  ╔═══════╗
  ║       │
  ║       
  ║      
  ║       
  ║       
  ╠═══════╧═══╗
  ║ SYSTEM OK ║
  ╚═══════════╝`,
  // Stage 1 - Head
  `
  ╔═══════╗
  ║       │
  ║       O
  ║      
  ║       
  ║       
  ╠═══════════╗
  ║ WARNING!! ║
  ╚═══════════╝`,
  // Stage 2 - Body
  `
  ╔═══════╗
  ║       │
  ║       O
  ║       │
  ║       
  ║       
  ╠═══════════╗
  ║ CRITICAL! ║
  ╚═══════════╝`,
  // Stage 3 - Left arm
  `
  ╔═══════╗
  ║       │
  ║       O
  ║      /│
  ║       
  ║       
  ╠═══════════╗
  ║  DANGER!  ║
  ╚═══════════╝`,
  // Stage 4 - Right arm
  `
  ╔═══════╗
  ║       │
  ║       O
  ║      /│\\
  ║       
  ║       
  ╠═══════════╗
  ║  ALERT!!  ║
  ╚═══════════╝`,
  // Stage 5 - Left leg
  `
  ╔═══════╗
  ║       │
  ║       O
  ║      /│\\
  ║      / 
  ║       
  ╠═══════════╗
  ║ SYS FAIL! ║
  ╚═══════════╝`,
  // Stage 6 - Right leg (DEAD)
  `
  ╔═══════╗
  ║       │
  ║       X
  ║      /│\\
  ║      / \\
  ║       
  ╠═══════════╗
  ║ TERMINATED║
  ╚═══════════╝`,
];

const MAX_WRONG = 6;

const TriviaGame: React.FC = () => {
  // Game state
  const [gameMode, setGameMode] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings
  const [selectedCategory, setSelectedCategory] = useState<string>('general_knowledge');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium');
  const [questionCount, setQuestionCount] = useState(10);

  // Fetch questions from The Trivia API
  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://the-trivia-api.com/v2/questions?limit=${questionCount}&categories=${selectedCategory}&difficulties=${selectedDifficulty}`
      );
      const data = await response.json();
      setQuestions(data);
      setGameMode('playing');
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
    setIsLoading(false);
  };

  // Shuffle answers when question changes
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const q = questions[currentQuestionIndex];
      const answers = [...q.incorrectAnswers, q.correctAnswer];
      // Fisher-Yates shuffle
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }
      setShuffledAnswers(answers);
    }
  }, [currentQuestionIndex, questions]);

  // Typewriter effect
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length && gameMode === 'playing') {
      const text = questions[currentQuestionIndex].question.text;
      setTypedText('');
      setIsTyping(true);
      let i = 0;
      const timer = setInterval(() => {
        if (i < text.length) {
          const char = text.charAt(i);
          setTypedText(prev => prev + char);
          i++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
        }
      }, 25);
      return () => clearInterval(timer);
    }
  }, [currentQuestionIndex, questions, gameMode]);

  const handleAnswer = (answer: string) => {
    if (isTyping || showAnswer) return;
    
    setSelectedAnswer(answer);
    setShowAnswer(true);
    
    const isCorrect = answer === questions[currentQuestionIndex].correctAnswer;
    
    if (isCorrect) {
      setScore(score + 1);
    } else {
      const newWrong = wrongAnswers + 1;
      setWrongAnswers(newWrong);
      if (newWrong >= MAX_WRONG) {
        setTimeout(() => setGameMode('gameover'), 2000);
        return;
      }
    }
    
    setTimeout(() => {
      if (currentQuestionIndex + 1 >= questions.length) {
        setGameMode('gameover');
      } else {
        setShowAnswer(false);
        setSelectedAnswer(null);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }, 1500);
  };

  const restartGame = () => {
    setGameMode('menu');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setWrongAnswers(0);
    setShowAnswer(false);
    setSelectedAnswer(null);
  };

  // Menu screen
  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-black overflow-hidden">
        <div className="pt-20 pb-12 px-8 border-b border-neonGreen">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 lowercase">
            <span className="text-orange-500">&gt;</span> trivia terminal
          </h1>
          <p className="text-neonGreen text-sm md:text-base max-w-2xl">
            configure your trivia session — survive the hangman
          </p>
        </div>

        <div className="p-8">
          <div className="relative bg-gray-900 border-2 border-gray-700 max-w-4xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-1 h-full bg-gradient-to-b from-neonGreen via-neonGreen to-transparent opacity-30"></div>
            
            {/* Terminal Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 text-gray-500 text-xs font-mono">trivia@terminal ~ config</span>
            </div>

            <div className="p-6 font-mono space-y-6">
              {/* Category Selection */}
              <div>
                <p className="text-green-400 mb-3 text-sm">
                  <span className="text-orange-500">$</span> select_category --list
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-2 text-xs border transition-all ${
                        selectedCategory === cat.id
                          ? 'border-neonGreen bg-neonGreen/20 text-neonGreen'
                          : 'border-gray-600 text-gray-400 hover:border-orange-500 hover:text-orange-500'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Selection */}
              <div>
                <p className="text-green-400 mb-3 text-sm">
                  <span className="text-orange-500">$</span> set_difficulty --level
                </p>
                <div className="flex gap-3">
                  {DIFFICULTIES.map(diff => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`px-6 py-2 border uppercase text-sm transition-all ${
                        selectedDifficulty === diff
                          ? diff === 'easy' 
                            ? 'border-green-500 bg-green-500/20 text-green-400'
                            : diff === 'medium'
                              ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                              : 'border-red-500 bg-red-500/20 text-red-400'
                          : 'border-gray-600 text-gray-400 hover:border-orange-500'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div>
                <p className="text-green-400 mb-3 text-sm">
                  <span className="text-orange-500">$</span> set_questions --count
                </p>
                <div className="flex gap-3">
                  {[5, 10, 15, 20].map(count => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`px-6 py-2 border text-sm transition-all ${
                        questionCount === count
                          ? 'border-neonGreen bg-neonGreen/20 text-neonGreen'
                          : 'border-gray-600 text-gray-400 hover:border-orange-500'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hangman Preview */}
              <div className="border border-gray-700 bg-black/50 p-4">
                <p className="text-gray-500 text-xs mb-2">HANGMAN PREVIEW:</p>
                <pre className="text-neonGreen text-xs leading-tight whitespace-pre">{HANGMAN_STAGES[0]}</pre>
                <p className="text-gray-500 text-xs mt-2">
                  Wrong answers allowed: {MAX_WRONG} — exceed limit = game over
                </p>
              </div>

              {/* Start Button */}
              <button
                onClick={fetchQuestions}
                disabled={isLoading}
                className="w-full px-6 py-4 bg-gray-800 border-2 border-orange-500 text-orange-500 font-mono hover:bg-orange-500 hover:text-black transition-all duration-300 group disabled:opacity-50"
              >
                {isLoading ? (
                  <span><span className="text-neonGreen">$</span> loading...</span>
                ) : (
                  <span><span className="text-neonGreen group-hover:text-black">$</span> ./start_trivia.sh</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Scanline effect */}
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)'
        }}></div>
      </div>
    );
  }

  // Game over screen
  if (gameMode === 'gameover') {
    const percentage = questions.length > 0 ? (score / questions.length) * 100 : 0;
    const survived = wrongAnswers < MAX_WRONG;
    
    return (
      <div className="min-h-screen bg-black overflow-hidden">
        <div className="pt-20 pb-12 px-8 border-b border-neonGreen">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 lowercase">
            <span className="text-orange-500">&gt;</span> trivia terminal
          </h1>
          <p className="text-neonGreen text-sm md:text-base max-w-2xl">
            {survived ? 'session complete — you survived!' : 'session terminated — hanged!'}
          </p>
        </div>

        <div className="p-8">
          <div className="relative bg-gray-900 border-2 border-gray-700 max-w-4xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-transparent"></div>
            
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 text-gray-500 text-sm font-mono">trivia@terminal ~ results</span>
            </div>

            <div className="p-6 font-mono">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Results */}
                <div>
                  <p className="text-green-400 mb-4">
                    <span className="text-orange-500">$</span> cat ./results.log
                  </p>
                  
                  <div className="pl-4 border-l-2 border-neonGreen/30 space-y-4">
                    <div>
                      <p className={`text-2xl font-bold ${survived ? 'text-neonGreen' : 'text-red-500'}`}>
                        [{survived ? 'SURVIVED' : 'TERMINATED'}]
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {survived ? 'You made it through!' : 'Better luck next time...'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 text-sm">Final Score:</p>
                      <p className="text-3xl text-orange-500">{score}<span className="text-gray-500 text-lg">/{questions.length}</span></p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 text-sm">Accuracy:</p>
                      <div className="w-full bg-gray-800 h-3 border border-gray-600 mt-1">
                        <div 
                          className="h-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: percentage >= 70 ? '#39ff14' : percentage >= 50 ? '#F97316' : '#ef4444'
                          }}
                        ></div>
                      </div>
                      <p className="text-gray-400 text-xs mt-1">{percentage.toFixed(0)}%</p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm">Wrong Answers:</p>
                      <p className={`text-xl ${wrongAnswers >= MAX_WRONG ? 'text-red-500' : 'text-yellow-500'}`}>
                        {wrongAnswers}/{MAX_WRONG}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Final Hangman State */}
                <div className="border border-gray-700 bg-black/50 p-4">
                  <p className="text-gray-500 text-xs mb-2">FINAL STATE:</p>
                  <pre className={`text-xs leading-tight whitespace-pre ${wrongAnswers >= MAX_WRONG ? 'text-red-500' : 'text-neonGreen'}`}>
                    {HANGMAN_STAGES[Math.min(wrongAnswers, MAX_WRONG)]}
                  </pre>
                </div>
              </div>

              <button
                onClick={restartGame}
                className="mt-8 px-6 py-3 bg-gray-800 border-2 border-orange-500 text-orange-500 font-mono hover:bg-orange-500 hover:text-black transition-all duration-300 group"
              >
                <span className="text-neonGreen group-hover:text-black">$</span> ./new_game.sh
              </button>
            </div>
          </div>
        </div>

        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)'
        }}></div>
      </div>
    );
  }

  // Playing screen
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-neonGreen font-mono">Loading...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <div className="pt-20 pb-12 px-8 border-b border-neonGreen">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 lowercase">
          <span className="text-orange-500">&gt;</span> trivia terminal
        </h1>
        <p className="text-neonGreen text-sm md:text-base max-w-2xl">
          {CATEGORIES.find(c => c.id === selectedCategory)?.name} — {selectedDifficulty} mode
        </p>
      </div>

      <div className="p-8">
        <div className="relative bg-gray-900 border-2 border-gray-700 max-w-5xl transition-all duration-300 hover:border-orange-500">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-1 h-full bg-gradient-to-b from-neonGreen via-neonGreen to-transparent opacity-30"></div>
          
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 text-gray-500 text-xs font-mono">trivia@terminal ~ q{currentQuestionIndex + 1}</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-gray-500">score: <span className="text-neonGreen">{score}</span></span>
              <span className="text-gray-500">lives: <span className={wrongAnswers >= 4 ? 'text-red-500' : 'text-orange-500'}>{MAX_WRONG - wrongAnswers}</span></span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-0">
            {/* Question Area - 2 cols */}
            <div className="md:col-span-2 p-6 font-mono md:border-r border-gray-700">
              {/* Progress */}
              <div className="flex items-center gap-1 mb-6">
                {Array.from({ length: questions.length }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 transition-all ${
                      i < currentQuestionIndex 
                        ? 'bg-neonGreen' 
                        : i === currentQuestionIndex 
                          ? 'bg-orange-500' 
                          : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>

              {/* Question */}
              <div className="mb-6">
                <p className="text-green-400 mb-2 text-sm">
                  <span className="text-orange-500">$</span> cat ./question_{currentQuestionIndex + 1}.txt
                </p>
                <div className="pl-4 border-l-2 border-neonGreen/30">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    {typedText}
                    {isTyping && <span className="blinking-cursor text-green-400">|</span>}
                  </p>
                </div>
              </div>

              {/* Answer Options */}
              <div className="space-y-2">
                <p className="text-gray-500 text-xs mb-3">
                  <span className="text-orange-500">$</span> select_answer
                </p>
                {shuffledAnswers.map((answer, index) => {
                  const isCorrect = answer === currentQuestion.correctAnswer;
                  const isSelected = selectedAnswer === answer;
                  
                  let buttonClass = 'border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500';
                  
                  if (showAnswer) {
                    if (isCorrect) {
                      buttonClass = 'border-green-500 bg-green-500/20 text-green-400';
                    } else if (isSelected && !isCorrect) {
                      buttonClass = 'border-red-500 bg-red-500/20 text-red-400';
                    } else {
                      buttonClass = 'border-gray-700 text-gray-600';
                    }
                  }
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(answer)}
                      disabled={isTyping || showAnswer}
                      className={`w-full text-left px-4 py-3 border transition-all font-mono text-sm ${buttonClass} ${
                        isTyping ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <span className="text-orange-500 mr-2">[{String.fromCharCode(65 + index)}]</span>
                      {answer}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hangman Area - 1 col */}
            <div className="p-4 bg-black/30 flex flex-col items-center justify-center">
              <p className="text-gray-500 text-xs mb-2 font-mono">SYSTEM STATUS</p>
              <pre className={`text-xs leading-tight font-mono whitespace-pre ${
                wrongAnswers >= MAX_WRONG ? 'text-red-500' : 
                wrongAnswers >= 4 ? 'text-orange-500' : 
                'text-neonGreen'
              }`}>
                {HANGMAN_STAGES[Math.min(wrongAnswers, MAX_WRONG)]}
              </pre>
              <div className="mt-4 flex gap-1">
                {Array.from({ length: MAX_WRONG }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 border ${
                      i < wrongAnswers 
                        ? 'bg-red-500 border-red-400' 
                        : 'bg-gray-800 border-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-gray-800/50 border-t border-gray-700 flex items-center justify-between">
            <span className="text-gray-600 text-xs font-mono">
              category: <span className="text-orange-500">{currentQuestion.category.replace(/_/g, ' ')}</span>
            </span>
            <span className="text-gray-600 text-xs font-mono">
              difficulty: <span className={
                selectedDifficulty === 'easy' ? 'text-green-500' :
                selectedDifficulty === 'medium' ? 'text-yellow-500' : 'text-red-500'
              }>{selectedDifficulty}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)'
      }}></div>
    </div>
  );
};

export default TriviaGame;
