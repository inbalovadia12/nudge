import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`w-11 h-11 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors ${className}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}