import { Smile, Frown, Heart, Zap, Coffee, Sparkles, CloudRain, Sun } from 'lucide-react';

export const MOODS = [
  { name: 'Happy', icon: Smile, color: 'bg-yellow-100 text-yellow-700', hex: '#fcd34d' },
  { name: 'Sad', icon: Frown, color: 'bg-blue-100 text-blue-700', hex: '#60a5fa' },
  { name: 'Grateful', icon: Heart, color: 'bg-pink-100 text-pink-700', hex: '#f472b6' },
  { name: 'Excited', icon: Zap, color: 'bg-purple-100 text-purple-700', hex: '#a78bfa' },
  { name: 'Calm', icon: Coffee, color: 'bg-green-100 text-green-700', hex: '#4ade80' },
  { name: 'Inspired', icon: Sparkles, color: 'bg-indigo-100 text-indigo-700', hex: '#818cf8' },
  { name: 'Stressed', icon: CloudRain, color: 'bg-gray-100 text-gray-700', hex: '#9ca3af' },
  { name: 'Energetic', icon: Sun, color: 'bg-orange-100 text-orange-700', hex: '#fb923c' },
];

export const getMoodColor = (moodName: string) => {
  const mood = MOODS.find(m => m.name === moodName);
  return mood?.hex || '#e5e7eb'; // Default gray
};