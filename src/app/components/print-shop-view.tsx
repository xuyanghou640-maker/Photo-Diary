import { useState, useMemo, useEffect, useRef, forwardRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Book, ChevronRight, Check, Printer, Calendar, Camera, FileText, ShoppingBag, BookOpen, X, ChevronLeft, ArrowRight, ArrowLeft, AlertCircle, Share2, Download, Layout, Link as LinkIcon, Globe, Edit3, GripVertical, Image as ImageIcon } from 'lucide-react';
import { DiaryEntry } from './diary-entry-form';
import { format } from 'date-fns';
import HTMLFlipBook from 'react-pageflip';
import { useTranslation } from 'react-i18next';
import { LazyImage } from './ui/lazy-image';
import { toast } from 'react-hot-toast';
import { generateBookLayout, LayoutStyle, BookPage } from '../utils/layout-engine';
import { generatePDF } from '../utils/pdf-generator';
import { useSearchParams } from 'react-router-dom';
import { shareBook } from '../services/book-service';
import { MockBookPreview } from './book-preview';
import { Reorder, useDragControls } from 'framer-motion';
import { Checkbox } from '../components/ui/checkbox'; // Assuming you have this or standard input
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
  entries?: DiaryEntry[];
}

export function PrintShopView({ entries = [] }: PrintShopViewProps) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Safe State Initialization
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    const urlYear = searchParams.get('year');
    if (urlYear) return urlYear;
    try {
      return new Date().getFullYear().toString();
    } catch (e) {
      return '2025';
    }
  });
  
  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>(() => {
    const urlStyle = searchParams.get('style');
    return (urlStyle as LayoutStyle) || 'classic';
  });

  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(() => {
    return searchParams.get('mode') === 'preview';
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [customOrderedEntries, setCustomOrderedEntries] = useState<DiaryEntry[]>([]);
  const [excludedEntryIds, setExcludedEntryIds] = useState<Set<string>>(new Set());
  const [customCoverPhoto, setCustomCoverPhoto] = useState<string | null>(null);

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('year', selectedYear);
    params.set('style', layoutStyle);
    if (isPreviewOpen) {
      params.set('mode', 'preview');
    } else {
      params.delete('mode');
    }
    setSearchParams(params, { replace: true });
  }, [selectedYear, layoutStyle, isPreviewOpen]);

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

  // Initialize custom order when year changes
  useEffect(() => {
    setCustomOrderedEntries(yearEntries);
    setExcludedEntryIds(new Set());
    setCustomCoverPhoto(null);
  }, [yearEntries]);

  const finalEntries = useMemo(() => {
    // Filter out excluded IDs
    return customOrderedEntries.filter(e => !excludedEntryIds.has(e.id));
  }, [customOrderedEntries, excludedEntryIds]);

  const bookPages = useMemo(() => {
    if (finalEntries.length === 0) return [];
    
    // Generate pages
    const pages = generateBookLayout(finalEntries, selectedYear, layoutStyle, t);
    
    // Override cover photo if custom selected
    if (customCoverPhoto && pages.length > 0 && pages[0].type === 'cover') {
        pages[0].coverPhoto = customCoverPhoto;
    }
    
    return pages;
  }, [finalEntries, selectedYear, layoutStyle, t, customCoverPhoto]);

  // Calculate stats safely
  const photoCount = finalEntries.reduce((acc, entry) => acc + (entry?.photo ? 1 : 0), 0);
  const displayPhotoCount = photoCount > 0 ? photoCount : 0;
  const displayPages = bookPages.length;

  const handlePrint = async () => {
    try {
      setIsGenerating(true);
      setShowOrderSuccess(true);
    } catch (e) {
      console.error(e);
      toast.error(t('common.error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
     setIsGenerating(true);
     toast.loading(t('print.generating'), { id: 'pdf-gen' });

     try {
         const doc = await generatePDF(bookPages, selectedYear, t, (progress) => {
             toast.loading(`${t('print.generating')} (${Math.round(progress * 100)}%)`, { id: 'pdf-gen' });
         });
         
         doc.save(`PhotoDiary-${selectedYear}-${layoutStyle}.pdf`);
         toast.success(t('common.success'), { id: 'pdf-gen' });
         setShowOrderSuccess(false); // Close modal on success
         
     } catch (e) {
         console.error(e);
         toast.error(t('export.failed'), { id: 'pdf-gen' });
     } finally {
         setIsGenerating(false);
     }
  };


  const handleShareOnline = async () => {
    try {
        setIsSharing(true);
        toast.loading(t('print.sharing') || 'Publishing book...', { id: 'share-book' });
        
        const sharedBook = await shareBook(selectedYear, layoutStyle, bookPages);
        
        // Construct public link
        const url = `${window.location.origin}/share/book/${sharedBook.id}`;
        
        navigator.clipboard.writeText(url).then(() => {
            toast.success(t('print.linkCopied') || 'Link copied!', { id: 'share-book', duration: 4000 });
        });
        
        setShowOrderSuccess(false);
    } catch (e) {
        console.error(e);
        toast.error(t('common.error') || 'Failed to share', { id: 'share-book' });
    } finally {
        setIsSharing(false);
    }
  };

  const toggleEntrySelection = (id: string) => {
    const newSet = new Set(excludedEntryIds);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setExcludedEntryIds(newSet);
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Editor Overlay */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-blue-600" />
                        {t('print.editorTitle') || 'Customize Book Content'}
                    </h2>
                    <p className="text-sm text-gray-500">{finalEntries.length} photos selected</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsEditorOpen(false)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        {t('common.done') || 'Done'}
                    </button>
                </div>
            </div>

            {/* Main Content - Two Columns */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Reorderable List */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900/50">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
                            <span>Drag to reorder • Uncheck to remove</span>
                        </div>
                        
                        <Reorder.Group axis="y" values={customOrderedEntries} onReorder={setCustomOrderedEntries} className="space-y-3">
                            {customOrderedEntries.map((entry) => (
                                <Reorder.Item key={entry.id} value={entry} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 group cursor-grab active:cursor-grabbing">
                                    <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                                        <GripVertical className="w-5 h-5" />
                                    </div>
                                    
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                            {entry.photo && <img src={entry.photo} className={`w-full h-full object-cover transition-opacity ${excludedEntryIds.has(entry.id) ? 'opacity-30 grayscale' : ''}`} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate text-gray-900 dark:text-gray-100">{format(new Date(entry.date), 'MMM d, yyyy')}</div>
                                            <div className="text-sm text-gray-500 truncate">{entry.caption || 'No caption'}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Cover Selection */}
                                        <button 
                                            onClick={() => setCustomCoverPhoto(entry.photo)}
                                            className={`p-2 rounded-lg text-xs font-medium transition-colors ${customCoverPhoto === entry.photo ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:bg-gray-100'}`}
                                            title="Set as Cover Photo"
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                        </button>

                                        {/* Include/Exclude Toggle */}
                                        <Checkbox 
                                            checked={!excludedEntryIds.has(entry.id)}
                                            onCheckedChange={() => toggleEntrySelection(entry.id)}
                                        />
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </div>
                </div>
            </div>
        </div>
      )}

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
                 
                <div className="mt-8 text-xs tracking-[0.2em] text-amber-400 uppercase relative z-10">{t('print.yearBook')}</div>
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
                  <p className="font-serif text-lg italic text-amber-100/80">{t('print.myPhotoDiary')}</p>
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
              <span>{t('print.clickToPreview')}</span>
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
                <span className="text-xs font-bold uppercase">{t('print.photos')}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{displayPhotoCount}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{t('print.pages')}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{displayPages}</div>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('print.selectYear')}</label>
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
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('print.content') || 'Content'}</label>
                    <button 
                        onClick={() => setIsEditorOpen(true)}
                        className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                    >
                        <Edit3 className="w-3 h-3" />
                        {t('print.customize') || 'Customize'}
                    </button>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-sm">
                        <span className="font-bold text-gray-900 dark:text-white">{finalEntries.length}</span> photos selected
                    </div>
                    {customCoverPhoto && (
                        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                            <ImageIcon className="w-3 h-3" />
                            Custom Cover
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('print.layoutStyle')}</label>
              <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLayoutStyle('classic')}
                    className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${layoutStyle === 'classic' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="w-4 h-4 border border-current rounded-sm"></div>
                    {t('print.styles.classic')}
                  </button>
                  <button
                    onClick={() => setLayoutStyle('grid')}
                    className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${layoutStyle === 'grid' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="w-4 h-4 border border-current rounded-sm grid grid-cols-2 gap-[1px] p-[1px]"><div className="bg-current"></div><div className="bg-current"></div><div className="bg-current"></div><div className="bg-current"></div></div>
                    {t('print.styles.grid')}
                  </button>
                  <button
                    onClick={() => setLayoutStyle('magazine')}
                    className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${layoutStyle === 'magazine' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <Layout className="w-4 h-4" />
                    {t('print.styles.magazine')}
                  </button>
                  <button
                    onClick={() => setLayoutStyle('minimal')}
                    className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${layoutStyle === 'minimal' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                     <div className="w-4 h-4 border border-current rounded-sm flex items-center justify-center"><div className="w-2 h-2 bg-current rounded-full"></div></div>
                    {t('print.styles.minimal')}
                  </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('print.format')}</label>
              <div className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      {t('print.photobook')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('print.formatDesc')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600 text-lg">{t('print.free')}</div>
                  </div>
                </div>
                <div className="absolute top-2 right-2 text-blue-500 opacity-0">
                  <Check className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Print Area */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
            
            <button 
              onClick={handlePrint}
              disabled={isGenerating}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : <Printer className="w-5 h-5" />}
              {t('print.checkout')}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
              <ShoppingBag className="w-3 h-3" />
              Free digital download & print-ready PDF
            </p>
          </div>
        </div>
      </div>

      <AlertDialog open={showOrderSuccess} onOpenChange={setShowOrderSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="w-6 h-6" />
              {t('print.successTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('print.successDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 flex-col sm:flex-row">
             <button
               onClick={downloadPDF}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
             >
               <Download className="w-4 h-4" />
               {t('print.downloadPDF')}
             </button>
             
             <button
               onClick={handleShareOnline}
               disabled={isSharing}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
             >
               {isSharing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <Globe className="w-4 h-4" />}
               {t('print.shareOnline') || 'Share Online'}
             </button>

             <button
               onClick={() => {
                 // Create deep link to this specific book configuration (Local only)
                 const url = new URL(window.location.href);
                 url.searchParams.set('year', selectedYear);
                 url.searchParams.set('style', layoutStyle);
                 url.searchParams.set('mode', 'preview'); // Auto-open preview
                 
                 navigator.clipboard.writeText(url.toString()).then(() => {
                    toast.success(t('print.linkCopiedLocal') || 'Local Link Copied', {
                        icon: '�',
                        duration: 4000
                    });
                 }).catch(() => {
                    toast.error(t('common.error'));
                 });
                 setShowOrderSuccess(false);
               }}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors w-full sm:w-auto"
             >
               <Share2 className="w-4 h-4" />
               {t('print.shareLinkLocal') || 'Local Link'}
             </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Book Preview Modal */}
      {isPreviewOpen && (
        <MockBookPreview 
          year={selectedYear} 
          pages={bookPages}
          onClose={() => setIsPreviewOpen(false)} 
        />
      )}
    </div>
  );
}

