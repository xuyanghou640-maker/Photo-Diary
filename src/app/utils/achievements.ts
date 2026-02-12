import { DiaryEntry } from '../components/diary-entry-form';
import { Trophy, Flame, Map, Palette, Camera, Calendar } from 'lucide-react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  condition: (entries: DiaryEntry[]) => boolean;
  progress: (entries: DiaryEntry[]) => number;
  maxProgress: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-step',
    title: 'First Memory',
    description: 'Create your first diary entry',
    icon: Camera,
    color: 'text-blue-500 bg-blue-100',
    condition: (entries) => entries.length >= 1,
    progress: (entries) => Math.min(entries.length, 1),
    maxProgress: 1
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Post consecutively for 7 days',
    icon: Flame,
    color: 'text-orange-500 bg-orange-100',
    condition: (entries) => calculateStreak(entries) >= 7,
    progress: (entries) => Math.min(calculateStreak(entries), 7),
    maxProgress: 7
  },
  {
    id: 'mood-explorer',
    title: 'Emotional Spectrum',
    description: 'Log 5 different moods',
    icon: Palette,
    color: 'text-purple-500 bg-purple-100',
    condition: (entries) => new Set(entries.map(e => e.mood)).size >= 5,
    progress: (entries) => Math.min(new Set(entries.map(e => e.mood)).size, 5),
    maxProgress: 5
  },
  {
    id: 'globetrotter',
    title: 'Globetrotter',
    description: 'Post from 3 different locations',
    icon: Map,
    color: 'text-green-500 bg-green-100',
    condition: (entries) => new Set(entries.filter(e => e.location).map(e => e.location?.name || '')).size >= 3,
    progress: (entries) => Math.min(new Set(entries.filter(e => e.location).map(e => e.location?.name || '')).size, 3),
    maxProgress: 3
  },
  {
    id: 'month-master',
    title: 'Dedicated Diarist',
    description: 'Reach 30 total entries',
    icon: Trophy,
    color: 'text-yellow-500 bg-yellow-100',
    condition: (entries) => entries.length >= 30,
    progress: (entries) => Math.min(entries.length, 30),
    maxProgress: 30
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Post an entry before 8 AM',
    icon: Calendar,
    color: 'text-sky-500 bg-sky-100',
    condition: (entries) => entries.some(e => new Date(e.date).getHours() < 8),
    progress: (entries) => entries.some(e => new Date(e.date).getHours() < 8) ? 1 : 0,
    maxProgress: 1
  }
];

function calculateStreak(entries: DiaryEntry[]): number {
  if (entries.length === 0) return 0;
  
  // Sort entries by date descending
  const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let currentDate = new Date(sorted[0].date);
  currentDate.setHours(0, 0, 0, 0);

  // Check if the latest entry is today or yesterday (streak active)
  const diffTime = Math.abs(today.getTime() - currentDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays > 1) return 0; // Streak broken

  streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const d1 = new Date(sorted[i].date);
    d1.setHours(0, 0, 0, 0);
    const d2 = new Date(sorted[i+1].date);
    d2.setHours(0, 0, 0, 0);
    
    const diff = (d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
    
    if (diff === 1) {
      streak++;
    } else if (diff > 1) {
      break;
    }
    // If diff is 0 (same day), continue
  }
  
  return streak;
}