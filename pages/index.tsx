'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Three.js
const AsteroidsGame = dynamic(() => import('../app/components/asteroids'), {
  ssr: false,
});

// Secret sequence: YELLOW YELLOW YELLOW GREEN YELLOW
const SECRET_SEQUENCE = ['yellow', 'yellow', 'yellow', 'green', 'yellow'];

export default function Home() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [buttonSequence, setButtonSequence] = useState<string[]>([]);
  const [showUnlockEffect, setShowUnlockEffect] = useState(false);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Check if sequence matches the secret
  const checkSequence = useCallback((newSequence: string[]) => {
    // Check if current sequence matches the beginning of secret
    const matches = newSequence.every((color, index) => color === SECRET_SEQUENCE[index]);
    
    if (!matches) {
      // Wrong sequence - reset
      setButtonSequence([]);
      return;
    }
    
    // Check if complete sequence entered
    if (newSequence.length === SECRET_SEQUENCE.length) {
      // SUCCESS! Trigger unlock
      setShowUnlockEffect(true);
      setTimeout(() => {
        router.push('/christmas-adventure');
      }, 1500);
    }
  }, [router]);

  const handleButtonClick = useCallback((color: 'red' | 'yellow' | 'green') => {
    // Red button still closes terminal
    if (color === 'red') {
      return; // Let the original handler deal with this
    }
    
    // Clear any existing timeout
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
    }
    
    // Add to sequence
    const newSequence = [...buttonSequence, color];
    setButtonSequence(newSequence);
    checkSequence(newSequence);
    
    // Reset sequence after 3 seconds of inactivity
    sequenceTimeoutRef.current = setTimeout(() => {
      setButtonSequence([]);
    }, 3000);
  }, [buttonSequence, checkSequence]);

  const handleCloseTerminal = useCallback(() => {
    if (!isTerminalOpen || isClosing) return;
    setIsClosing(true);
    // After animation completes, hide terminal
    setTimeout(() => {
      setIsTerminalOpen(false);
      setIsClosing(false);
    }, 400);
  }, [isTerminalOpen, isClosing]);

  const handleOpenTerminal = useCallback(() => {
    if (isTerminalOpen) return;
    setIsTerminalOpen(true);
  }, [isTerminalOpen]);

  // Handle ⌘+K (close) and ⌘+T (open) terminal hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Don't trigger when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // ⌘/Ctrl + K : Close terminal
      if (modifier && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleCloseTerminal();
        return;
      }

      // ⌘/Ctrl + T : Open terminal
      if (modifier && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleOpenTerminal();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCloseTerminal, handleOpenTerminal]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <main className="h-screen bg-black overflow-hidden flex items-center justify-center p-8 relative">
      {/* Asteroids Game Background - only enable collision when terminal is closed */}
      <AsteroidsGame isPlaying={!isTerminalOpen} />
      
      {/* CRT Turn-off animation styles */}
      <style jsx>{`
        @keyframes crt-off {
          0% {
            transform: scale(1, 1);
            filter: brightness(1);
          }
          50% {
            transform: scale(1, 0.005);
            filter: brightness(2);
          }
          100% {
            transform: scale(0, 0);
            filter: brightness(0);
          }
        }
        
        @keyframes crt-on {
          0% {
            transform: scale(0, 0.005);
            filter: brightness(2);
          }
          50% {
            transform: scale(1, 0.005);
            filter: brightness(2);
          }
          100% {
            transform: scale(1, 1);
            filter: brightness(1);
          }
        }
        
        .crt-closing {
          animation: crt-off 0.4s ease-in forwards;
          transform-origin: center center;
        }
        
        .crt-opening {
          animation: crt-on 0.4s ease-out forwards;
          transform-origin: center center;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 10px 2px rgba(57, 255, 20, 0.6), 0 0 20px 4px rgba(57, 255, 20, 0.3);
          }
          50% {
            box-shadow: 0 0 15px 4px rgba(57, 255, 20, 0.8), 0 0 30px 8px rgba(57, 255, 20, 0.4);
          }
        }
        
        .reopen-dot {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes unlock-flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }

        @keyframes snowfall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }

        .unlock-overlay {
          animation: unlock-flash 0.3s ease-in-out 3;
        }

        .snowflake {
          animation: snowfall linear forwards;
        }
      `}</style>

      {/* Secret Unlock Effect */}
      {showUnlockEffect && (
        <>
          {/* Flash overlay */}
          <div className="unlock-overlay fixed inset-0 bg-green-500 z-[100] pointer-events-none" />
          
          {/* Snowflakes */}
          <div className="fixed inset-0 z-[99] pointer-events-none overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="snowflake absolute text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDuration: `${1 + Math.random() * 2}s`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              >
                ❄️
              </div>
            ))}
          </div>

          {/* Message */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none">
            <div className="text-center animate-bounce">
              <div className="text-6xl mb-4">🎄🎅🎁</div>
              <h2 className="text-4xl font-bold text-white drop-shadow-lg">
                Secret Unlocked!
              </h2>
              <p className="text-xl text-green-300 mt-2">Loading Christmas Adventure...</p>
            </div>
          </div>
        </>
      )}
      
      {/* Reopen dot - shown when terminal is closed */}
      {!isTerminalOpen && (
        <button
          onClick={handleOpenTerminal}
          className="reopen-dot w-4 h-4 rounded-full bg-neonGreen cursor-pointer z-20 hover:scale-150 transition-transform duration-200"
          title="Click to reopen terminal"
        />
      )}
      
      {/* Main Terminal Interface */}
      {isTerminalOpen && (
        <div className={`relative bg-gray-900 border-2 border-gray-700 max-w-4xl w-full h-[calc(100vh-64px)] transition-all duration-300 hover:border-orange-500 flex flex-col z-10 ${isClosing ? 'crt-closing' : 'crt-opening'}`}>
          {/* Accent bars */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-1 h-full bg-gradient-to-b from-neonGreen via-neonGreen to-transparent opacity-30"></div>
        
        {/* Terminal Header Bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
          <button 
            onClick={handleCloseTerminal}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer hover:scale-110"
            title="Close terminal"
          />
          <button 
            onClick={() => handleButtonClick('yellow')}
            className={`w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-all cursor-pointer ${
              buttonSequence.length > 0 ? 'ring-2 ring-yellow-300 ring-opacity-50' : ''
            }`}
            title="Yellow"
          />
          <button 
            onClick={() => handleButtonClick('green')}
            className={`w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-all cursor-pointer ${
              buttonSequence.length > 0 ? 'ring-2 ring-green-300 ring-opacity-50' : ''
            }`}
            title="Green"
          />
          <span className="ml-4 text-gray-500 text-xs font-mono">mcgraw@portfolio ~ home</span>
          
          {/* Secret hint - shows progress subtly */}
          {buttonSequence.length > 0 && buttonSequence.length < SECRET_SEQUENCE.length && (
            <span className="ml-auto text-gray-600 text-xs">
              {'🎄'.repeat(buttonSequence.length)}
            </span>
          )}
        </div>

        {/* Terminal Content - Scrollable */}
        <div className="p-6 font-mono overflow-y-auto flex-1">
          {/* Name/Title */}
          <div className="text-green-400 mb-2 text-sm">
            <span className="text-orange-500">$</span> whoami
          </div>
          <div className="pl-4 border-l-2 border-neonGreen/30 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 lowercase">
              m.mcgraw
            </h1>
            <p className="text-neonGreen text-sm">
              software engineer @ booz allen hamilton
            </p>
          </div>

          {/* Section 1: Current Role */}
          <div className="text-green-400 mb-2 text-sm">
            <span className="text-orange-500">$</span> cat ~/booz-allen/current-role.txt
          </div>
          <div className="pl-4 border-l-2 border-neonGreen/30 mb-8">
            <p className="text-gray-300 leading-relaxed">
              Software Engineer at <span className="text-orange-500 font-semibold">Booz Allen Hamilton</span>, developing enterprise web applications for federal government clients. Tech stack includes <span className="text-white">Java</span>, <span className="text-white">JavaScript/jQuery</span>, <span className="text-white">React</span>, <span className="text-white">Python</span>, <span className="text-white">Shell scripting (Bash/Zsh)</span>, <span className="text-white">SQL</span>, <span className="text-white">WebLogic 12c/14</span>, <span className="text-white">JSP</span>, <span className="text-white">CSS</span>, <span className="text-white">SAML/SSO</span>, <span className="text-white">Docker</span>, <span className="text-white">Git/GitHub</span>, <span className="text-white">Jenkins CI/CD</span>, and <span className="text-white">Maven</span>. Day-to-day work involves full-stack development, debugging production issues, writing automation scripts, and code archaeology through git history.
            </p>
          </div>

          {/* Section 2: Side Projects Header */}
          <div className="text-green-400 mb-2 text-sm">
            <span className="text-orange-500">$</span> cat ~/side-projects/README.txt
          </div>
          <div className="pl-4 border-l-2 border-orange-500/30 mb-4">
            <p className="text-gray-400 text-sm italic">
              Independent initiatives developed on personal time to solve real problems encountered at work.
            </p>
          </div>

          {/* Section 2: aiPat */}
          <div className="text-green-400 mb-2 text-sm">
            <span className="text-orange-500">$</span> cat ~/side-projects/aiPAT.txt
          </div>
          <div className="pl-4 border-l-2 border-neonGreen/30 mb-8">
            <p className="text-gray-300 leading-relaxed">
              <span className="text-orange-500 font-semibold">AI Powered Accessibility Tool</span> <span className="text-gray-500 text-xs">[solo project]</span> — Machine learning system for detecting WCAG heading structure violations. Built with <span className="text-white">Python</span>, <span className="text-white">FastAPI</span>, <span className="text-white">scikit-learn</span>, and <span className="text-white">BeautifulSoup</span>. Extracts 24+ DOM features to identify missing h1 tags, invalid hierarchy, empty headings, and non-semantic usage with {'>'}90% accuracy target. Designed for CI/CD integration, VS Code extensions, and browser-based analysis.
            </p>
          </div>

          {/* Section 3: Core Cracker */}
          <div className="text-green-400 mb-2 text-sm">
            <span className="text-orange-500">$</span> cat ~/side-projects/core-cracker.txt
          </div>
          <div className="pl-4 border-l-2 border-neonGreen/30 mb-8">
            <p className="text-gray-300 leading-relaxed">
              <span className="text-orange-500 font-semibold">Core Cracker</span> <span className="text-gray-500 text-xs">[solo project]</span> — Local development environment validation toolkit for VA enterprise applications on macOS ARM64. Automates verification of <span className="text-white">Zulu JDK 8</span>, <span className="text-white">WebLogic 12.2.1.4</span>, <span className="text-white">Maven</span>, and <span className="text-white">Docker/Colima</span> configurations. Includes auto-fix tools, properties backup/restore, and health diagnostics that map directly to the official VBMS Core deployment guide.
            </p>
          </div>

          {/* Skills section */}
          <div className="mb-8">
            <div className="text-green-400 mb-2 text-sm">
              <span className="text-orange-500">$</span> ls ./skills/
            </div>
            <div className="pl-4 flex flex-wrap gap-3 mt-3">
              {['Java', 'React', 'JavaScript', 'Python', 'SQL', 'Docker', 'Jenkins', 'Git', 'Bash/Zsh', 'WebLogic', 'Maven', 'JSP'].map((skill) => (
                <span 
                  key={skill}
                  className="px-3 py-1 bg-gray-800 border border-gray-600 text-gray-300 text-sm hover:border-orange-500 hover:text-orange-500 transition-colors cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="mb-8">
            <div className="text-green-400 mb-2 text-sm">
              <span className="text-orange-500">$</span> ls ./links/
            </div>
            <div className="pl-4 flex flex-wrap gap-4 mt-3">
              <Link href="/work" className="text-gray-300 hover:text-orange-500 transition-colors">
                <span className="text-neonGreen">→</span> work/
              </Link>
              <Link href="/more" className="text-gray-300 hover:text-orange-500 transition-colors">
                <span className="text-neonGreen">→</span> more/
              </Link>
              <a 
                href="https://github.com/mmcgraw73" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-orange-500 transition-colors"
              >
                <span className="text-neonGreen">→</span> github/
              </a>
              <a 
                href="https://linkedin.com/in/mmcgraw73" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-orange-500 transition-colors"
              >
                <span className="text-neonGreen">→</span> linkedin/
              </a>
            </div>
          </div>

          {/* Status section */}
          <div className="pt-6 border-t border-gray-700">
            <div className="text-green-400 mb-3 text-sm">
              <span className="text-orange-500">$</span> cat ./status.log
            </div>
            <div className="pl-4 space-y-2">
              <p className="text-orange-500 text-sm flex items-center gap-2">
                <span className="text-gray-500">[INFO]</span> this portfolio is currently being built with next.js &amp; typescript
              </p>
              <p className="text-orange-500 text-sm flex items-center gap-2">
                <span className="text-gray-500">[INFO]</span> check back often for additional content and updates
              </p>
              <a 
                href="https://github.com/mmcgraw73/mcgraw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-500 text-sm flex items-center gap-2 hover:text-neonGreen transition-colors group"
              >
                <span className="text-gray-500">[LINK]</span> 
                src @github 
                <span className="text-neonGreen opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="px-6 py-3 bg-gray-800/50 border-t border-gray-700 flex items-center justify-between flex-shrink-0">
          <span className="text-gray-600 text-xs font-mono">
            <span className="text-green-400">●</span> online
          </span>
          <span className="text-gray-600 text-xs font-mono flex items-center gap-4">
            <span className="hidden sm:inline text-gray-700 hover:text-gray-500 transition-colors cursor-help" title="Press ? for all hotkeys">
              press <kbd className="px-1 bg-gray-800 border border-gray-700 rounded text-[10px]">?</kbd> for help
            </span>
            <span>v1.0.0</span>
          </span>
        </div>
      </div>
      )}

      {/* Scanline effect overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)'
      }}></div>
    </main>
  );
}
