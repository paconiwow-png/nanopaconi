import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from './common/Icon';

interface CanvasProps {
  imageSrc: string | null;
}

const MIN_SCALE = 0.2;
const MAX_SCALE = 10;
const ZOOM_SENSITIVITY = 0.001;

export const Canvas: React.FC<CanvasProps> = ({ imageSrc }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const resetTransform = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetTransform();
  }, [imageSrc, resetTransform]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current || !imageRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale - e.deltaY * ZOOM_SENSITIVITY * scale));
    
    // Position of the mouse relative to the image (before zoom)
    const mouseToImageX = (mouseX - position.x) / scale;
    const mouseToImageY = (mouseY - position.y) / scale;
    
    // New position of the image to keep the point under the mouse stationary
    const newX = mouseX - mouseToImageX * newScale;
    const newY = mouseY - mouseToImageY * newScale;

    setScale(newScale);
    setPosition({ x: newX, y: newY });
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPanning(true);
    setStartPanPosition({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  
  const handleMouseUp = () => {
    setIsPanning(false);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPosition({
        x: e.clientX - startPanPosition.x,
        y: e.clientY - startPanPosition.y,
      });
    }
  };

  const isTransformed = scale !== 1 || position.x !== 0 || position.y !== 0;
  const cursorClass = isPanning ? 'cursor-grabbing' : (imageSrc ? 'cursor-grab' : 'cursor-default');

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full max-w-full max-h-full flex items-center justify-center p-4 rounded-lg bg-black/20 overflow-hidden ${cursorClass}`}
      onWheel={imageSrc ? handleWheel : undefined}
      onMouseDown={imageSrc ? handleMouseDown : undefined}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={imageSrc ? handleMouseMove : undefined}
    >
      {imageSrc ? (
        <>
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Generated or edited content"
            className="max-w-none max-h-none object-contain rounded-md shadow-2xl select-none"
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isPanning ? 'none' : 'transform 0.1s ease-out'
            }}
            draggable="false"
          />
          {isTransformed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetTransform();
              }}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-brand-gray-900/80 text-white font-semibold rounded-lg shadow-lg transition-all hover:bg-brand-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark focus:ring-neon-blue"
              aria-label="Reset View"
            >
              <Icon name="reset-zoom" className="w-5 h-5" />
              <span className="text-sm">Reset View</span>
            </button>
          )}
        </>
      ) : (
        <div className="text-center text-brand-gray-400 flex flex-col items-center gap-4">
          <Icon name="canvas" className="w-24 h-24 opacity-20"/>
          <h2 className="text-2xl font-semibold">NanoCanvas</h2>
          <p className="max-w-xs">Your creative space. Generate or upload an image to begin.</p>
        </div>
      )}
    </div>
  );
};