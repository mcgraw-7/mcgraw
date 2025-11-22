'use client';
import { SetStateAction, useState, useEffect } from 'react';
import Modal from '../app/components/modal';
import dummyWorks from '../public/dummy';
import Vanta from "../app/components/vantabg";

interface Job {
  id: number;
  title: string;
  description: string;
  company: string;
  startDate: string;
  endDate: string;
}

const Work = ({ works = [] }: { works?: Job[] }) => {
  const [selectedWork, setSelectedWork] = useState<null | Job>(null);
  const [isClient, setIsClient] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const openModal = (work: SetStateAction<Job | null>) => {
    setSelectedWork(work);
  };

  const closeModal = () => {
    setSelectedWork(null);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* <Vanta /> */}
      
      {/* Header Section */}
      <div className="pt-20 pb-12 px-8 border-b border-neonGreen">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          <span className="text-orange-500">&gt;</span> work experience
        </h1>
        <p className="text-neonGreen text-sm md:text-base max-w-2xl">
          frontend engineering roles spanning design systems, performance optimization, and large-scale applications
        </p>
      </div>

      {/* Works Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 lowercase">
        {works.map((work) => (
          <div
            key={work.id}
            className="group relative cursor-pointer h-full"
            onMouseEnter={() => setHoveredId(work.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => openModal(work)}
          >
            {/* Retro border glow effect */}
            <div className="absolute inset-0 border-2 border-neonGreen opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-none pointer-events-none"></div>
            
            {/* Card background with retro styling */}
            <div className="relative bg-gray-900 border-2 border-gray-700 p-6 h-full flex flex-col transition-all duration-300 hover:border-orange-500 hover:shadow-lg hover:bg-gray-800">
              
              {/* Accent bars */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-1 h-full bg-gradient-to-b from-neonGreen via-neonGreen to-transparent opacity-30"></div>

              {/* Job Title */}
              <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                {work.title}
              </h3>

              {/* Company Name */}
              <p className="text-orange-500 font-semibold text-base mb-2 group-hover:text-neonGreen transition-colors">
                {work.company}
              </p>

              {/* Date Range */}
              <p className="text-gray-400 text-xs md:text-sm mb-4 font-mono">
                <span className="text-neonGreen">[</span> {work.startDate} <span className="text-gray-600">—</span> {work.endDate} <span className="text-neonGreen">]</span>
              </p>

              {/* Description */}
              <p className="text-gray-300 text-sm leading-relaxed flex-grow mb-4 group-hover:text-gray-100 transition-colors">
                {work.description}
              </p>

              {/* Footer with interactive element */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700 group-hover:border-orange-500 transition-colors">
                <span className="text-xs text-gray-500">click to expand</span>
                <span className="text-orange-500 text-lg group-hover:translate-x-1 transition-transform duration-300">→</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state message */}
      {works.length === 0 && (
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 text-lg mb-2">no work experience found</p>
            <p className="text-gray-600 text-sm">loading...</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedWork && (
        <Modal onClose={closeModal}>
          <div className="max-w-2xl">
            <div className="mb-6 pb-4 border-b-2 border-orange-500">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {selectedWork.title}
              </h2>
              <p className="text-orange-500 text-lg font-semibold">{selectedWork.company}</p>
              <p className="text-gray-400 text-sm mt-2 font-mono">
                {selectedWork.startDate} <span className="text-gray-600">—</span> {selectedWork.endDate}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-gray-300 leading-relaxed text-base mb-4">
                {selectedWork.description}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-gray-500 text-xs italic">click outside or use escape to close</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const WorkComponent = () => <Work works={dummyWorks} />;
export default WorkComponent;
