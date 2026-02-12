import { useMemo } from 'react';
import { DiaryEntry } from './diary-entry-form';
import { getMoodColor } from '../utils/mood-constants';
import { Tooltip } from 'react-tooltip';
import { eachDayOfInterval, startOfYear, endOfYear, getDay, format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface MoodPixelGridProps {
  entries: DiaryEntry[];
}

export function MoodPixelGrid({ entries }: MoodPixelGridProps) {
  const { t } = useTranslation();
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const start = startOfYear(today);
    const end = endOfYear(today);
    
    // Create map for fast lookup
    const entryMap = new Map<string, DiaryEntry>();
    entries.forEach(entry => {
      const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
      entryMap.set(dateKey, entry);
    });

    const days = eachDayOfInterval({ start, end });
    const weeks: Array<Array<{ date: Date; entry?: DiaryEntry } | null>> = [];
    
    // Group days into weeks (Mon-Sun)
    let currentWeek: Array<{ date: Date; entry?: DiaryEntry } | null> = [];
    
    // Add empty slots for the first week if it doesn't start on Monday
    const firstDayOfWeek = (getDay(start) + 6) % 7; 
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    days.forEach(day => {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      const dateKey = format(day, 'yyyy-MM-dd');
      currentWeek.push({
        date: day,
        entry: entryMap.get(dateKey)
      });
    });

    // Push the last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    // Calculate month labels positions
    const monthLabels: { label: string; weekIndex: number }[] = [];
    let currentMonth = -1;
    
    weeks.forEach((week, weekIndex) => {
      const firstDayInWeek = week.find(d => d !== null);
      if (firstDayInWeek) {
        const month = firstDayInWeek.date.getMonth();
        if (month !== currentMonth) {
          monthLabels.push({
            label: format(firstDayInWeek.date, 'MMM'),
            weekIndex
          });
          currentMonth = month;
        }
      }
    });

    return { weeks, monthLabels };
  }, [entries]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('insights.yearInPixels')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('insights.pixelDesc')}</p>
        </div>
        <div className="flex gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-sm"></span> {t('insights.noData')}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded-sm"></span> {t('insights.mood')}</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-2">
        <div className="min-w-max">
          {/* Month Labels */}
          <div className="flex mb-2 text-xs text-gray-400 relative h-4">
            {monthLabels.map((m, i) => (
              <div 
                key={m.label} 
                className="absolute"
                style={{ left: `${m.weekIndex * 14}px` }} // 10px width + 4px gap approx
              >
                {m.label}
              </div>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {/* Weekday Labels */}
            <div className="flex flex-col gap-[3px] text-[10px] text-gray-400 pt-[14px] pr-2">
              <div className="h-[10px]">Mon</div>
              <div className="h-[10px]">Wed</div>
              <div className="h-[10px]">Fri</div>
            </div>

            {/* The Grid - Rendered Column by Column (Weeks) */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIndex) => (
                <div key={wIndex} className="flex flex-col gap-[3px]">
                  {week.map((day, dIndex) => {
                    // Only show label for Mon(0), Wed(2), Fri(4) rows to match labels
                    return (
                      <div
                        key={dIndex}
                        data-tooltip-id="pixel-tooltip"
                        data-tooltip-content={day ? `${format(day.date, 'MMM do, yyyy')}: ${day.entry?.mood ? t(`moods.${day.entry.mood.toLowerCase()}`, day.entry.mood) : t('insights.noData')}` : ''}
                        className={`w-[10px] h-[10px] rounded-[2px] transition-all ${day ? 'hover:ring-2 ring-offset-1 ring-blue-200 cursor-pointer' : 'opacity-0'}`}
                        style={{ 
                          backgroundColor: day?.entry ? getMoodColor(day.entry.mood) : (day ? '#e5e7eb' : 'transparent') 
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Tooltip id="pixel-tooltip" className="z-50 rounded-lg text-xs py-1 px-2 shadow-lg" />
    </div>
  );
}