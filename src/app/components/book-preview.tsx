import { forwardRef, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import HTMLFlipBook from 'react-pageflip';
import { DiaryEntry } from './diary-entry-form';

interface MockBookPreviewProps {
  year: string;
  pages: any[];
  onClose: () => void;
  readOnly?: boolean; // For shared view
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

export function MockBookPreview({ year, pages, onClose, readOnly = false }: MockBookPreviewProps) {
  const { t } = useTranslation();
  const bookRef = useRef<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    setTotalPages(pages.length + 1); 
  }, [pages]);

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
             <div className="text-amber-400 tracking-[0.3em] uppercase text-sm mb-4">{t('print.theYearOf') || 'The Year Of'}</div>
             <h1 className="text-6xl font-serif font-bold text-amber-100 mb-8">{year}</h1>
             <div className="w-32 h-32 rounded-full border-4 border-amber-100/30 overflow-hidden mb-8">
               <img src={page.coverPhoto || "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&auto=format&fit=crop&q=60"} className="w-full h-full object-cover" />
             </div>
             <p className="text-xl font-light italic text-amber-200">{page.subtitle}</p>
           </div>
        </div>
      );
    }

    if (page.type === 'intro') {
      return (
        <div className="w-full h-full bg-[#fdfbf7] p-12 flex flex-col items-center justify-center text-center">
          <h2 className="text-3xl font-serif text-gray-800 mb-6">{t('print.introduction') || 'Introduction'}</h2>
          <p className="text-lg text-gray-600 italic leading-relaxed max-w-md">{page.text}</p>
          <div className="mt-auto text-xs text-gray-400">{index + 1}</div>
        </div>
      );
    }

    if (page.type === 'entry') {
      return (
        <div className="w-full h-full bg-[#fdfbf7] p-8 flex flex-col">
           <div className="flex justify-between items-baseline border-b border-gray-200 pb-4 mb-6">
             <h3 className="text-xl font-bold text-gray-900">{page.date ? format(new Date(page.date), 'MMMM d') : ''}</h3>
             <span className="text-xs text-gray-500 uppercase">{page.location}</span>
           </div>
           <div className="w-full aspect-video bg-gray-100 mb-6 rounded-lg overflow-hidden shadow-sm">
             <img src={page.photo} className="w-full h-full object-cover" />
           </div>
           <p className="text-gray-700 font-serif leading-relaxed line-clamp-6">{page.caption}</p>
           <div className="mt-auto pt-4 flex justify-between items-center">
             <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">Mood: {page.mood}</span>
             <span className="text-xs text-gray-400">{index + 1}</span>
           </div>
        </div>
      );
    }

    if (page.type === 'grid') {
        return (
          <div className="w-full h-full bg-[#fdfbf7] p-8 flex flex-col">
            <div className={`grid gap-4 flex-1 content-start ${page.layout === 'grid-4' ? 'grid-cols-2 grid-rows-2' : 'grid-cols-2'}`}>
               {page.entries?.map((entry: DiaryEntry, i: number) => (
                 <div key={i} className="relative group rounded-lg overflow-hidden shadow-sm aspect-square bg-gray-100">
                   <img src={entry.photo} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-2">
                       <span className="text-xs text-white opacity-0 group-hover:opacity-100 truncate w-full">{entry.caption}</span>
                   </div>
                 </div>
               ))}
            </div>
            <div className="mt-auto text-right text-xs text-gray-400 pt-4">{index + 1}</div>
          </div>
        );
      }

    if (page.type === 'collage') {
      // Magazine Style Layout
      const photos = page.entries || [];
      const mainPhoto = photos[0];
      const otherPhotos = photos.slice(1);
      
      return (
        <div className="w-full h-full bg-[#fdfbf7] p-0 flex flex-col relative overflow-hidden">
          {/* Full bleed top photo */}
          <div className="h-1/2 w-full relative">
             <img src={mainPhoto?.photo} className="w-full h-full object-cover" />
             <div className="absolute bottom-0 left-0 bg-white px-4 py-2 rounded-tr-xl">
                <span className="font-serif italic text-lg">{mainPhoto?.date ? format(new Date(mainPhoto.date), 'MMM d') : ''}</span>
             </div>
          </div>
          
          <div className="flex-1 p-6 flex gap-4">
             <div className="flex-1 space-y-4">
                <p className="text-sm font-serif leading-relaxed text-gray-600 first-letter:text-3xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:text-gray-900">
                    {page.caption}
                </p>
             </div>
             <div className="w-1/3 flex flex-col gap-2">
                 {otherPhotos.map((p: DiaryEntry, i: number) => (
                     <div key={i} className="flex-1 bg-gray-100 rounded-lg overflow-hidden">
                         <img src={p.photo} className="w-full h-full object-cover" />
                     </div>
                 ))}
             </div>
          </div>
          
          <div className="absolute bottom-4 right-6 text-xs text-gray-400">{index + 1}</div>
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
                {renderPageContent(pages[0], 0)}
            </Page>

            {/* Inner Pages */}
            {pages.slice(1).map((page, index) => (
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
        {t('print.flipInstruction') || 'Use Arrow Keys or Click Corners to Flip'}
      </div>
    </div>
  );
}