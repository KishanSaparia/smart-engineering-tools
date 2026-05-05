import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  Zap, Shield, ShieldCheck, Activity, Cable, Cpu, Flame, Database,
  ChevronRight, CheckCircle, ArrowRight, Wifi, Star, Gauge, BrainCircuit,
  Settings, Network, ClipboardList, Calculator,
} from 'lucide-react';
import PageFooter from '@/components/page-footer';

/* ── Brand ───────────────────────────────────────────── */
const BRAND = {
  name: 'GridCore',
  tagline: 'Engineered for Power. Built for Precision.',
  position: 'Professional electrical engineering software for system design, analysis, and validation — built on NEC and IEEE standards.',
};

/* ── Trust badges ────────────────────────────────────── */
const TRUST = [
  { icon: <Shield className="w-4 h-4" />, label: 'NEC Compliant' },
  { icon: <ShieldCheck className="w-4 h-4" />, label: 'IEEE 1584' },
  { icon: <Wifi className="w-4 h-4" />, label: 'Cloud Ready' },
  { icon: <Database className="w-4 h-4" />, label: 'Instant Results' },
];

/* ── Features ────────────────────────────────────────── */
const FEATURES = [
  { icon: <Zap className="w-5 h-5" />, title: 'Transformer Short Circuit', desc: 'Primary & secondary fault current with infinite bus assumption.', color: 'blue' },
  { icon: <Activity className="w-5 h-5" />, title: 'Voltage Drop Analysis', desc: 'NEC-based conductor sizing with percentage warnings.', color: 'cyan' },
  { icon: <Cable className="w-5 h-5" />, title: 'Cable Size Calculator', desc: 'Ampacity from NEC 310.15(B)(16) with parallel support.', color: 'violet' },
  { icon: <Gauge className="w-5 h-5" />, title: 'Full Load Current', desc: 'Three-phase FLC from kW, kVA, or HP inputs.', color: 'amber' },
  { icon: <BrainCircuit className="w-5 h-5" />, title: 'Smart Design Engine', desc: 'One-click NEC-ranked cable optimization.', color: 'indigo' },
  { icon: <Settings className="w-5 h-5" />, title: 'Motor Design & Starting', desc: 'NEC 430 branch circuit: FLC, overload, breaker, cable.', color: 'emerald' },
  { icon: <Network className="w-5 h-5" />, title: 'Transformer & Equipment', desc: 'End-to-end fault, cable sizing, equipment verification.', color: 'sky' },
  { icon: <ShieldCheck className="w-5 h-5" />, title: 'System Validation Engine', desc: 'Unified path validation: transformer → cable → breaker → equipment.', color: 'teal' },
  { icon: <Flame className="w-5 h-5" />, title: 'Arc Flash Analysis', desc: 'IEEE 1584 incident energy, PPE category, hazard boundary.', color: 'orange' },
];

/* ── Projects ────────────────────────────────────────── */
const PROJECTS = [
  {
    title: 'Arc Flash Hazard Analysis & Compliance Implementation',
    desc: 'Delivered IEEE 1584-based incident energy analysis and field labeling across industrial distribution equipment, improving personnel safety and ensuring full NFPA 70E compliance.',
    outcome: 'Personnel Safety & NFPA 70E Compliance',
    tag: 'IEEE 1584',
  },
  {
    title: 'Fault Current Reduction & System Optimization',
    desc: 'Engineered a systematic impedance optimization strategy that reduced available fault current from 28.5 kA to 18 kA, enabling the use of lower-rated equipment and reducing project cost without compromising protection coordination.',
    outcome: '37% Fault Current Reduction',
    tag: 'Protection',
  },
  {
    title: 'Relay Coordination & Protection Scheme Design',
    desc: 'Designed and implemented a multi-tier protective relay coordination scheme using SEL relays, ensuring selective fault isolation with sub-cycle clearing times across the entire distribution network.',
    outcome: 'Selective Fault Isolation & Reliability',
    tag: 'SEL Relays',
  },
  {
    title: 'Industrial Electrical System Design & Validation',
    desc: 'Performed complete electrical system design validation including transformer sizing, cable ampacity verification, voltage drop analysis, and equipment short-circuit rating compliance for a greenfield industrial facility.',
    outcome: 'Full NEC Compliance & Commissioning',
    tag: 'System Design',
  },
  {
    title: 'Field Survey & Data Capture Platform',
    desc: 'Developed and deployed a Progressive Web Application enabling field engineers to capture, validate, and export electrical equipment survey data seamlessly from any device.',
    outcome: 'Streamlined Field Operations',
    tag: 'Web Platform',
  },
];

