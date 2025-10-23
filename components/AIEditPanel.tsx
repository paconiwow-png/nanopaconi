import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { editImageWithPrompt, enhancePrompt } from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { ImageData, ArtStyle, artStyles } from '../types';
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


interface AIEditPanelProps {
  setCanvasImage: (image: string) => void;
  canvasImage: string | null;
}

export const AIEditPanel: React.FC<AIEditPanelProps> = ({ setCanvasImage, canvasImage }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [sourceImage, setSourceImage] = useState<ImageData | null>(null);
  const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [shouldUpdateSource, setShouldUpdateSource] = useState<boolean>(true);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<ArtStyle[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleStyle = (style: ArtStyle) => {
    setSelectedStyles(prev => 
      prev.find(s => s.id === style.id) 
        ? prev.filter(s => s.id !== style.id) 
        : [...prev, style]
    );
  };
  const clearStyles = () => setSelectedStyles([]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setSourceImage({ base64: base64String, mimeType: file.type });
        setSourceImagePreview(URL.createObjectURL(file));
        setError(null);
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
      }
      reader.readAsDataURL(file);
    }
  };

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

  const handleEdit = async () => {
    if (!prompt.trim() || !sourceImage) {
      setError("Please provide an image and an editing prompt.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const stylePrompts = selectedStyles.map(s => s.prompt).join(', ');
      const fullPrompt = [prompt.trim(), stylePrompts].filter(Boolean).join(', ');

      const editedImage = await editImageWithPrompt(fullPrompt, sourceImage);
      setCanvasImage(editedImage);
      
      if (shouldUpdateSource) {
        setSourceImagePreview(editedImage);
        const match = editedImage.match(/^data:(.*);base64,(.*)$/);
        if (match && match.length === 3) {
          const mimeType = match[1];
          const base64 = match[2];
          setSourceImage({ base64, mimeType });
        } else {
          console.error("Could not parse newly edited image data URL for re-editing");
        }
      }

    } catch (err: any) {
      let errorMessage: React.ReactNode = "Failed to edit image. Please try again.";
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
      if (!isLoading && prompt.trim() && sourceImage) {
        handleEdit();
      }
    }
  };

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUseCanvasImage = useCallback(() => {
    if (canvasImage) {
      setSourceImagePreview(canvasImage);
      const match = canvasImage.match(/^data:(.*);base64,(.*)$/);
      if (match && match.length === 3) {
        const mimeType = match[1];
        const base64 = match[2];
        setSourceImage({ base64, mimeType });
        setError(null);
      } else {
        console.error("Could not parse canvas image data URL");
        setError("Invalid image format from canvas.");
      }
    }
  }, [canvasImage]);

  const handleClearImage = useCallback(() => {
    setSourceImage(null);
    setSourceImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);


  return (
    <div className="bg-brand-gray-800 rounded-lg p-4 flex flex-col gap-4 h-full">
      <h3 className="text-lg font-bold text-white">AI Generative Edit</h3>
      
      <div 
        className="relative w-full h-48 bg-brand-gray-900 border-2 border-dashed border-brand-gray-700 rounded-md flex items-center justify-center transition-colors flex-shrink-0"
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden" />
        {sourceImagePreview ? (
          <>
            <img src={sourceImagePreview} alt="Source preview" className="max-w-full max-h-full object-contain rounded-md" />
            <button
              onClick={handleClearImage}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full p-1.5 text-white transition-colors"
              aria-label="Clear selected image"
            >
              <Icon name="close" className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="text-center text-brand-gray-400 flex flex-col items-center justify-center p-2 w-full h-full">
            <button onClick={triggerFileSelect} className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-white/5 transition-colors w-full flex-1">
              <Icon name="upload" className="w-10 h-10 mx-auto mb-2" />
              <p>Click to upload an image</p>
              <p className="text-xs">PNG, JPG</p>
            </button>
            {canvasImage && (
              <div className="pt-2 flex flex-col items-center flex-shrink-0">
                <span className="text-xs my-1">OR</span>
                <button 
                  onClick={handleUseCanvasImage}
                  disabled={!canvasImage}
                  className="px-4 py-2 text-sm text-neon-blue font-semibold rounded-md hover:bg-neon-blue/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  Use Canvas Image
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-grow flex flex-col gap-2 overflow-hidden">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Add a red hat to the dog"
            className="w-full h-24 p-2 pr-12 bg-brand-gray-900 border border-brand-gray-700 rounded-md focus:ring-2 focus:ring-neon-blue focus:outline-none resize-none"
            disabled={isLoading || isEnhancing || !sourceImage}
          />
          <button
            onClick={handleEnhancePrompt}
            disabled={isLoading || isEnhancing || !prompt.trim() || !sourceImage}
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
        <button onClick={() => setIsStyleModalOpen(true)} className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-brand-gray-700 text-white font-semibold rounded-lg transition-all hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark focus:ring-neon-blue" disabled={!sourceImage || isLoading || isEnhancing}>
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

      <div>
        <button
          onClick={handleEdit}
          disabled={isLoading || isEnhancing || !prompt || !sourceImage}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-neon-blue text-white font-semibold rounded-lg shadow-lg disabled:bg-brand-gray-600 disabled:cursor-not-allowed transition-all hover:bg-sky-400 hover:shadow-neon focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark focus:ring-neon-blue"
        >
          {isLoading ? <Spinner /> : 'Apply Edit'}
        </button>
        <div className="flex items-center gap-2 mt-2">
          <input
            id="re-edit-checkbox"
            type="checkbox"
            checked={shouldUpdateSource}
            onChange={(e) => setShouldUpdateSource(e.target.checked)}
            className="w-4 h-4 accent-neon-blue text-neon-blue bg-brand-gray-700 border-brand-gray-600 rounded focus:ring-neon-blue focus:ring-offset-brand-gray-800 focus:ring-2"
          />
          <label htmlFor="re-edit-checkbox" className="text-sm text-brand-gray-300 select-none cursor-pointer">
            Use result as next source image
          </label>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
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
