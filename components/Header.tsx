import React, { useState } from 'react';
import { Icon } from './common/Icon';
import { DownloadModal } from './DownloadModal';

interface HeaderProps {
  canvasImage: string | null;
}

export const Header: React.FC<HeaderProps> = ({ canvasImage }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between p-4 bg-brand-gray-800 border-b border-brand-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-neon-blue to-purple-500 rounded-lg"></div>
          <h1 className="text-xl font-bold tracking-wider text-white">NanoCanvas AI</h1>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!canvasImage}
            className="group relative flex items-center gap-2 px-5 py-2.5 bg-neon-blue text-white font-semibold rounded-lg shadow-lg disabled:bg-brand-gray-600 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 hover:bg-sky-400 hover:shadow-neon focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark focus:ring-neon-blue"
            aria-label="Export Design"
          >
            <Icon name="download" className="w-5 h-5" />
            <span>Download</span>
            <div className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-brand-gray-900 text-white text-xs rounded py-1 px-2">
              Export Design
            </div>
          </button>
        </div>
      </header>
      {isModalOpen && canvasImage && (
        <DownloadModal imageSrc={canvasImage} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};