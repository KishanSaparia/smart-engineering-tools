import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Zap, Calculator, ChevronRight, Activity, Cable, BrainCircuit,
  Gauge, Settings, Network, Flame, Cpu, ShieldCheck, Wifi,
  LayoutGrid, Star, Layers
} from 'lucide-react';

/* ─── Card Data ──────────────────────────────────────────── */

interface CalcCard {
  id?: string;
  route: string;
  icon: React.ReactNode;
  accentFrom: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  accentArrow: string;
  badge?: string;
  badgeCls?: string;
  title: string;
  description: string;
}

type Category = { label: string; icon: React.ReactNode; cards: CalcCard[] };

const CATEGORIES: Category[] = [
  {
    label: 'Basic Tools',
    icon: <Cpu className="w-4 h-4" />,
    cards: [
      {
        id: 'calc-transformer-sc',
        route: '/calculator/transformer-sc',
        icon: <Zap className="w-6 h-6" />,
        accentFrom:   'from-blue-500/15',
        accentText:   'text-blue-600 dark:text-blue-400',
        accentBg:     'bg-blue-500/10 group-hover:bg-blue-500/20',
        accentBorder: 'hover:border-blue-400/40',
        accentArrow:  'group-hover:text-blue-500',
        title: 'Transformer Short Circuit',
        description: 'Calculate primary & secondary fault current for three-phase transformers assuming infinite bus.',
      },
      {
        id: 'calc-voltage-drop',
        route: '/calculator/voltage-drop',
        icon: <Activity className="w-6 h-6" />,
        accentFrom:   'from-cyan-500/15',
        accentText:   'text-cyan-600 dark:text-cyan-400',
        accentBg:     'bg-cyan-500/10 group-hover:bg-cyan-500/20',
        accentBorder: 'hover:border-cyan-400/40',
        accentArrow:  'group-hover:text-cyan-500',
        title: 'Voltage Drop Calculator',
        description: 'Calculate cable voltage drop and percentage for three-phase systems with cable size recommendations.',
      },
      {
        id: 'calc-cable-size',
        route: '/calculator/cable-size',
        icon: <Cable className="w-6 h-6" />,
        accentFrom:   'from-violet-500/15',
        accentText:   'text-violet-600 dark:text-violet-400',
        accentBg:     'bg-violet-500/10 group-hover:bg-violet-500/20',
        accentBorder: 'hover:border-violet-400/40',
        accentArrow:  'group-hover:text-violet-500',
        title: 'Cable Size Calculator',
        description: 'Find cable size or check ampacity based on NEC 310.15(B)(16). Supports parallel conductors.',
      },
      {
        id: 'calc-full-load-current',
        route: '/calculator/full-load-current',
        icon: <Gauge className="w-6 h-6" />,
        accentFrom:   'from-amber-500/15',
        accentText:   'text-amber-600 dark:text-amber-400',
        accentBg:     'bg-amber-500/10 group-hover:bg-amber-500/20',
        accentBorder: 'hover:border-amber-400/40',
        accentArrow:  'group-hover:text-amber-500',
        title: 'Full Load Current',
        description: 'Calculate three-phase full load current from kW, kVA, or HP with power factor support.',
      },
    ],
  },
  {
    label: 'Design & Optimization',
    icon: <Star className="w-4 h-4" />,
    cards: [
      {
        id: 'calc-smart-design',
        route: '/calculator/smart-design',
        icon: <BrainCircuit className="w-6 h-6" />,
        accentFrom:   'from-indigo-500/15',
        accentText:   'text-indigo-600 dark:text-indigo-400',
        accentBg:     'bg-gradient-to-br from-indigo-500/20 to-violet-500/10 group-hover:from-indigo-500/30 group-hover:to-violet-500/20',
        accentBorder: 'hover:border-indigo-400/40',
        accentArrow:  'group-hover:text-indigo-500',
        badge: 'AI Optimized',
        badgeCls: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-md',
        title: 'Smart Design Engine',
        description: 'One-click cable sizing, voltage drop & parallel optimization. NEC-ranked by efficiency.',
      },
      {
        id: 'calc-motor-design',
        route: '/calculator/motor-design',
        icon: <Settings className="w-6 h-6" />,
        accentFrom:   'from-emerald-500/15',
        accentText:   'text-emerald-600 dark:text-emerald-400',
        accentBg:     'bg-emerald-500/10 group-hover:bg-emerald-500/20',
        accentBorder: 'hover:border-emerald-400/40',
        accentArrow:  'group-hover:text-emerald-500',
        title: 'Motor Design & Starting',
        description: 'NEC 430 motor branch circuit design: FLC, overload, breaker sizing, and cable optimization.',
      },
      {
        id: 'calc-transformer-design',
        route: '/calculator/transformer-design',
        icon: <Network className="w-6 h-6" />,
        accentFrom:   'from-sky-500/15',
        accentText:   'text-sky-600 dark:text-sky-400',
        accentBg:     'bg-sky-500/10 group-hover:bg-sky-500/20',
        accentBorder: 'hover:border-sky-400/40',
        accentArrow:  'group-hover:text-sky-500',
        title: 'Transformer & Equipment Design',
        description: 'End-to-end fault current analysis, cable sizing, and downstream equipment verification.',
      },
    ],
  },
  {
    label: 'Advanced Analysis',
    icon: <Layers className="w-4 h-4" />,
    cards: [
      {
        id: 'calc-system-validation',
        route: '/calculator/system-validation',
        icon: <ShieldCheck className="w-6 h-6" />,
        accentFrom:   'from-teal-500/15',
        accentText:   'text-teal-600 dark:text-teal-400',
        accentBg:     'bg-teal-500/10 group-hover:bg-teal-500/20',
        accentBorder: 'hover:border-teal-400/40',
        accentArrow:  'group-hover:text-teal-500',
        badge: 'Full System',
        badgeCls: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded-md',
        title: 'Full System Validation Engine',
        description: 'Unified validation and auto-design for transformer, cable, breakers, and downstream equipment.',
      },
      {
        id: 'calc-arc-flash',
        route: '/calculator/arc-flash',
        icon: <Flame className="w-6 h-6" />,
        accentFrom:   'from-orange-500/15',
        accentText:   'text-orange-600 dark:text-orange-400',
        accentBg:     'bg-orange-500/10 group-hover:bg-orange-500/20',
        accentBorder: 'hover:border-orange-400/40',
        accentArrow:  'group-hover:text-orange-500',
        badge: 'IEEE 1584',
        badgeCls: 'bg-orange-500/15 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-md',
        title: 'Arc Flash Analysis',
        description: 'Calculate incident energy, arc flash boundaries, and required PPE category per IEEE 1584.',
      },
    ],
  },
];

