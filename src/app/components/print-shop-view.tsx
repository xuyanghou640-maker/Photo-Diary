import { useState, useMemo, useEffect, useRef, forwardRef } from 'react';
import { Book, ChevronRight, Check, Printer, Calendar, Camera, FileText, ShoppingBag, BookOpen, X, ChevronLeft, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { DiaryEntry } from './diary-entry-form';
import { format } from 'date-fns';
import HTMLFlipBook from 'react-pageflip';
import { useTranslation } from 'react-i18next';
import { LazyImage } from './ui/lazy-image';
import { toast } from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

interface PrintShopViewProps {
  entries?: DiaryEntry[]; // Make optional to be safe
}

// Mock Data Generator for Book Preview
const MOCK_BOOK_PAGES = [
  {
    type: 'cover',
    title: '2026',
    subtitle: 'The Story of Us',
  },
  {
    type: 'intro',
    text: "This year was filled with unforgettable moments, laughter, and growth. Here are the highlights of my journey...",
  },
  {
    type: 'entry',
    date: '2026-01-15',
    mood: 'Excited',
    location: 'Paris, France',
    photo: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=60',
    caption: 'First day in Paris! The Eiffel Tower is even more beautiful in person. Can\'t wait to explore the Louvre tomorrow. 🥐🇫🇷',
  },
  {
    type: 'entry',
    date: '2026-02-14',
    mood: 'Loved',
    location: 'Central Park, NY',
    photo: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop&q=60',
    caption: 'Valentine\'s Day picnic. The weather was surprisingly warm. So grateful for these little moments.',
  },
  {
    type: 'collage',
    photos: [
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=60'
    ],
    caption: 'Spring Adventures 🌸',
  },
  {
    type: 'entry',
    date: '2026-06-20',
    mood: 'Relaxed',
    location: 'Bali, Indonesia',
    photo: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=60',
    caption: 'Sunset by the beach. The sound of waves is the best therapy. 🌊🍹',
  },
  {
    type: 'outro',
    text: "To be continued...",
  }
];

export function PrintShopView({ entries = [] }: PrintShopViewProps) {
  const { t } = useTranslation();
  // Error State
  const [error, setError] = useState<string | null>(null);

  // Safe State Initialization
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    try {
      return new Date().getFullYear().toString();
    } catch (e) {
      return '2025';
    }
  });
  
  const [coverType, setCoverType] = useState<'soft' | 'hard'>('hard');
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Defensive: Ensure entries is an array
  const safeEntries = useMemo(() => {
    return Array.isArray(entries) ? entries : [];
  }, [entries]);

  // Available years calculation with error handling
  const years = useMemo(() => {
    try {
      const uniqueYears = new Set(safeEntries
        .filter(e => e && e.date && typeof e.date === 'string' && !isNaN(new Date(e.date).getTime()))
        .map(e => new Date(e.date).getFullYear().toString())
      );
      const sortedYears = Array.from(uniqueYears).sort().reverse();
      if (sortedYears.length === 0) return [new Date().getFullYear().toString()];
      return sortedYears;
    } catch (e) {
      console.error("Error calculating years:", e);
      return [new Date().getFullYear().toString()];
    }
  }, [safeEntries]);

  // Filter entries for selected year
  const yearEntries = useMemo(() => {
    return safeEntries.filter(entry => {
      try {
        if (!entry || !entry.date) return false;
        return new Date(entry.date).getFullYear().toString() === selectedYear;
      } catch (e) {
        return false;
      }
    });
  }, [safeEntries, selectedYear]);

  // Calculate stats safely
  const photoCount = yearEntries.reduce((acc, entry) => acc + (entry?.photo ? 1 : 0), 0);
  // Just for display, if 0, assume mock count
  const displayPhotoCount = photoCount > 0 ? photoCount : 124;
  const estimatedPages = Math.max(20, yearEntries.length * 1.5); 
  const displayPages = photoCount > 0 ? Math.ceil(estimatedPages) : 42;

  // Calculate price
  // Digital Base Price: $0.99 (Platform Fee)
  // Per Page Cost: $0.05
  const basePrice = 0.99;
  const pageCost = displayPages * 0.05;
  const totalPrice = (basePrice + pageCost).toFixed(2);

  const handleOrder = () => {
    toast.success("Printing Service Coming Soon!");
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-red-500 p-4">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h3 className="text-lg font-bold">Something went wrong</h3>
        <p className="text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 rounded-lg hover:bg-red-200"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400">
          {t('print.title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {t('print.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: 3D Book Preview */}
        <div className="relative group perspective-1000 cursor-pointer" onClick={() => setIsPreviewOpen(true)}>
          <div className={`relative w-80 h-[480px] mx-auto transition-transform duration-700 transform-style-3d rotate-y-12 group-hover:rotate-y-0 group-hover:scale-105`}>
            {/* Front Cover */}
            <div className="absolute inset-0 bg-blue-900 rounded-r-lg shadow-2xl flex flex-col items-center justify-center p-8 text-center text-white backface-hidden z-20 border-l-4 border-l-gray-800">
              <div className="w-full h-full border-2 border-amber-400/30 p-6 flex flex-col items-center relative overflow-hidden">
                 {/* Texture overlay */}
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-20 pointer-events-none"></div>
                 
                <div className="mt-8 text-xs tracking-[0.2em] text-amber-400 uppercase relative z-10">Year Book</div>
                <div className="mt-4 text-6xl font-serif font-bold text-amber-100 relative z-10">{selectedYear}</div>
                <div className="mt-auto mb-12 space-y-2 relative z-10 w-full">
                  <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden border-4 border-white/20 mx-auto shadow-inner flex items-center justify-center relative">
                     {/* Use the first photo of the year as cover if available */}
                     {yearEntries[0]?.photo ? (
                       <LazyImage src={yearEntries[0].photo} alt="Cover" className="w-full h-full object-cover opacity-80" />
                     ) : (
                       <LazyImage src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&auto=format&fit=crop&q=60" alt="Default Cover" className="w-full h-full object-cover opacity-80" />
                     )}
                  </div>
                  <p className="font-serif text-lg italic text-amber-100/80">My Photo Diary</p>
                </div>
              </div>
              
              {/* Spine Effect */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-gray-900 to-transparent opacity-50"></div>
            </div>

            {/* Pages Effect (Side) */}
            <div className="absolute right-0 top-2 bottom-2 w-12 bg-white transform rotate-y-90 origin-right translate-x-full shadow-inner flex flex-col justify-between py-1">
               {[...Array(20)].map((_, i) => (
                 <div key={i} className="h-px bg-gray-200 w-full"></div>
               ))}
            </div>
            
            {/* Back Cover (Simulated) */}
            <div className="absolute inset-0 bg-blue-900 rounded-l-lg transform translate-z-[-40px] shadow-xl"></div>
          </div>
          
          {/* Shadow */}
          <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-64 h-8 bg-black/20 blur-xl rounded-[100%] transition-all duration-700 group-hover:scale-110 group-hover:bg-black/30"></div>
          
           {/* Preview Badge */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-30">
            <div className="bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Click to Preview</span>
            </div>
          </div>
        </div>

        {/* Right: Configuration & Stats */}
        <div className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                <Camera className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Photos</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{displayPhotoCount}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Pages</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{displayPages}</div>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Year</label>
              <div className="flex flex-wrap gap-2">
                {years.map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedYear === year
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Format</label>
              <div className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      {t('print.photobook')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Includes interactive flipbook link + downloadable PDF
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{t('print.price', { price: '0.99' })}</div>
                    <div className="text-[10px] text-gray-400">+ {t('print.price', { price: '0.05' })}/page</div>
                  </div>
                </div>
                <div className="absolute top-2 right-2 text-blue-500 opacity-0">
                  <Check className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Area */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-500 dark:text-gray-400">Total Estimate</span>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{t('print.price', { price: totalPrice })}</span>
            </div>
            
            <button 
              onClick={handleOrder}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              {t('print.checkout')}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
              <ShoppingBag className="w-3 h-3" />
              Free shipping worldwide
            </p>
          </div>
        </div>
      </div>

      <AlertDialog open={showOrderSuccess} onOpenChange={setShowOrderSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="w-6 h-6" />
              {t('subscription.payment.success')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('subscription.payment.confirmed')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowOrderSuccess(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Book Preview Modal */}
      {isPreviewOpen && (
        <MockBookPreview 
          year={selectedYear} 
          onClose={() => setIsPreviewOpen(false)} 
        />
      )}
    </div>
  );
}

// --- Mock Book Preview Component ---

interface MockBookPreviewProps {
  year: string;
  onClose: () => void;
}

const Page = forwardRef<HTMLDivElement, any>((props, ref) => {
  return (
    <div className="page bg-white shadow-md h-full" ref={ref}>
      <div className="page-content h-full relative">
        {props.children}
      </div>
    </div>
  );
});

function MockBookPreview({ year, onClose }: MockBookPreviewProps) {
  const { t } = useTranslation();
  const bookRef = useRef<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    // Calculate total pages including cover and back
    // MOCK_BOOK_PAGES length + 1 (Back Cover)
    // Actually Flipbook manages pages automatically based on children
    setTotalPages(MOCK_BOOK_PAGES.length + 1); // + Back Cover
  }, []);

  const onFlip = (e: any) => {
    setCurrentPage(e.data);
  };

  const nextFlip = () => {
    bookRef.current?.pageFlip()?.flipNext();
  };

  const prevFlip = () => {
    bookRef.current?.pageFlip()?.flipPrev();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextFlip();
      if (e.key === 'ArrowLeft') prevFlip();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderPageContent = (page: any, index: number) => {
    if (page.type === 'cover') {
      return (
        <div className="w-full h-full bg-blue-900 text-white flex flex-col items-center justify-center p-8 text-center relative overflow-hidden border-8 border-blue-950">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-20 pointer-events-none"></div>
           <div className="z-10 border-4 border-amber-400/20 p-8 w-full h-full flex flex-col items-center justify-center">
             <div className="text-amber-400 tracking-[0.3em] uppercase text-sm mb-4">{t('print.theYearOf')}</div>
             <h1 className="text-6xl font-serif font-bold text-amber-100 mb-8">{year}</h1>
             <div className="w-32 h-32 rounded-full border-4 border-amber-100/30 overflow-hidden mb-8">
               <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&auto=format&fit=crop&q=60" className="w-full h-full object-cover" />
             </div>
             <p className="text-xl font-light italic text-amber-200">{page.subtitle}</p>
           </div>
        </div>
      );
    }

    if (page.type === 'intro') {
      return (
        <div className="w-full h-full bg-[#fdfbf7] p-12 flex flex-col items-center justify-center text-center">
          <h2 className="text-3xl font-serif text-gray-800 mb-6">{t('print.introduction')}</h2>
          <p className="text-lg text-gray-600 italic leading-relaxed max-w-md">{page.text}</p>
          <div className="mt-auto text-xs text-gray-400">{index + 1}</div>
        </div>
      );
    }

    if (page.type === 'entry') {
      return (
        <div className="w-full h-full bg-[#fdfbf7] p-8 flex flex-col">
           <div className="flex justify-between items-baseline border-b border-gray-200 pb-4 mb-6">
             <h3 className="text-xl font-bold text-gray-900">{format(new Date(page.date!), 'MMMM d')}</h3>
             <span className="text-xs text-gray-500 uppercase">{page.location}</span>
           </div>
           <div className="w-full aspect-video bg-gray-100 mb-6 rounded-lg overflow-hidden shadow-sm">
             <img src={page.photo} className="w-full h-full object-cover" />
           </div>
           <p className="text-gray-700 font-serif leading-relaxed">{page.caption}</p>
           <div className="mt-auto pt-4 flex justify-between items-center">
             <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">Mood: {page.mood}</span>
             <span className="text-xs text-gray-400">{index + 1}</span>
           </div>
        </div>
      );
    }

    if (page.type === 'collage') {
      return (
        <div className="w-full h-full bg-[#fdfbf7] p-8 flex flex-col">
          <div className="grid grid-cols-2 gap-4 flex-1 content-center">
             {page.photos?.map((src: string, i: number) => (
               <div key={i} className={`rounded-lg overflow-hidden shadow-sm ${i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}>
                 <img src={src} className="w-full h-full object-cover" />
               </div>
             ))}
          </div>
          <p className="text-center font-serif italic text-gray-600 mt-6">{page.caption}</p>
          <div className="mt-auto text-right text-xs text-gray-400">{index + 1}</div>
        </div>
      );
    }

    if (page.type === 'outro') {
        return (
            <div className="w-full h-full bg-[#fdfbf7] p-12 flex flex-col items-center justify-center text-center">
              <p className="text-xl font-serif italic text-gray-500">{page.text}</p>
              <div className="mt-auto text-xs text-gray-400">{index + 1}</div>
            </div>
        );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/95 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden">
      <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-50">
        <X className="w-8 h-8" />
      </button>

      <div className="relative w-full h-full flex items-center justify-center">
        {/* @ts-ignore - Library types might be tricky */}
        <HTMLFlipBook
          width={450}
          height={600}
          size="stretch"
          minWidth={300}
          maxWidth={600}
          minHeight={400}
          maxHeight={800}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          className="shadow-2xl"
          ref={bookRef}
          onFlip={onFlip}
        >
            {/* Front Cover */}
            <Page>
                {renderPageContent(MOCK_BOOK_PAGES[0], 0)}
            </Page>

            {/* Inner Pages */}
            {MOCK_BOOK_PAGES.slice(1).map((page, index) => (
                <Page key={index}>
                    {renderPageContent(page, index + 1)}
                </Page>
            ))}

            {/* Back Cover */}
            <Page>
                <div className="w-full h-full bg-blue-900 text-white flex flex-col items-center justify-center border-8 border-blue-950 relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-20 pointer-events-none"></div>
                    <div className="z-10 text-center">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-amber-100" />
                        </div>
                        <p className="text-sm opacity-60">The End</p>
                        <p className="text-xs opacity-40 mt-2">www.photodiary.com</p>
                    </div>
                </div>
            </Page>
        </HTMLFlipBook>
      </div>
      
      <div className="absolute bottom-8 text-white/50 text-sm bg-black/50 px-4 py-2 rounded-full pointer-events-none">
        {t('print.flipInstruction')}
      </div>
    </div>
  );
}