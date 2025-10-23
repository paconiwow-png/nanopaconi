import React, { useState, useEffect, useMemo } from 'react';
import { generateImagesFromPrompt, enhancePrompt } from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { AspectRatio, ImageGenerationModel, Tool, ArtStyle, artStyles } from '../types';
import { Icon } from './common/Icon';

interface StylePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allStyles: ArtStyle[];
  selectedStyles: ArtStyle[];
  toggleStyle: (style: ArtStyle) => void;
  clearStyles: () => void;
}

const StylePickerModal: React.FC<StylePickerModalProps> = ({ isOpen, onClose, allStyles, selectedStyles, toggleStyle, clearStyles }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const groupedStyles = useMemo(() => {
    return allStyles.reduce((acc, style) => {
      (acc[style.category] = acc[style.category] || []).push(style);
      return acc;
    }, {} as Record<string, ArtStyle[]>);
  }, [allStyles]);

  useEffect(() => {
    if (isOpen) {
      // Expand all categories by default when modal opens
      const allExpanded = Object.keys(groupedStyles).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setExpandedCategories(allExpanded);
    }
  }, [isOpen, groupedStyles]);

  if (!isOpen) return null;

  const filteredGroupedStyles = Object.entries(groupedStyles).reduce((acc, [category, styles]) => {
    // FIX: Add type assertion to 'styles' as it was being inferred as 'unknown'.
    const filtered = (styles as ArtStyle[]).filter(style => style.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, ArtStyle[]>);

  const selectedIds = new Set(selectedStyles.map(s => s.id));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-brand-gray-800 rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col border border-brand-gray-700" onClick={(e) => e.stopPropagation()}>
        <header className="p-4 border-b border-brand-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Select Styles</h2>
          <p className="text-sm text-brand-gray-300">Choose one or more styles to apply to your prompt.</p>
          <input
            type="text"
            placeholder="Search styles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full mt-3 p-2 bg-brand-gray-900 border border-brand-gray-700 rounded-md focus:ring-2 focus:ring-neon-blue focus:outline-none"
          />
        </header>
        <main className="flex-grow overflow-y-auto p-4">
          {Object.entries(filteredGroupedStyles).map(([category, styles]) => (
            <div key={category} className="mb-4">
              <button
                className="w-full text-left text-lg font-semibold mb-2 text-neon-blue"
                onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
              >
                {category} ({styles.length})
              </button>
              {expandedCategories[category] && (
                <div className="flex flex-wrap gap-2">
                  {styles.map(style => (
                    <button
                      key={style.id}
                      onClick={() => toggleStyle(style)}
                      className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                        selectedIds.has(style.id) ? 'bg-neon-blue text-white shadow-neon' : 'bg-brand-gray-700 hover:bg-brand-gray-600'
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </main>
        <footer className="p-4 border-t border-brand-gray-700 flex justify-between items-center flex-shrink-0">
          <button onClick={clearStyles} className="px-4 py-2 rounded-md text-sm font-semibold bg-brand-gray-600 hover:bg-brand-gray-500 transition">Clear All ({selectedStyles.length})</button>
          <button onClick={onClose} className="px-6 py-2.5 rounded-md text-sm font-semibold bg-neon-blue text-white hover:bg-sky-400 transition">Done</button>
        </footer>
      </div>
    </div>
  );
};

interface AIGeneratePanelProps {
  setCanvasImage: (image: string) => void;
  setActiveTool: (tool: Tool) => void;
}

export const AIGeneratePanel: React.FC<AIGeneratePanelProps> = ({ setCanvasImage, setActiveTool }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [model, setModel] = useState<ImageGenerationModel>('imagen-4.0-generate-001');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('Default');
  const [numberOfImages, setNumberOfImages] = useState<number>(2);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<ArtStyle[]>([]);

  const toggleStyle = (style: ArtStyle) => {
    setSelectedStyles(prev => 
      prev.find(s => s.id === style.id) 
        ? prev.filter(s => s.id !== style.id) 
        : [...prev, style]
    );
  };
  const clearStyles = () => setSelectedStyles([]);
  
  const aspectRatios: AspectRatio[] = ['Default', '1:1', '16:9', '9:16', '4:3', '3:4'];
  const models: { id: ImageGenerationModel; name: string }[] = [
    { id: 'imagen-4.0-generate-001', name: 'Imagen 4 (High Quality)' },
    { id: 'gemini-2.5-flash-image', name: 'NanoBanana' },
  ];

  const isNanoBanana = model === 'gemini-2.5-flash-image';

  useEffect(() => {
    if (isNanoBanana) {
      setAspectRatio('Default');
    }
  }, [model, isNanoBanana]);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
        const enhanced = await enhancePrompt(prompt);
        setPrompt(enhanced);
    } catch (err) {
        setError("Failed to enhance prompt. Please try again.");
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Prompt cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    try {
      const stylePrompts = selectedStyles.map(s => s.prompt).join(', ');
      const fullPrompt = [prompt.trim(), stylePrompts].filter(Boolean).join(', ');

      const images = await generateImagesFromPrompt(fullPrompt, aspectRatio, numberOfImages, model);
      setGeneratedImages(images);
      if (images.length > 0) {
        setCanvasImage(images[0]);
      }
    } catch (err: any) {
      let errorMessage: React.ReactNode = "Failed to generate images. Please try again.";
      if (err?.message) {
        try {
          const errorDetails = JSON.parse(err.message);
          if (errorDetails?.error) {
            const { message, status } = errorDetails.error;
            if (status === 'RESOURCE_EXHAUSTED') {
              const rateLimitDocUrl = 'https://ai.google.dev/gemini-api/docs/rate-limits';
              const usageUrl = 'https://ai.dev/usage?tab=rate-limit';
              errorMessage = (
                <span>
                  You've exceeded your request limit. Please check your plan and billing details.
                  <br />
                  <a href={rateLimitDocUrl} target="_blank" rel="noopener noreferrer" className="underline text-neon-blue hover:text-sky-400">Learn More</a>
                  {' | '}
                  <a href={usageUrl} target="_blank" rel="noopener noreferrer" className="underline text-neon-blue hover:text-sky-400">Monitor Usage</a>
                </span>
              );
            } else if (message && (message.includes('filtered out') || message.includes('violated'))) {
              errorMessage = "Your prompt may have violated Google's Responsible AI practices. Please try rephrasing your prompt.";
            } else {
              errorMessage = message || "An unknown API error occurred.";
            }
          } else {
            errorMessage = err.message;
          }
        } catch (e) {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && prompt.trim()) {
        handleGenerate();
      }
    }
  };

  const handleUseForEditing = (imageSrc: string) => {
    setCanvasImage(imageSrc);
    setActiveTool(Tool.EDIT);
  };

  return (
    <div className="bg-brand-gray-800 rounded-lg p-4 flex flex-col gap-4 h-full">
      <h3 className="text-lg font-bold text-white">AI Image Generation</h3>
      
      <div className="flex-grow flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., A futuristic cityscape at sunset..."
              className="w-full h-24 p-2 pr-12 bg-brand-gray-900 border border-brand-gray-700 rounded-md focus:ring-2 focus:ring-neon-blue focus:outline-none resize-none"
              disabled={isLoading || isEnhancing}
            />
             <button
              onClick={handleEnhancePrompt}
              disabled={isLoading || isEnhancing || !prompt.trim()}
              className="absolute top-2 right-2 p-1.5 bg-brand-gray-700 text-neon-blue rounded-md hover:bg-brand-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Enhance Prompt"
            >
              {isEnhancing ? (
                <div className="w-5 h-5 flex items-center justify-center">
                  <Spinner />
                </div>
              ) : (
                <Icon name="sparkles" className="w-5 h-5" />
              )}
            </button>
          </div>
          <button onClick={() => setIsStyleModalOpen(true)} className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-brand-gray-700 text-white font-semibold rounded-lg transition-all hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark focus:ring-neon-blue">
            <Icon name="palette" className="w-5 h-5 text-neon-blue" />
            <span>Add Styles ({selectedStyles.length})</span>
          </button>
          {selectedStyles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 text-xs">
              {selectedStyles.map(style => (
                <div key={style.id} className="bg-neon-blue/20 text-neon-blue rounded-full px-2.5 py-1 flex items-center gap-1.5">
                  <span>{style.name}</span>
                  <button onClick={() => toggleStyle(style)} className="text-neon-blue hover:text-white">
                    <Icon name="close" className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-gray-300 mb-2">Model</label>
            <div className="grid grid-cols-2 gap-2">
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  disabled={isLoading || isEnhancing}
                  className={`px-3 py-2 rounded-md text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    model === m.id ? 'bg-neon-blue text-white' : 'bg-brand-gray-700 hover:bg-brand-gray-600'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray-300 mb-2">Aspect Ratio</label>
            {isNanoBanana && <p className="text-xs text-brand-gray-400 mb-2 -mt-1">Only available for Imagen 4 model.</p>}
            <div className="grid grid-cols-3 gap-2">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  disabled={isLoading || isEnhancing || isNanoBanana}
                  className={`px-3 py-2 rounded-md text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    aspectRatio === ratio && !isNanoBanana ? 'bg-neon-blue text-white' : 'bg-brand-gray-700 hover:bg-brand-gray-600'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="num-images" className="block text-sm font-medium text-brand-gray-300 mb-2">
              Number of Images ({numberOfImages})
            </label>
            <input
              id="num-images"
              type="range"
              min="1"
              max="4"
              value={numberOfImages}
              onChange={(e) => setNumberOfImages(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-brand-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-blue disabled:opacity-50"
              disabled={isLoading || isEnhancing}
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || isEnhancing || !prompt}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-neon-blue text-white font-semibold rounded-lg shadow-lg disabled:bg-brand-gray-600 disabled:cursor-not-allowed transition-all hover:bg-sky-400 hover:shadow-neon focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark focus:ring-neon-blue"
        >
          {isLoading ? <Spinner /> : 'Generate'}
        </button>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        <div className="flex-grow overflow-y-auto mt-2 -mr-2 pr-2">
          {generatedImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {generatedImages.map((src, index) => (
                <div key={index} className="relative group">
                  <img src={src} alt={`Generated variation ${index + 1}`} className="rounded-md w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                    <button onClick={() => setCanvasImage(src)} className="bg-white/20 hover:bg-white/30 text-white font-bold p-2 rounded-full" title="Select Image">
                      <Icon name="canvas" className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleUseForEditing(src)} className="bg-white/20 hover:bg-white/30 text-white font-bold p-2 rounded-full" title="Use for Editing">
                      <Icon name="magic" className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <StylePickerModal 
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        allStyles={artStyles}
        selectedStyles={selectedStyles}
        toggleStyle={toggleStyle}
        clearStyles={clearStyles}
      />
    </div>
  );
};
