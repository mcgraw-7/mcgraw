'use client';
import { useState, useEffect } from 'react';

interface HotkeyHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const HotkeyHelp = ({ isOpen, onClose }: HotkeyHelpProps) => {
  const [modKey, setModKey] = useState('⌘');

  useEffect(() => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    setModKey(isMac ? '⌘' : 'Ctrl');
  }, []);

  if (!isOpen) return null;

  const hotkeys = [
    { category: 'Navigation', items: [
      { keys: [`${modKey}`, '←/→'], description: 'Cycle through pages' },
      { keys: [`${modKey}`, '1/2/3'], description: 'Jump to page (home/work/more)' },
      { keys: [`${modKey}`, 'H'], description: 'Go home' },
    ]},
    { category: 'Terminal', items: [
      { keys: [`${modKey}`, 'K'], description: 'Close terminal' },
      { keys: [`${modKey}`, 'T'], description: 'Open terminal' },
      { keys: ['Esc'], description: 'Close modal/overlay' },
    ]},
    { category: 'Help', items: [
      { keys: ['?'], description: 'Toggle this help' },
      { keys: [`${modKey}`, '/'], description: 'Toggle this help' },
    ]},
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border-2 border-neonGreen p-6 max-w-md w-full mx-4 font-mono"
        style={{ 
          boxShadow: '0 0 30px rgba(57, 255, 20, 0.3), inset 0 0 30px rgba(57, 255, 20, 0.05)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-orange-500">$</span>
            <span className="text-neonGreen">man hotkeys</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            [ESC]
          </button>
        </div>

        {/* Hotkey Categories */}
        {hotkeys.map((category) => (
          <div key={category.category} className="mb-6 last:mb-0">
            <div className="text-orange-500 text-xs uppercase tracking-wider mb-3 border-b border-gray-700 pb-1">
              {category.category}
            </div>
            <div className="space-y-2">
              {category.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    {item.keys.map((key, keyIdx) => (
                      <span key={keyIdx}>
                        <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-neonGreen text-xs">
                          {key}
                        </kbd>
                        {keyIdx < item.keys.length - 1 && (
                          <span className="text-gray-600 mx-1">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <span className="text-gray-400 text-xs">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer hint */}
        <div className="mt-6 pt-4 border-t border-gray-700 text-center">
          <span className="text-gray-600 text-xs">
            Press <kbd className="px-1 bg-gray-800 border border-gray-700 rounded text-xs">?</kbd> anywhere to toggle
          </span>
        </div>
      </div>
    </div>
  );
};

export default HotkeyHelp;
