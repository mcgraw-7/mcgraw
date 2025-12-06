'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-black overflow-hidden">
      {/* Header Section */}
      <div className="pt-20 pb-12 px-8 border-b border-neonGreen">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 lowercase">
          <span className="text-orange-500">&gt;</span> m.mcgraw
        </h1>
        <p className="text-neonGreen text-sm md:text-base max-w-2xl">
          frontend engineer — crafting digital experiences
        </p>
      </div>

      {/* Main Terminal Interface */}
      <div className="p-8">
        <div className="relative bg-gray-900 border-2 border-gray-700 max-w-4xl transition-all duration-300 hover:border-orange-500">
          {/* Accent bars */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-1 h-full bg-gradient-to-b from-neonGreen via-neonGreen to-transparent opacity-30"></div>
          
          {/* Terminal Header Bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
            <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer"></div>
            <span className="ml-4 text-gray-500 text-xs font-mono">mcgraw@portfolio ~ about</span>
          </div>

          {/* Terminal Content */}
          <div className="p-6 font-mono">
            {/* Command prompt */}
            <div className="text-green-400 mb-2 text-sm">
              <span className="text-orange-500">$</span> cat ./about.txt
            </div>

            {/* Bio content */}
            <div className="pl-4 border-l-2 border-neonGreen/30 space-y-4">
              <p className="text-gray-300 leading-relaxed">
                As a Software Engineer at <span className="text-orange-500 font-semibold">Booz Allen Hamilton</span>, I develop and maintain enterprise web applications for federal government clients.
              </p>
              <p className="text-gray-300 leading-relaxed">
                My work spans a diverse range of technologies including <span className="text-white">Java</span>, <span className="text-white">JavaScript/jQuery</span>, <span className="text-white">React</span>, <span className="text-white">Python</span>, <span className="text-white">Shell scripting (Bash/Zsh)</span>, and <span className="text-white">SQL</span>.
              </p>
              <p className="text-gray-300 leading-relaxed">
                The enterprise stack includes <span className="text-white">WebLogic 12c/14 application servers</span>, <span className="text-white">JSP</span>, <span className="text-white">CSS</span>, <span className="text-white">SAML/SSO authentication</span>, and <span className="text-white">XML/WSDL-based service integrations</span>.
              </p>
              <p className="text-gray-300 leading-relaxed">
                I leverage <span className="text-white">Docker</span> for local development environments, <span className="text-white">Git/GitHub</span> for version control, <span className="text-white">Jenkins CI/CD pipelines</span> (with Fortify and CodeQL security scans), and <span className="text-white">Maven</span> for build management.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Day-to-day responsibilities include implementing <span className="text-white">front-end accessibility (Section 508 compliance)</span> with keyboard navigation and focus management, debugging production issues across multiple environments, writing automation scripts, tracing regressions through <span className="text-white">git history and code archaeology</span>, and responding to QA feedback cycles.
              </p>
            </div>

            {/* Skills section */}
            <div className="mt-8">
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

            {/* Status section */}
            <div className="mt-8 pt-6 border-t border-gray-700">
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
          <div className="px-6 py-3 bg-gray-800/50 border-t border-gray-700 flex items-center justify-between">
            <span className="text-gray-600 text-xs font-mono">
              <span className="text-green-400">●</span> online
            </span>
            <span className="text-gray-600 text-xs font-mono">v1.0.0</span>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl lowercase">
          <Link 
            href="/work"
            className="group relative cursor-pointer"
          >
            <div className="absolute inset-0 border-2 border-neonGreen opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="relative bg-gray-900 border-2 border-gray-700 p-6 transition-all duration-300 hover:border-orange-500 hover:bg-gray-800">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-transparent"></div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                <span className="text-neonGreen">&gt;</span> work experience
              </h3>
              <p className="text-gray-400 text-sm">explore my professional journey and projects</p>
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-700 group-hover:border-orange-500 transition-colors">
                <span className="text-xs text-gray-500">./work</span>
                <span className="text-orange-500 text-lg group-hover:translate-x-1 transition-transform duration-300">→</span>
              </div>
            </div>
          </Link>

          <Link 
            href="/more"
            className="group relative cursor-pointer"
          >
            <div className="absolute inset-0 border-2 border-neonGreen opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="relative bg-gray-900 border-2 border-gray-700 p-6 transition-all duration-300 hover:border-orange-500 hover:bg-gray-800">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-transparent"></div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                <span className="text-neonGreen">&gt;</span> trivia terminal
              </h3>
              <p className="text-gray-400 text-sm">test your computer science knowledge</p>
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-700 group-hover:border-orange-500 transition-colors">
                <span className="text-xs text-gray-500">./more</span>
                <span className="text-orange-500 text-lg group-hover:translate-x-1 transition-transform duration-300">→</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Scanline effect overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)'
      }}></div>
    </main>
  );
}