const STATS = [
  { icon: <LayoutGrid className="w-3.5 h-3.5" />, label: '9 Calculators' },
  { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'NEC Compliant' },
  { icon: <Wifi className="w-3.5 h-3.5" />, label: 'Instant Access' },
];

/* ─── Calculator Card ────────────────────────────────────── */

function CalcCardButton({ card, navigate }: { card: CalcCard; navigate: (r: string) => void }) {
  return (
    <button
      key={card.route}
      id={card.id}
      onClick={() => navigate(card.route)}
      className={`group text-left bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md ${card.accentBorder} transition-all duration-200 active:scale-[0.98] relative overflow-hidden`}
    >
      {/* Background gradient accent blob */}
      <div className={`absolute inset-0 bg-gradient-to-br ${card.accentFrom} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      {/* Icon + Badge row */}
      <div className="relative flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200 ${card.accentBg}`}>
          <span className={card.accentText}>{card.icon}</span>
        </div>
        {card.badge && (
          <span className={card.badgeCls}>{card.badge}</span>
        )}
      </div>

      {/* Content */}
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-foreground text-sm mb-1.5 leading-snug">{card.title}</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{card.description}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-colors duration-200 ${card.accentArrow}`} />
      </div>
    </button>
  );
}

/* ─── Home Page ──────────────────────────────────────────── */

export default function CalculatorHome() {
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const visibleCategories = activeCategory !== null
    ? [CATEGORIES[activeCategory]]
    : CATEGORIES;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky Header ─────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="h-[3px] w-full bg-gradient-to-r from-primary via-violet-500/50 to-cyan-500/30" />
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
            <Calculator className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight">Electrical Calculators</h1>
            <p className="text-[11px] text-muted-foreground">NEC-Based Engineering Tools · Professional Grade</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6 pb-16 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <button onClick={() => navigate('/home')} className="hover:text-foreground transition-colors">Home</button>
          <ChevronRight className="w-3 h-3 opacity-50" />
          <span className="text-foreground font-medium">Calculators</span>
        </nav>

        {/* ── Category Filter ───────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeCategory === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            All
          </button>
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(activeCategory === i ? null : i)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeCategory === i
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── Calculator Categories ─────────────────────── */}
        {visibleCategories.map((cat) => (
          <div key={cat.label} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-primary">{cat.icon}</span>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{cat.label}</h3>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {cat.cards.map((card) => (
                <CalcCardButton key={card.route} card={card} navigate={navigate} />
              ))}
            </div>
          </div>
        ))}

        {/* Back Link */}
        <button
          id="calc-back-home"
          onClick={() => navigate('/home')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Home
        </button>
      </main>
    </div>
  );
}
