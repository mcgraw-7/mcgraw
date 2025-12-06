'use client';
import React, { useEffect, useState, useRef } from 'react';

interface Question {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

const TriviaGame: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [mouseEnabled, setMouseEnabled] = useState(false);
  const [showAward, setShowAward] = useState(false);
  const [lightColors, setLightColors] = useState<Array<'red' | 'yellow' | 'green'>>(Array(10).fill('yellow'));
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const trueButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      const response = await fetch('https://opentdb.com/api.php?amount=10&category=18&difficulty=medium&type=boolean');
      const data = await response.json();
      setQuestions(data.results);
    };

    fetchQuestions();
  }, []);

  // Typewriter effect for questions
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const text = questions[currentQuestionIndex].question.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
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
      }, 30);
      return () => clearInterval(timer);
    }
  }, [currentQuestionIndex, questions]);

  useEffect(() => {
    if (!showAnswer && trueButtonRef.current && !isTyping) {
      trueButtonRef.current.focus();
    }
  }, [showAnswer, currentQuestionIndex, isTyping]);

  const handleAnswer = (answer: string, event?: React.MouseEvent) => {
    if (isTyping) return;
    
    setUserAnswer(answer);
    setShowAnswer(true);
    const newLightColors = [...lightColors];
    if (answer === questions[currentQuestionIndex].correct_answer) {
      setScore(score + 1);
      newLightColors[currentQuestionIndex] = 'green';
    } else {
      newLightColors[currentQuestionIndex] = 'red';
    }
    setLightColors(newLightColors);
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const handleWarningAnswer = (year: number) => {
    if (year === 1983) {
      setMouseEnabled(true);
      setWarning(null);
      setShowAward(true);
      setTimeout(() => setShowAward(false), 3000);
    } else {
      setWarning('Incorrect. Please select the correct year.');
      setTimeout(() => setWarning(null), 3000);
    }
  };

  const nextQuestion = () => {
    setShowAnswer(false);
    setUserAnswer(null);
    setSelectedAnswer(null);
    setWarning(null);
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  const restartGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowAnswer(false);
    setUserAnswer(null);
    setSelectedAnswer(null);
    setLightColors(Array(10).fill('yellow'));
  };

  // Loading state with terminal style
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-black overflow-hidden">
        <div className="pt-20 pb-12 px-8 border-b border-neonGreen">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 lowercase">
            <span className="text-orange-500">&gt;</span> trivia terminal
          </h1>
        </div>
        <div className="p-8">
          <div className="relative bg-gray-900 border-2 border-gray-700 p-8 max-w-4xl mx-auto">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-transparent"></div>
            <div className="font-mono text-green-400">
              <span className="text-orange-500">$</span> initializing trivia database...
              <span className="blinking-cursor">|</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game over state with terminal style
  if (currentQuestionIndex >= questions.length) {
    const percentage = (score / questions.length) * 100;
    return (
      <div className="min-h-screen bg-black overflow-hidden">
        <div className="pt-20 pb-12 px-8 border-b border-neonGreen">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 lowercase">
            <span className="text-orange-500">&gt;</span> trivia terminal
          </h1>
          <p className="text-neonGreen text-sm md:text-base max-w-2xl">
            session complete — results compiled
          </p>
        </div>
        
        <div className="p-8">
          <div className="relative bg-gray-900 border-2 border-gray-700 p-8 max-w-4xl mx-auto">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-1 h-full bg-gradient-to-b from-neonGreen via-neonGreen to-transparent opacity-30"></div>
            
            {/* Terminal Header */}
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-700">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 text-gray-500 text-sm font-mono">trivia@terminal ~ results</span>
            </div>

            <div className="font-mono space-y-4">
              <p className="text-green-400">
                <span className="text-orange-500">$</span> cat ./results.log
              </p>
              <div className="pl-4 border-l-2 border-green-500/30">
                <p className="text-2xl md:text-3xl font-bold text-white mb-2">
                  <span className="text-neonGreen">[</span> GAME OVER <span className="text-neonGreen">]</span>
                </p>
                <p className="text-gray-300 mb-4">
                  final score: <span className="text-orange-500 text-xl">{score}</span> / <span className="text-gray-500">{questions.length}</span>
                </p>
                <div className="w-full bg-gray-800 h-4 rounded-none border border-gray-600 mb-4">
                  <div 
                    className="h-full transition-all duration-500"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: percentage >= 70 ? '#39ff14' : percentage >= 50 ? '#F97316' : '#ef4444'
                    }}
                  ></div>
                </div>
                <p className="text-gray-400 text-sm">
                  accuracy: {percentage.toFixed(0)}% — {percentage >= 70 ? 'excellent performance' : percentage >= 50 ? 'acceptable results' : 'needs improvement'}
                </p>
              </div>
              
              {/* Result indicators */}
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-700">
                {lightColors.map((color, index) => (
                  <div
                    key={index}
                    className={`w-6 h-6 rounded-sm border-2 transition-all ${
                      color === 'green' ? 'bg-green-500/80 border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                      color === 'red' ? 'bg-red-500/80 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                      'bg-gray-700 border-gray-600'
                    }`}
                  ></div>
                ))}
              </div>

              <button 
                onClick={restartGame}
                className="mt-8 px-6 py-3 bg-gray-800 border-2 border-orange-500 text-orange-500 font-mono hover:bg-orange-500 hover:text-black transition-all duration-300 group"
              >
                <span className="text-neonGreen group-hover:text-black">$</span> ./restart_game.sh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Header Section - matches work page */}
      <div className="pt-20 pb-12 px-8 border-b border-neonGreen">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 lowercase">
          <span className="text-orange-500">&gt;</span> trivia terminal
        </h1>
        <p className="text-neonGreen text-sm md:text-base max-w-2xl">
          computer science trivia — test your knowledge in terminal mode
        </p>
      </div>

      {/* Main Terminal Interface */}
      <div className="p-8">
        <div className="relative bg-gray-900 border-2 border-gray-700 max-w-4xl mx-auto transition-all duration-300 hover:border-orange-500">
          {/* Accent bars */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-1 h-full bg-gradient-to-b from-neonGreen via-neonGreen to-transparent opacity-30"></div>
          
          {/* Terminal Header Bar */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-pointer"></div>
              <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer"></div>
              <span className="ml-4 text-gray-500 text-xs font-mono">trivia@terminal ~ question_{currentQuestionIndex + 1}</span>
            </div>
            <div className="text-gray-500 text-xs font-mono">
              score: <span className="text-orange-500">{score}</span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 py-4 border-b border-gray-700/50">
            <div className="flex items-center gap-2">
              {lightColors.map((color, index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-sm border transition-all duration-300 ${
                    index === currentQuestionIndex 
                      ? 'border-orange-500 bg-orange-500/30 scale-110' 
                      : color === 'green' 
                        ? 'bg-green-500/80 border-green-400 shadow-[0_0_8px_rgba(34,197,94,0.4)]' 
                        : color === 'red' 
                          ? 'bg-red-500/80 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]' 
                          : 'bg-gray-700 border-gray-600'
                  }`}
                ></div>
              ))}
              <span className="ml-auto text-gray-500 text-xs font-mono">
                <span className="text-neonGreen">[</span> {currentQuestionIndex + 1} / {questions.length} <span className="text-neonGreen">]</span>
              </span>
            </div>
          </div>

          {/* Terminal Content */}
          <div className="p-6 font-mono">
            {/* Command prompt */}
            <div className="text-green-400 mb-2 text-sm">
              <span className="text-orange-500">$</span> cat ./questions/q{currentQuestionIndex + 1}.txt
            </div>

            {/* Question display with typewriter effect */}
            <div className="pl-4 border-l-2 border-neonGreen/30 mb-8">
              <p className="text-gray-300 text-lg md:text-xl leading-relaxed">
                {typedText}
                {isTyping && <span className="blinking-cursor text-green-400">|</span>}
              </p>
            </div>

            {warning && (
              <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10">
                <p className="text-red-400 text-sm">
                  <span className="text-red-500">[ERROR]</span> {warning}
                </p>
                <div className="flex gap-3 mt-3">
                  <button className="px-4 py-2 bg-gray-800 border border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500 transition-colors font-mono text-sm" onClick={() => handleWarningAnswer(1977)}>1977</button>
                  <button className="px-4 py-2 bg-gray-800 border border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500 transition-colors font-mono text-sm" onClick={() => handleWarningAnswer(1980)}>1980</button>
                  <button className="px-4 py-2 bg-gray-800 border border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500 transition-colors font-mono text-sm" onClick={() => handleWarningAnswer(1983)}>1983</button>
                </div>
              </div>
            )}

            {showAward && (
              <div className="mb-6 p-4 border border-green-500/50 bg-green-500/10">
                <p className="text-green-400 text-sm">
                  <span className="text-green-500">[ACHIEVEMENT UNLOCKED]</span> Mouse input enabled
                </p>
              </div>
            )}

            {/* Answer Section */}
            {!showAnswer ? (
              <div className="space-y-4">
                <div className="text-gray-500 text-sm mb-4">
                  <span className="text-orange-500">$</span> select_answer --options
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    ref={trueButtonRef}
                    disabled={isTyping}
                    className={`group relative flex-1 px-8 py-4 bg-gray-800 border-2 border-gray-600 text-white font-mono text-lg transition-all duration-300 ${
                      isTyping 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:border-green-500 hover:text-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                    } ${selectedAnswer === 'True' ? 'border-green-500 text-green-400' : ''}`}
                    onClick={(event) => handleAnswer('True', event)}
                  >
                    <span className="text-neonGreen opacity-50 group-hover:opacity-100">&gt;</span> TRUE
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 group-hover:w-full transition-all duration-300"></div>
                  </button>
                  <button
                    disabled={isTyping}
                    className={`group relative flex-1 px-8 py-4 bg-gray-800 border-2 border-gray-600 text-white font-mono text-lg transition-all duration-300 ${
                      isTyping 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:border-red-500 hover:text-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                    } ${selectedAnswer === 'False' ? 'border-red-500 text-red-400' : ''}`}
                    onClick={(event) => handleAnswer('False', event)}
                  >
                    <span className="text-neonGreen opacity-50 group-hover:opacity-100">&gt;</span> FALSE
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 group-hover:w-full transition-all duration-300"></div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 border-2 ${
                  userAnswer === currentQuestion.correct_answer 
                    ? 'border-green-500/50 bg-green-500/10' 
                    : 'border-red-500/50 bg-red-500/10'
                }`}>
                  <p className={`text-lg font-bold mb-2 ${
                    userAnswer === currentQuestion.correct_answer ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {userAnswer === currentQuestion.correct_answer 
                      ? '[SUCCESS] Correct!' 
                      : '[FAILED] Incorrect!'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    expected output: <span className="text-orange-500">{currentQuestion.correct_answer}</span>
                  </p>
                </div>
                <div className="text-gray-500 text-sm animate-pulse">
                  <span className="text-orange-500">$</span> loading next question...
                </div>
              </div>
            )}
          </div>

          {/* Terminal Footer */}
          <div className="px-6 py-3 bg-gray-800/50 border-t border-gray-700 flex items-center justify-between">
            <span className="text-gray-600 text-xs font-mono">press button to submit answer</span>
            <span className="text-gray-600 text-xs font-mono">difficulty: <span className="text-orange-500">medium</span></span>
          </div>
        </div>
      </div>

      {/* Scanline effect overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)'
      }}></div>
    </div>
  );
};

export default TriviaGame;
