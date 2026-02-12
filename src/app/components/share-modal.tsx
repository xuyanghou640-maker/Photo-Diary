import { useState, useRef } from 'react';
import { X, Download, Share2, Sparkles } from 'lucide-react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import type { DiaryEntry } from './diary-entry-form';

interface ShareModalProps {
  entry: DiaryEntry;
  onClose: () => void;
}

export function ShareModal({ entry, onClose }: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `photo-diary-share-${entry.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-500" />
            Share Memory
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Area (The part that gets captured) */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-center">
          <div 
            ref={cardRef}
            className="bg-white p-4 pb-6 rounded-none shadow-xl w-full max-w-[320px] transform rotate-1 transition-transform hover:rotate-0"
            style={{ fontFamily: 'sans-serif' }} // Ensure font consistency
          >
            {/* Polaroid Style Frame */}
            <div className="aspect-[4/5] bg-gray-100 mb-4 overflow-hidden relative group">
              <img 
                src={entry.photo} 
                alt="Memory" 
                className="w-full h-full object-cover"
                crossOrigin="anonymous" // Important for canvas export
              />
              <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.1)] pointer-events-none" />
            </div>

            <div className="px-2 space-y-4">
              <div className="flex justify-between items-end border-b-2 border-gray-100 pb-3">
                <div className="font-handwriting text-2xl text-gray-800 leading-none">
                  {format(new Date(entry.date), 'MMM d, yyyy')}
                </div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  {entry.mood}
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed italic">
                "{entry.caption}"
              </p>

              <div className="flex items-center justify-between pt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Recorded On</span>
                  <span className="text-xs font-bold text-gray-900">Photo Diary</span>
                </div>
                <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-100">
                   {/* QR Code pointing to the current URL (or homepage) */}
                   <QRCodeSVG 
                    value={window.location.origin} 
                    size={48}
                    level="L"
                    fgColor="#374151"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Share Card
              </>
            )}
          </button>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
            Save the image and share it to your favorite social app!
          </p>
        </div>
      </div>
    </div>
  );
}