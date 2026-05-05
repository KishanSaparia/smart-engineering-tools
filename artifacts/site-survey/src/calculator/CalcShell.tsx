/**
 * CalcShell.tsx – Shared layout shell for all Electrical Calculator pages.
 * Provides: sticky header with colour-coded accent bar, breadcrumb, page body.
 */
import { useLocation } from 'wouter';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

export type AccentColor = 'primary' | 'orange' | 'violet' | 'cyan' | 'emerald' | 'amber';

interface CalcShellProps {
  /** Icon element shown in header badge */
  icon: ReactNode;
  /** Tailwind bg class for icon container, e.g. "bg-primary" */
  iconBg?: string;
  title: string;
  subtitle: string;
  /** Page body content */
  children: ReactNode;
  /** Breadcrumb last label, defaults to title */
  breadcrumbLabel?: string;
  /** Per-module accent colour for the header bar */
  accent?: AccentColor;
}

const ACCENT_BAR: Record<AccentColor, string> = {
  primary: 'from-primary via-primary/40 to-transparent',
  orange:  'from-orange-500 via-orange-400/40 to-transparent',
  violet:  'from-violet-500 via-violet-400/40 to-transparent',
  cyan:    'from-cyan-500 via-cyan-400/40 to-transparent',
  emerald: 'from-emerald-500 via-emerald-400/40 to-transparent',
  amber:   'from-amber-500 via-amber-400/40 to-transparent',
};

export default function CalcShell({
  icon,
  iconBg = 'bg-primary',
  title,
  subtitle,
  children,
  breadcrumbLabel,
  accent = 'primary',
}: CalcShellProps) {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-200">
      {/* ── Sticky Header ─────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border">
        {/* Module-specific colour accent bar */}
        <div className={`h-[3px] w-full bg-gradient-to-r ${ACCENT_BAR[accent]}`} />

        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/calculator')}
            className="p-2 -ml-1 rounded-xl hover:bg-muted transition-colors shrink-0"
            aria-label="Back to Calculators"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
            {icon}
          </div>

          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground tracking-tight leading-tight truncate">
              {title}
            </h1>
            <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
      </header>

      {/* ── Breadcrumb ─────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
          <button
            onClick={() => navigate('/home')}
            className="hover:text-foreground transition-colors"
          >
            Home
          </button>
          <ChevronRight className="w-3 h-3 opacity-50" />
          <button
            onClick={() => navigate('/calculator')}
            className="hover:text-foreground transition-colors"
          >
            Calculators
          </button>
          <ChevronRight className="w-3 h-3 opacity-50" />
          <span className="text-foreground font-medium truncate">
            {breadcrumbLabel ?? title}
          </span>
        </nav>
      </div>

      {/* ── Page Body ──────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 pb-16 pt-5 space-y-5">
        {children}
      </main>
    </div>
  );
}
