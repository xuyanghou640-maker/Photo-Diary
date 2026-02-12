import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../../i18n';

type Theme = 'light' | 'dark';
type AccentColor = 'blue' | 'purple' | 'pink' | 'orange' | 'green';
type Language = 'en' | 'zh' | 'ja' | 'ko';

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  language: Language;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  setLanguage: (lang: Language) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage or default
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });
  
  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('accentColor');
    return (saved as AccentColor) || 'blue';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    // Default to browser language or 'en'
    const browserLang = navigator.language.split('-')[0];
    const supported = ['en', 'zh', 'ja', 'ko'];
    return (saved as Language) || (supported.includes(browserLang) ? browserLang as Language : 'en');
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Initialize i18n on mount
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove old class
    root.classList.remove('light', 'dark');
    
    // Add new class
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Apply accent color (we'll implement this by setting CSS variables or class names)
  useEffect(() => {
    localStorage.setItem('accentColor', accentColor);
    
    // Update CSS variables for primary color based on accent
    const root = window.document.documentElement;
    let primaryColor = '#030213'; // Default blue-ish
    let primaryForeground = 'oklch(1 0 0)';

    // Define colors for light mode
    if (theme === 'light') {
      switch (accentColor) {
        case 'blue': primaryColor = '#2563eb'; break; // blue-600
        case 'purple': primaryColor = '#9333ea'; break; // purple-600
        case 'pink': primaryColor = '#db2777'; break; // pink-600
        case 'orange': primaryColor = '#ea580c'; break; // orange-600
        case 'green': primaryColor = '#16a34a'; break; // green-600
      }
    } else {
      // Dark mode colors (usually lighter/brighter)
      switch (accentColor) {
        case 'blue': primaryColor = '#60a5fa'; break; // blue-400
        case 'purple': primaryColor = '#c084fc'; break; // purple-400
        case 'pink': primaryColor = '#f472b6'; break; // pink-400
        case 'orange': primaryColor = '#fb923c'; break; // orange-400
        case 'green': primaryColor = '#4ade80'; break; // green-400
      }
      primaryForeground = 'oklch(0.205 0 0)';
    }

    // We can update the CSS variable --primary directly
    // Note: Tailwind v4 uses --color-primary in @theme, which maps to --primary variable in :root
    // However, since we are using CSS variables in theme.css, we can update them.
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--primary-foreground', primaryForeground);

  }, [accentColor, theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, accentColor, language, setTheme, setAccentColor, setLanguage, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}