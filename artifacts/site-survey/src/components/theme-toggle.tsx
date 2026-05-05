import { Moon, Sun } from 'lucide-react';
import { useThemeMode } from '@/hooks/use-theme-mode';

export default function ThemeToggle() {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <button
      onClick={toggleTheme}
      className="fixed right-4 bottom-4 z-[60] p-3 rounded-full bg-card border border-border shadow-lg hover:shadow-xl transition-all"
      aria-label="Toggle dark mode"
      title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {mode === 'dark' ? <Sun className="w-4 h-4 text-foreground" /> : <Moon className="w-4 h-4 text-foreground" />}
    </button>
  );
}
