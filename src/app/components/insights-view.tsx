import { useMemo, useState } from 'react';
import { DiaryEntry } from './diary-entry-form';
import { format, subDays, parseISO, isSameDay } from 'date-fns';
import { Disc, Play, X, Music, Volume2, Map as MapIcon, Calendar, Quote, ListMusic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { LazyImage } from './ui/lazy-image';

interface InsightsViewProps {
  entries: DiaryEntry[];
}

const moodColors: Record<string, string> = {
  'Happy': 'text-yellow-400', 'Excited': 'text-purple-400', 'Energetic': 'text-orange-400', 
  'Grateful': 'text-pink-400', 'Inspired': 'text-indigo-400', 'Calm': 'text-green-400', 
  'Stressed': 'text-gray-400', 'Sad': 'text-blue-400', 'Anxious': 'text-slate-400',
  'Angry': 'text-red-400', 'Tired': 'text-stone-400', 'Neutral': 'text-zinc-400'
};

// --- Sub-components ---

function VinylRecord({ photo, label, onClick }: { photo: string, label: string, onClick: () => void }) {
  return (
    <div className="relative group cursor-pointer" onClick={onClick}>
      {/* Sleeve */}
      <div className="absolute top-0 left-0 w-full h-full bg-gray-900 rounded shadow-2xl z-0 transform -rotate-2 translate-x-2 translate-y-2" />
      
      {/* Record Container */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-black shadow-2xl p-8 mx-auto z-10 border-4 border-gray-800"
        style={{
          backgroundImage: `repeating-radial-gradient(
            #111 0, 
            #111 2px, 
            #222 3px, 
            #222 4px
          )`
        }}
      >
        {/* Album Art (Center Photo) */}
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-900 relative">
          <LazyImage src={photo} className="w-full h-full object-cover" />
          {/* Center Hole */}
          <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-gray-300 z-20" />
        </div>
      </motion.div>

      {/* Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-white/20 backdrop-blur-md p-4 rounded-full">
          <Play className="w-8 h-8 text-white fill-current" />
        </div>
      </div>

      {/* Label */}
      <div className="absolute -bottom-12 left-0 right-0 text-center">
        <p className="font-mono text-sm tracking-widest text-gray-500 uppercase">{label}</p>
      </div>
    </div>
  );
}

function TrackList({ entries }: { entries: DiaryEntry[] }) {
  const { t } = useTranslation();
  // Show only top 5 recent entries as "tracks"
  const tracks = entries.slice(0, 5);

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-3xl p-6 border border-white/5">
      <div className="flex items-center gap-2 mb-6 text-white/50">
        <ListMusic className="w-4 h-4" />
        <span className="text-xs font-mono uppercase tracking-widest">Side B • Tracklist</span>
      </div>
      
      <div className="space-y-1">
        {tracks.map((entry, i) => {
           const date = new Date(entry.date);
           return (
            <motion.div 
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-default"
            >
              <span className="font-mono text-xs text-zinc-600 w-6">{(i + 1).toString().padStart(2, '0')}</span>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                  {entry.caption || t('common.untitled')}
                </div>
                <div className="text-xs text-zinc-500 truncate flex items-center gap-2">
                  <span>{format(date, 'MMM d')}</span>
                  <span>•</span>
                  <span>{typeof entry.location === 'object' ? (entry.location.name || 'Unknown') : (entry.location || 'Unknown')}</span>
                </div>
              </div>

              <div className={`text-xs ${moodColors[entry.mood] || 'text-zinc-500'}`}>
                {t(`moods.${entry.mood.toLowerCase()}`)}
              </div>
            </motion.div>
           );
        })}
      </div>
    </div>
  );
}

function LyricCard({ entry }: { entry: DiaryEntry }) {
  if (!entry) return null;

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-3xl p-8 border border-white/5 relative overflow-hidden flex flex-col justify-center min-h-[300px]">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Quote className="w-32 h-32" />
      </div>
      
      <div className="relative z-10">
        <Quote className="w-8 h-8 text-white/20 mb-4" />
        <p className="text-2xl md:text-3xl font-serif text-white/90 leading-relaxed italic">
          "{entry.caption}"
        </p>
        <div className="mt-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-700">
             <LazyImage src={entry.photo} className="w-full h-full object-cover" />
          </div>
          <div className="text-xs font-mono text-zinc-500">
            Recorded on {format(new Date(entry.date), 'MMMM d')}
          </div>
        </div>
      </div>
    </div>
  );
}

