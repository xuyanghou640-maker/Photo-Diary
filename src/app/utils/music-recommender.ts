import { MOODS } from './mood-constants';

interface MusicRecommendation {
  platform: 'Netease' | 'Kugou';
  title: string;
  url: string;
}

export const getMoodPlaylist = (moodName: string): MusicRecommendation[] => {
  // Simple mapping of moods to specific playlists or search queries
  // In a real app, this might call an API or use a more sophisticated algorithm
  const mood = moodName.toLowerCase();
  
  const recommendations: Record<string, MusicRecommendation[]> = {
    happy: [
      { platform: 'Netease', title: 'Happy Vibes Playlist', url: 'https://music.163.com/#/search/m/?s=happy' },
      { platform: 'Kugou', title: 'Upbeat Hits', url: 'https://www.kugou.com/yy/html/search.html#searchType=song&searchKeyWord=happy' }
    ],
    sad: [
      { platform: 'Netease', title: 'Melancholy Melodies', url: 'https://music.163.com/#/search/m/?s=sad%20songs' },
      { platform: 'Kugou', title: 'Comforting Ballads', url: 'https://www.kugou.com/yy/html/search.html#searchType=song&searchKeyWord=sad' }
    ],
    excited: [
      { platform: 'Netease', title: 'High Energy', url: 'https://music.163.com/#/search/m/?s=party' },
      { platform: 'Kugou', title: 'Adrenaline Rush', url: 'https://www.kugou.com/yy/html/search.html#searchType=song&searchKeyWord=energy' }
    ],
    calm: [
      { platform: 'Netease', title: 'Relaxing Piano', url: 'https://music.163.com/#/search/m/?s=relaxing' },
      { platform: 'Kugou', title: 'Zen Garden', url: 'https://www.kugou.com/yy/html/search.html#searchType=song&searchKeyWord=calm' }
    ],
    grateful: [
      { platform: 'Netease', title: 'Thankful Hearts', url: 'https://music.163.com/#/search/m/?s=grateful' },
      { platform: 'Kugou', title: 'Warm Feelings', url: 'https://www.kugou.com/yy/html/search.html#searchType=song&searchKeyWord=warm' }
    ],
    inspired: [
      { platform: 'Netease', title: 'Creative Flow', url: 'https://music.163.com/#/search/m/?s=inspiration' },
      { platform: 'Kugou', title: 'Focus & Study', url: 'https://www.kugou.com/yy/html/search.html#searchType=song&searchKeyWord=focus' }
    ],
    stressed: [
      { platform: 'Netease', title: 'Stress Relief', url: 'https://music.163.com/#/search/m/?s=stress%20relief' },
      { platform: 'Kugou', title: 'Nature Sounds', url: 'https://www.kugou.com/yy/html/search.html#searchType=song&searchKeyWord=nature' }
    ],
    energetic: [
      { platform: 'Netease', title: 'Workout Mix', url: 'https://music.163.com/#/search/m/?s=workout' },
      { platform: 'Kugou', title: 'Power Anthems', url: 'https://www.kugou.com/yy/html/search.html#searchType=song&searchKeyWord=power' }
    ]
  };

  return recommendations[mood] || [
    { platform: 'Netease', title: 'Daily Recommendations', url: 'https://music.163.com/#/discover' },
    { platform: 'Kugou', title: 'Top Charts', url: 'https://www.kugou.com/' }
  ];
};