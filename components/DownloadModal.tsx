import React, { useState } from 'react';

interface DownloadModalProps {
  imageSrc: string;
  onClose: () => void;
}

type Format = 'PNG' | 'JPG';

export const DownloadModal: React.FC<DownloadModalProps> = ({ imageSrc, onClose }) => {
  const [format, setFormat] = useState<Format>('PNG');
  const [quality, setQuality] = useState(90);

  const handleDownload = () => {
    const link = document.createElement('a');
    let href = imageSrc;
    let filename = `nanocanvas-design.${format.toLowerCase()}`;

    if (format === 'JPG') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        href = canvas.toDataURL('image/jpeg', quality / 100);
        link.href = href;
        link.download = filename;
        link.click();
        onClose();
      };
      img.src = imageSrc;
    } else {
        link.href = href;
        link.download = filename;
        link.click();
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-brand-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-brand-gray-700" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-white">Export Design</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-brand-gray-300 mb-2">Format</label>
          <div className="flex gap-2">
            <button onClick={() => setFormat('PNG')} className={`px-4 py-2 rounded-md text-sm font-semibold flex-1 transition ${format === 'PNG' ? 'bg-neon-blue text-white' : 'bg-brand-gray-700 hover:bg-brand-gray-600'}`}>PNG</button>
            <button onClick={() => setFormat('JPG')} className={`px-4 py-2 rounded-md text-sm font-semibold flex-1 transition ${format === 'JPG' ? 'bg-neon-blue text-white' : 'bg-brand-gray-700 hover:bg-brand-gray-600'}`}>JPG</button>
          </div>
        </div>
        
        {format === 'JPG' && (
          <div className="mb-6">
            <label htmlFor="quality" className="block text-sm font-medium text-brand-gray-300 mb-2">Quality ({quality}%)</label>
            <input
              id="quality"
              type="range"
              min="1"
              max="100"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-brand-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
            />
          </div>
        )}
        
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm font-semibold bg-brand-gray-600 hover:bg-brand-gray-500 transition">Cancel</button>
          <button onClick={handleDownload} className="px-6 py-2.5 rounded-md text-sm font-semibold bg-neon-blue text-white hover:bg-sky-400 transition">Download</button>
        </div>
      </div>
    </div>
  );
};