export function InsightsView({ entries }: InsightsViewProps) {
  const { t } = useTranslation();
  const [showStory, setShowStory] = useState(false);

  // Data Logic
  const currentMonth = useMemo(() => format(new Date(), 'MMMM'), []);
  const bestEntry = useMemo(() => entries[0], [entries]); // Simplification: assume first is best for demo

  if (!entries.length) return (
    <div className="text-center py-20 text-gray-400">
      <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>{t('insights.noData')}</p>
    </div>
  );

  const bgColors: Record<string, string> = {
    'Happy': 'from-yellow-900/50 to-orange-900/50',
    'Excited': 'from-purple-900/50 to-pink-900/50',
    'Energetic': 'from-orange-900/50 to-red-900/50',
    'Grateful': 'from-pink-900/50 to-rose-900/50',
    'Inspired': 'from-indigo-900/50 to-blue-900/50',
    'Calm': 'from-green-900/50 to-emerald-900/50',
    'Stressed': 'from-gray-900/50 to-slate-900/50',
    'Sad': 'from-blue-900/50 to-cyan-900/50',
    'Anxious': 'from-slate-900/50 to-gray-900/50',
    'Angry': 'from-red-900/50 to-orange-900/50',
    'Tired': 'from-stone-900/50 to-zinc-900/50',
    'Neutral': 'from-zinc-900/50 to-stone-900/50'
  };

  const bgGradient = bgColors[bestEntry?.mood] || 'from-zinc-900 to-black';

  return (
    <div className={`pb-32 space-y-8 animate-in fade-in duration-700 min-h-screen bg-gradient-to-b ${bgGradient} p-8`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Hero Vinyl (Span 7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-8 py-20 relative overflow-hidden rounded-[3rem] bg-black/40 backdrop-blur-xl border border-white/5 min-h-[600px]">
          {/* Dynamic Background */}
          <div className="absolute inset-0 z-0">
               <LazyImage 
                  src={bestEntry?.photo || ''} 
                  className="w-full h-full object-cover opacity-30 blur-3xl scale-150 animate-pulse-slow" 
                />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
          </div>

          <div className="text-center space-y-2 z-10 relative">
            <h2 className="text-5xl font-black tracking-tighter uppercase italic text-white drop-shadow-2xl">
              {currentMonth} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-500">Mixtape</span>
            </h2>
            <p className="text-sm font-mono text-white/60 tracking-[0.3em] uppercase">SIDE A • {new Date().getFullYear()}</p>
          </div>

          <div className="scale-110 transform transition-transform hover:scale-115 duration-500">
            <VinylRecord 
              photo={bestEntry?.photo || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000'} 
              label="TAP TO PLAY STORY"
              onClick={() => setShowStory(true)}
            />
          </div>
        </div>

        {/* Right Column: B-Side Content (Span 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Lyric Card */}
          <div className="h-[320px]">
            <LyricCard entry={entries.find(e => e.caption && e.caption.length > 10) || entries[0]} />
          </div>
          
          {/* Tracklist */}
          <TrackList entries={entries} />
        </div>

      </div>

      {/* Story Mode Overlay */}
      <AnimatePresence>
        {showStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4"
          >
            <button 
              onClick={() => setShowStory(false)}
              className="absolute top-6 right-6 text-white/50 hover:text-white p-2 z-50"
            >
              <X className="w-8 h-8" />
            </button>
            
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-lg w-full aspect-[9/16] bg-zinc-900 rounded-[2rem] overflow-hidden relative shadow-2xl border border-white/10"
            >
              {/* Full Screen Photo */}
              <LazyImage 
                src={bestEntry?.photo || ''} 
                className="w-full h-full object-cover" 
              />
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90" />
              
              {/* Content */}
              <div className="absolute top-8 left-0 right-0 text-center">
                 <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">
                   Monthly Highlight
                 </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Disc className="w-5 h-5 animate-spin-slow" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Now Playing</div>
                    <div className="text-sm font-bold">{t(`moods.${bestEntry?.mood.toLowerCase()}`)} Vibes</div>
                  </div>
                </div>

                <h2 className="text-2xl font-serif font-bold leading-tight mb-4 line-clamp-3">
                  "{bestEntry?.caption || 'A moment frozen in time.'}"
                </h2>
                
                <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4">
                  <div className="font-mono text-xs text-gray-400">
                    {format(new Date(bestEntry?.date || Date.now()), 'yyyy.MM.dd')}
                  </div>
                  <div className="font-mono text-xs text-gray-400">
                    {typeof bestEntry?.location === 'object' ? (bestEntry.location.name || 'Unknown') : (bestEntry?.location || 'Unknown Location')}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}