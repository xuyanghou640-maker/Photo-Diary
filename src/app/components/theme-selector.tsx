import { Moon, Sun, Palette, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export function ThemeSelector() {
  const { theme, toggleTheme, accentColor, setAccentColor } = useTheme();

  const colors = [
    { name: 'blue', class: 'bg-blue-500' },
    { name: 'purple', class: 'bg-purple-500' },
    { name: 'pink', class: 'bg-pink-500' },
    { name: 'orange', class: 'bg-orange-500' },
    { name: 'green', class: 'bg-green-500' },
  ] as const;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Theme Settings"
        >
          <Palette className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-64 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Dark Mode</span>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200`}
              />
              <span className="absolute left-1.5 top-1.5 text-[10px] text-gray-500">
                <Sun className={`w-3 h-3 ${theme === 'dark' ? 'opacity-0' : 'opacity-100'}`} />
              </span>
              <span className="absolute right-1.5 top-1.5 text-[10px] text-white">
                <Moon className={`w-3 h-3 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`} />
              </span>
            </button>
          </div>

          <div className="h-px bg-gray-200 dark:bg-gray-800" />

          {/* Color Selector */}
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 block">Accent Color</span>
            <div className="flex justify-between gap-2">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setAccentColor(color.name)}
                  className={`w-8 h-8 rounded-full ${color.class} flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-gray-400`}
                >
                  {accentColor === color.name && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}