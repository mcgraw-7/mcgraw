'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Three.js
const AsteroidsGame = dynamic(() => import('../app/components/asteroids'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="h-screen bg-black overflow-hidden flex items-center p-8 relative">
      {/* Asteroids Game Background */}
      <AsteroidsGame />
      
      {/* Main Terminal Interface */}
      <div className="relative bg-gray-900 border-2 border-gray-700 max-w-4xl w-full h-[calc(100vh-64px)] transition-all duration-300 hover:border-orange-500 flex flex-col z-10">
        {/* Accent bars */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-1 h-full bg-gradient-to-b from-neonGreen via-neonGreen to-transparent opacity-30"></div>
        
        {/* Terminal Header Bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-pointer"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer"></div>
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
          <span className="text-gray-600 text-xs font-mono">v1.0.0</span>
        </div>
      </div>

      {/* Scanline effect overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)'
      }}></div>
    </main>
  );
}
