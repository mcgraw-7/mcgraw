'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Three.js
const AsteroidsGame = dynamic(() => import('../app/components/asteroids'), {
  ssr: false,
});

interface Point {
  x: number;
  y: number;
}

export default function Home() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [showUnlockEffect, setShowUnlockEffect] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPath, setDrawPath] = useState<Point[]>([]);
  const [showDrawHint, setShowDrawHint] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Detect if drawn shape matches "K" or "e" pattern
  const detectLetter = useCallback((points: Point[]): 'K' | 'e' | null => {
    if (points.length < 10) return null;

    // Get bounding box
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = maxX - minX;
    const height = maxY - minY;

    // Get screen size for 25% check
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const minSize = Math.min(screenWidth, screenHeight) * 0.25;

    // Must be at least 25% of screen
    if (width < minSize && height < minSize) {
      console.log('Drawing too small:', { width, height, minSize });
      return null;
    }

    // Normalize points to 0-1 range
    const normalized = points.map(p => ({
      x: width > 0 ? (p.x - minX) / width : 0.5,
      y: height > 0 ? (p.y - minY) / height : 0.5,
    }));

    // Analyze the shape
    const aspectRatio = width / (height || 1);
    
    // Check for "K" pattern: vertical line on left + two diagonal strokes
    // K has: left edge activity, diagonal movement from middle
    let leftEdgePoints = 0;
    let rightSidePoints = 0;
    let topRightPoints = 0;
    let bottomRightPoints = 0;
    
    for (const p of normalized) {
      if (p.x < 0.3) leftEdgePoints++;
      if (p.x > 0.5) rightSidePoints++;
      if (p.x > 0.5 && p.y < 0.5) topRightPoints++;
      if (p.x > 0.5 && p.y > 0.5) bottomRightPoints++;
    }
    
    const leftRatio = leftEdgePoints / normalized.length;
    const topRightRatio = topRightPoints / normalized.length;
    const bottomRightRatio = bottomRightPoints / normalized.length;
    
    // K detection: significant left edge + both diagonal regions
    if (leftRatio > 0.25 && topRightRatio > 0.1 && bottomRightRatio > 0.1 && aspectRatio > 0.4) {
      console.log('Detected K!', { leftRatio, topRightRatio, bottomRightRatio, aspectRatio });
      return 'K';
    }

    // Check for "e" pattern: circular with horizontal line through middle
    // e has: loop/curve pattern, points spread across middle
    let middleYPoints = 0;
    let topPoints = 0;
    let bottomPoints = 0;
    
    for (const p of normalized) {
      if (p.y > 0.35 && p.y < 0.65) middleYPoints++;
      if (p.y < 0.4) topPoints++;
      if (p.y > 0.6) bottomPoints++;
    }
    
    const middleRatio = middleYPoints / normalized.length;
    const topRatio = topPoints / normalized.length;
    const bottomRatio = bottomPoints / normalized.length;
    
    // Calculate "circularity" - does the path loop back?
    const firstPoint = normalized[0];
    const lastPoint = normalized[normalized.length - 1];
    const startEndDistance = Math.sqrt(
      Math.pow(lastPoint.x - firstPoint.x, 2) + 
      Math.pow(lastPoint.y - firstPoint.y, 2)
    );
    
    // e detection: has curve (returns near start or middle-heavy), wider than tall or square
    const hasLoop = startEndDistance < 0.5 || middleRatio > 0.25;
    const hasGoodSpread = topRatio > 0.15 && bottomRatio > 0.15;
    
    if (hasLoop && hasGoodSpread && aspectRatio > 0.5 && aspectRatio < 2) {
      console.log('Detected e!', { middleRatio, startEndDistance, hasLoop, aspectRatio });
      return 'e';
    }

    console.log('No match:', { leftRatio, middleRatio, aspectRatio, startEndDistance });
    return null;
  }, []);

  // Handle successful unlock
  const triggerUnlock = useCallback(() => {
    setShowUnlockEffect(true);
    setTimeout(() => {
      router.push('/christmas-adventure');
    }, 1500);
  }, [router]);

  // Drawing handlers
  const startDrawing = useCallback((x: number, y: number) => {
    setIsDrawing(true);
    setDrawPath([{ x, y }]);
    setShowDrawHint(true);
    
    // Clear any existing timeout
    if (drawTimeoutRef.current) {
      clearTimeout(drawTimeoutRef.current);
    }
  }, []);

  const continueDrawing = useCallback((x: number, y: number) => {
    if (!isDrawing) return;
    setDrawPath(prev => [...prev, { x, y }]);
  }, [isDrawing]);

  const endDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Check if the drawn shape matches
    const letter = detectLetter(drawPath);
    if (letter) {
      triggerUnlock();
    }
    
    // Clear the path after a short delay
    drawTimeoutRef.current = setTimeout(() => {
      setDrawPath([]);
      setShowDrawHint(false);
    }, 500);
  }, [isDrawing, drawPath, detectLetter, triggerUnlock]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startDrawing(touch.clientX, touch.clientY);
  }, [startDrawing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    continueDrawing(touch.clientX, touch.clientY);
  }, [continueDrawing]);

  const handleTouchEnd = useCallback(() => {
    endDrawing();
  }, [endDrawing]);

  // Mouse event handlers (for testing on desktop)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    startDrawing(e.clientX, e.clientY);
  }, [startDrawing]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    continueDrawing(e.clientX, e.clientY);
  }, [continueDrawing]);

  const handleMouseUp = useCallback(() => {
    endDrawing();
  }, [endDrawing]);

  // Draw the path on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the path
    if (drawPath.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(57, 255, 20, 0.5)'; // neonGreen with transparency
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(drawPath[0].x, drawPath[0].y);
      for (let i = 1; i < drawPath.length; i++) {
        ctx.lineTo(drawPath[i].x, drawPath[i].y);
      }
      ctx.stroke();
    }
  }, [drawPath]);

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
      if (drawTimeoutRef.current) {
        clearTimeout(drawTimeoutRef.current);
      }
    };
  }, []);

  return (
    <main 
      className="h-screen bg-black overflow-hidden flex items-center justify-center p-8 relative touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Drawing canvas overlay */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[60] pointer-events-none"
      />

      {/* Draw hint */}
      {showDrawHint && isDrawing && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] bg-black/80 px-4 py-2 rounded-full text-green-400 text-sm font-mono animate-pulse">
          Drawing...
        </div>
      )}

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
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-4 text-gray-500 text-xs font-mono">mcgraw@portfolio ~ home</span>
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
                mcgraw.io software studio
              </p>
              <p className="text-neonGreen text-sm">
                &amp; sr. software engineer @boozallen
              </p>
            </div>

            {/* Section 1: Current Role */}
            <div className="text-green-400 mb-2 text-sm">
              <span className="text-orange-500">$</span> cat ~/mcgraw-io/company-profile.txt
            </div>
            <div className="pl-4 border-l-2 border-neonGreen/30 mb-8">
              <p className="text-gray-300 leading-relaxed">
                <span className="text-orange-500 font-semibold">mcgraw.io</span> builds custom software, automation systems, and AI-assisted workflows for small and midsize businesses. Core delivery includes product design, full-stack web apps, systems integrations, and operational tooling that reduce manual work and increase conversion speed. Primary stack includes <span className="text-white">TypeScript</span>, <span className="text-white">React/Next.js</span>, <span className="text-white">Node.js</span>, <span className="text-white">Python</span>, <span className="text-white">SQL</span>, <span className="text-white">Docker</span>, <span className="text-white">GitHub</span>, and <span className="text-white">CI/CD automation</span>.
              </p>
            </div>

            {/* Section 2: Side Projects Header */}
            <div className="text-green-400 mb-2 text-sm">
              <span className="text-orange-500">$</span> cat ~/side-projects/README.txt
            </div>
            <div className="pl-4 border-l-2 border-orange-500/30 mb-4">
              <p className="text-gray-400 text-sm italic">
                Product and platform initiatives developed to improve accessibility, reliability, and automation outcomes for real client workflows.
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

            {/* Section 4: VA Acronyms Extension */}
            <div className="text-green-400 mb-2 text-sm">
              <span className="text-orange-500">$</span> cat ~/products/va-acronyms-extension.txt
            </div>
            <div className="pl-4 border-l-2 border-neonGreen/30 mb-8">
              <p className="text-gray-300 leading-relaxed">
                <span className="text-orange-500 font-semibold">VA Acronyms</span> <span className="text-gray-500 text-xs">[VS Code extension]</span> — Developer productivity extension for VA projects that expands and explains common acronyms inline while coding. It reduces context switching for onboarding and daily delivery work by surfacing domain-specific terminology directly in the editor.
              </p>
            </div>

            {/* Section 5: AI Piloted Spaceship */}
            <div className="text-green-400 mb-2 text-sm">
              <span className="text-orange-500">$</span> cat ~/experiments/ai-piloted-spaceship.txt
            </div>
            <div className="pl-4 border-l-2 border-neonGreen/30 mb-8">
              <p className="text-gray-300 leading-relaxed">
                <span className="text-orange-500 font-semibold">AI-piloted spaceship demo</span> <span className="text-gray-500 text-xs">[interactive feature]</span> — The ship flying around this homepage is part of a real-time browser simulation focused on responsive controls, collision behavior, and dynamic scene updates. It demonstrates practical front-end engineering for interactive products, including game-loop logic, state management, and performance-aware rendering patterns.
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
                <Link href="/automate" className="text-gray-300 hover:text-orange-500 transition-colors">
                  <span className="text-neonGreen">→</span> automate/
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