/* ── How it works ────────────────────────────────────── */
const STEPS = [
  { num: '01', title: 'Select Your Module', desc: 'Choose from 9 engineering calculators or the site survey tool.' },
  { num: '02', title: 'Input Parameters', desc: 'Enter system data — voltage, current, cable length, equipment ratings.' },
  { num: '03', title: 'Get Instant Results', desc: 'NEC/IEEE-validated results with smart recommendations and auto-design.' },
  { num: '04', title: 'Export & Apply', desc: 'Use results directly in your engineering deliverables.' },
];

/* ── Why GridCore ─────────────────────────────────────── */
const WHYS = [
  'Runs instantly — no installation required',
  'NEC and IEEE-based calculation engines',
  'Smart auto-design with ranked alternatives',
  'Real-time validation with pass/fail indicators',
  'Field-ready survey tool with export',
  'Zero installation — runs in any browser',
];

/* ── Helpers ──────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, delay },
});

const colorMap: Record<string, string> = {
  blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-500',
  cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20 text-cyan-500',
  violet: 'from-violet-500/20 to-violet-600/5 border-violet-500/20 text-violet-500',
  amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-500',
  indigo: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/20 text-indigo-500',
  emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-500',
  sky: 'from-sky-500/20 to-sky-600/5 border-sky-500/20 text-sky-500',
  teal: 'from-teal-500/20 to-teal-600/5 border-teal-500/20 text-teal-500',
  orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/20 text-orange-500',
};

/* ══════════════════════════════════════════════════════ */
export default function SaasLanding() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── NAV ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">{BRAND.name}</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#projects" className="hover:text-foreground transition-colors">Projects</a>
            <a href="#how" className="hover:text-foreground transition-colors">How It Works</a>
          </div>
          <button
            onClick={() => navigate('/calculator')}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Launch App
          </button>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/[0.04] to-transparent" />
        <div className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center relative z-10">
          <motion.div {...fadeUp(0)}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold mb-6">
              <Zap className="w-3 h-3" /> NEC & IEEE Powered
            </span>
          </motion.div>

          <motion.h1 {...fadeUp(0.1)} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5">
            {BRAND.name}
            <span className="block text-2xl sm:text-3xl lg:text-4xl font-light text-muted-foreground mt-2">
              {BRAND.tagline}
            </span>
          </motion.h1>

          <motion.p {...fadeUp(0.2)} className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            {BRAND.position}
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/calculator')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-500 hover:to-indigo-500 active:scale-[0.97] transition-all shadow-lg shadow-blue-600/20"
            >
              <Calculator className="w-4 h-4" /> Open Calculators <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/survey')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted transition-colors"
            >
              <ClipboardList className="w-4 h-4" /> Site Survey Tool
            </button>
          </motion.div>

          {/* Trust row */}
          <motion.div {...fadeUp(0.4)} className="flex flex-wrap items-center justify-center gap-4 mt-10">
            {TRUST.map((t) => (
              <span key={t.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border">
                {t.icon} {t.label}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-20">
        <motion.div {...fadeUp()} className="text-center mb-12">
          <span className="text-xs font-bold text-primary uppercase tracking-[0.25em]">Engineering Modules</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2">9 Professional Calculators</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Every tool built on NEC tables and IEEE standards. No approximations — real engineering math.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => {
            const c = colorMap[f.color] || colorMap.blue;
            return (
              <motion.div key={f.title} {...fadeUp(i * 0.05)}
                className={`group relative rounded-2xl border p-5 bg-gradient-to-br ${c} hover:shadow-md transition-all`}>
                <div className="w-10 h-10 rounded-xl bg-background/80 flex items-center justify-center mb-3 border border-border">
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── INTERACTIVE PREVIEW ─────────────────────── */}
      <section className="bg-muted/30 border-y border-border py-20">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <span className="text-xs font-bold text-primary uppercase tracking-[0.25em]">Live Preview</span>
            <h2 className="text-3xl font-bold mt-2">Real Engineering Software</h2>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
            {/* Terminal bar */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/50 border-b border-border">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              <span className="text-[10px] text-muted-foreground ml-2 font-mono">{BRAND.name} — Transformer Short Circuit</span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inputs mock */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">System Inputs</p>
                {[
                  { label: 'Transformer Rating', val: '1000', unit: 'kVA' },
                  { label: 'Primary Voltage', val: '13,800', unit: 'V' },
                  { label: 'Secondary Voltage', val: '480', unit: 'V' },
                  { label: 'Impedance', val: '5.75', unit: '%Z' },
                ].map((inp) => (
                  <div key={inp.label}>
                    <label className="text-[11px] text-muted-foreground mb-1 block">{inp.label}</label>
                    <div className="flex items-center rounded-xl border border-border bg-background px-3 py-2">
                      <span className="text-sm font-semibold text-foreground flex-1">{inp.val}</span>
                      <span className="text-xs text-muted-foreground">{inp.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Results mock */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Calculated Results</p>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Secondary Fault Current</p>
                  <p className="text-3xl font-extrabold text-emerald-500">20.92 <span className="text-lg">kA</span></p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-background p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">Primary Fault</p>
                    <p className="text-sm font-bold text-foreground">0.73 kA</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">Full Load Current</p>
                    <p className="text-sm font-bold text-foreground">1,202.8 A</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">System validated — all parameters within NEC limits</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PROJECTS ────────────────────────────────── */}
      <section id="projects" className="max-w-6xl mx-auto px-4 py-20">
        <motion.div {...fadeUp()} className="text-center mb-12">
          <span className="text-xs font-bold text-primary uppercase tracking-[0.25em]">Field Proven</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2">Proven in Real Engineering Environments</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Built from hands-on experience in industrial power systems, protection coordination, and field operations.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PROJECTS.map((p, i) => (
            <motion.div key={p.title} {...fadeUp(i * 0.08)}
              className="group bg-card rounded-2xl border border-border p-6 hover:shadow-md hover:border-primary/20 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">{p.tag}</span>
              </div>
              <h3 className="text-base font-bold text-foreground mb-2 leading-snug">{p.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{p.desc}</p>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{p.outcome}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────── */}
      <section id="how" className="bg-muted/30 border-y border-border py-20">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-[0.25em]">Workflow</span>
            <h2 className="text-3xl font-bold mt-2">How It Works</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s, i) => (
              <motion.div key={s.num} {...fadeUp(i * 0.1)} className="bg-card rounded-2xl border border-border p-5 text-center">
                <span className="text-3xl font-extrabold text-primary/20">{s.num}</span>
                <h3 className="text-sm font-bold text-foreground mt-2 mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY GRIDCORE ─────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <motion.div {...fadeUp()} className="text-center mb-10">
          <span className="text-xs font-bold text-primary uppercase tracking-[0.25em]">Advantage</span>
          <h2 className="text-3xl font-bold mt-2">Why {BRAND.name}?</h2>
        </motion.div>
        <motion.div {...fadeUp(0.1)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WHYS.map((w) => (
            <div key={w} className="flex items-center gap-3 bg-card rounded-xl border border-border px-4 py-3">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-sm text-foreground">{w}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────── */}
      <section className="bg-gradient-to-b from-blue-600/[0.06] to-transparent border-t border-border py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div {...fadeUp()}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-5">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3">Ready to Design?</h2>
            <p className="text-muted-foreground mb-8">Start using professional-grade electrical engineering tools — no installation, no login, instant access.</p>
            <button
              onClick={() => navigate('/calculator')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:from-blue-500 hover:to-indigo-500 active:scale-[0.97] transition-all shadow-lg shadow-blue-600/20"
            >
              Launch {BRAND.name} <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      <PageFooter />
    </div>
  );
}
