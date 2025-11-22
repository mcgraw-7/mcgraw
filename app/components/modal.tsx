// components/Modal.tsx
import React, { useEffect } from 'react';

const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 border-2 border-orange-500 p-8 relative max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Retro corner decorations */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neonGreen"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neonGreen"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neonGreen"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neonGreen"></div>

        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-orange-500 text-2xl font-bold transition-colors duration-200"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Content */}
        <div className="text-white">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
