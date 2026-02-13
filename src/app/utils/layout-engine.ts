import { DiaryEntry } from '../components/diary-entry-form';
import { format } from 'date-fns';

export type LayoutStyle = 'classic' | 'grid' | 'magazine' | 'minimal';

export interface BookPage {
  type: 'cover' | 'intro' | 'entry' | 'collage' | 'outro' | 'grid';
  title?: string;
  subtitle?: string;
  text?: string;
  entries?: DiaryEntry[]; // For grids/collages
  // Legacy support for single entry pages
  date?: string;
  mood?: string;
  location?: string;
  photo?: string;
  caption?: string;
  coverPhoto?: string;
  layout?: string; // 'grid-2' | 'grid-3' | 'grid-4'
}

export function generateBookLayout(entries: DiaryEntry[], year: string, style: LayoutStyle, t: (key: string, options?: any) => string): BookPage[] {
  const pages: BookPage[] = [];
  
  // 1. Cover
  pages.push({
    type: 'cover',
    title: year,
    subtitle: t('print.storyOfUs'),
    coverPhoto: entries[0]?.photo || 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&auto=format&fit=crop&q=60'
  });

  // 2. Intro
  pages.push({
    type: 'intro',
    text: t('print.introText', { year }),
  });

  // 3. Content Pages
  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (style === 'classic') {
    // One entry per page
    sortedEntries.forEach(entry => {
      pages.push({
        type: 'entry',
        date: entry.date,
        mood: entry.mood,
        location: entry.location?.name || 'Unknown Location',
        photo: entry.photo,
        caption: entry.caption,
      });
    });
  } else if (style === 'grid') {
    // Grid layout: 4 photos per page
    for (let i = 0; i < sortedEntries.length; i += 4) {
      const chunk = sortedEntries.slice(i, i + 4);
      pages.push({
        type: 'grid',
        layout: 'grid-4',
        entries: chunk
      });
    }
  } else if (style === 'magazine') {
    // Mixed layout: Single for important ones (long caption), Grid for others
    let i = 0;
    while (i < sortedEntries.length) {
      const current = sortedEntries[i];
      // If long caption (> 50 chars), give it a full page
      if (current.caption && current.caption.length > 50) {
        pages.push({
          type: 'entry',
          date: current.date,
          mood: current.mood,
          location: current.location?.name,
          photo: current.photo,
          caption: current.caption,
        });
        i++;
      } else {
        // Otherwise try to group 2 or 3
        const remaining = sortedEntries.length - i;
        const groupSize = Math.min(Math.random() > 0.5 ? 2 : 3, remaining);
        const chunk = sortedEntries.slice(i, i + groupSize);
        pages.push({
          type: 'collage',
          layout: `collage-${groupSize}`,
          entries: chunk,
          caption: chunk.map(e => e.caption).join(' • ')
        });
        i += groupSize;
      }
    }
  } else if (style === 'minimal') {
    // Minimal: Just photos, clean grid 2x2
    for (let i = 0; i < sortedEntries.length; i += 2) {
        const chunk = sortedEntries.slice(i, i + 2);
        pages.push({
          type: 'grid',
          layout: 'grid-2',
          entries: chunk
        });
      }
  }

  // 4. Outro
  pages.push({
    type: 'outro',
    text: t('print.toBeContinued'),
  });

  return pages;
}
