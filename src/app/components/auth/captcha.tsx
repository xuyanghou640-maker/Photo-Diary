import { useState, useEffect, useRef } from 'react';
import { RefreshCw, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
}

export function Captcha({ onVerify }: CaptchaProps) {
  const [sliderValue, setSliderValue] = useState(0);
  const [verified, setVerified] = useState(false);
  const [targetPosition, setTargetPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize random target position
  useEffect(() => {
    resetCaptcha();
  }, []);

  const resetCaptcha = () => {
    setSliderValue(0);
    setVerified(false);
    onVerify(false);
    // Random position between 20% and 80%
    setTargetPosition(Math.floor(Math.random() * 60) + 20);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (verified) return;
    
    const newValue = parseInt(e.target.value);
    setSliderValue(newValue);
  };

  const handleSliderEnd = () => {
    if (verified) return;

    // Allow 5% margin of error
    if (Math.abs(sliderValue - targetPosition) < 5) {
      setVerified(true);
      onVerify(true);
    } else {
      // Failed, reset slider but keep target for retry (or reset everything?)
      // Let's reset slider to 0 to make them try again
      setSliderValue(0);
    }
  };

  return (
    <div className="w-full space-y-3 select-none">
      <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          Security Check
        </span>
        <button 
          type="button"
          onClick={resetCaptcha}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
          disabled={verified}
        >
          <RefreshCw className="w-3 h-3" />
          Reset
        </button>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full h-12 bg-gray-100 rounded-xl overflow-hidden shadow-inner border border-gray-200"
      >
        {verified ? (
          <div className="absolute inset-0 flex items-center justify-center bg-green-50 text-green-600 font-medium animate-in fade-in duration-300">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Verified Successfully
          </div>
        ) : (
          <>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" 
                 style={{ 
                   backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', 
                   backgroundSize: '10px 10px' 
                 }} 
            />
            
            {/* Target Zone */}
            <div 
              className="absolute top-0 bottom-0 w-10 bg-blue-100/50 border-x-2 border-blue-400/30 flex items-center justify-center"
              style={{ left: `${targetPosition}%` }}
            >
              <div className="w-2 h-2 rounded-full bg-blue-400/50" />
            </div>

            {/* Slider Piece (Visual only, follows input) */}
            <div 
              className="absolute top-1 bottom-1 w-10 bg-white shadow-md rounded-lg border border-gray-200 flex items-center justify-center transition-all duration-75 cursor-grab active:cursor-grabbing z-10"
              style={{ left: `${sliderValue}%` }}
            >
              <span className="text-gray-400">|||</span>
            </div>

            {/* Hidden Range Input for interaction */}
            <input
              type="range"
              min="0"
              max="90" // 100 - width of slider piece (approx 10%)
              value={sliderValue}
              onChange={handleSliderChange}
              onMouseUp={handleSliderEnd}
              onTouchEnd={handleSliderEnd}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            
            <div className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-gray-400 pointer-events-none">
              Slide to match the blue zone
            </div>
          </>
        )}
      </div>
    </div>
  );
}