import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AIGeneratePanel } from './components/AIGeneratePanel';
import { AIEditPanel } from './components/AIEditPanel';
import { Canvas } from './components/Canvas';
import { Tool } from './types';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>(Tool.GENERATE);
  const [canvasImage, setCanvasImage] = useState<string | null>(null);
  const [canvasKey, setCanvasKey] = useState<number>(0);

  const handleSetCanvasImage = useCallback((image: string | null) => {
    setCanvasImage(image);
    setCanvasKey(prevKey => prevKey + 1); 
  }, []);
  
  const renderActivePanel = () => {
    switch (activeTool) {
      case Tool.GENERATE:
        return <AIGeneratePanel setCanvasImage={handleSetCanvasImage} setActiveTool={setActiveTool} />;
      case Tool.EDIT:
        return <AIEditPanel setCanvasImage={handleSetCanvasImage} canvasImage={canvasImage} />;
      default:
        return (
          <div className="p-6 bg-brand-gray-800 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Select a tool</h3>
            <p className="text-brand-gray-300">Choose a tool from the sidebar to begin.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-brand-dark font-sans overflow-hidden">
      <Header canvasImage={canvasImage} />
      <div className="flex flex-grow overflow-hidden">
        <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} />
        <main className="flex-grow flex items-center justify-center p-4 md:p-8 bg-brand-gray-900 overflow-auto">
          <div className="w-full h-full flex flex-col lg:flex-row gap-4 md:gap-8">
            <div className="lg:w-1/3 xl:w-1/4 flex-shrink-0">
              {renderActivePanel()}
            </div>
            <div className="flex-grow flex items-center justify-center rounded-lg bg-black/20">
              <Canvas imageSrc={canvasImage} key={canvasKey} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;