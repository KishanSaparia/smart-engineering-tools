import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  Zap,
  Shield,
  Cpu,
  Database,
  Flame,
  Activity,
  CheckCircle,
  ChevronRight,
  Wifi,
} from 'lucide-react';

/* ── Loading steps ─────────────────────────────────────── */
const LOADING_STEPS = [
  { text: 'Initializing Calculator Engine', icon: Cpu },
  { text: 'Loading NEC Tables', icon: Activity },
  { text: 'Preparing Arc Flash Module', icon: Flame },
  { text: 'Syncing System Database', icon: Database },
];

const FEATURES = [
  '9+ NEC-Compliant Engineering Calculators',
  'Arc Flash Analysis (IEEE 1584)',
  'Smart Cable & System Design Engine',
  'Site Survey Platform',
  'Full System Validation Engine',
];

const STEP_DELAY = 500;
const AUTO_CLOSE_MS = 18000;
/* Module-level flag: resets on refresh, persists during navigation */
let splashShown = false;

/* ── IntroSplash ───────────────────────────────────────── */
export default function IntroSplash() {
  const [, navigate] = useLocation();
  const [activeStep, setActiveStep] = useState(-1);
  const [allLoaded, setAllLoaded] = useState(false);
  const [exiting, setExiting] = useState(false);

  /* ── Guard: skip if already shown this page load ───── */
  useEffect(() => {
    if (splashShown) {
      navigate('/home');
    }
  }, [navigate]);

  /* ── Sequential loading steps ──────────────────────── */
  useEffect(() => {
    if (splashShown) return;
    const startTimer = setTimeout(() => setActiveStep(0), 600);
    return () => clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    if (activeStep < 0) return;
    if (activeStep >= LOADING_STEPS.length) {
      setAllLoaded(true);
      return;
    }

    const timer = setTimeout(() => {
      setActiveStep((s) => s + 1);
    }, STEP_DELAY + Math.random() * 300);

    return () => clearTimeout(timer);
  }, [activeStep]);

  /* ── Auto-close after 18 seconds ───────────────────── */
  useEffect(() => {
    if (splashShown) return;
    const timer = setTimeout(() => handleEnter(), AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Navigate handler ──────────────────────────────── */
  const handleEnter = useCallback(() => {
    if (exiting) return;
    splashShown = true;
    setExiting(true);
    setTimeout(() => navigate('/home'), 700);
  }, [exiting, navigate]);

  /* Don't render if already shown */
  if (splashShown) return null;

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden select-none"
          style={{
            background:
              'radial-gradient(ellipse at 25% 15%, rgba(30,58,138,0.4) 0%, transparent 50%), ' +
              'radial-gradient(ellipse at 75% 85%, rgba(15,23,42,0.6) 0%, transparent 50%), ' +
              'linear-gradient(160deg, #020617 0%, #0f172a 30%, #0c1a3a 60%, #030712 100%)',
          }}
        >
          {/* ── Background FX ────────────────────────── */}
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(148,163,184,0.6) 1px, transparent 1px), ' +
                'linear-gradient(90deg, rgba(148,163,184,0.6) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          {/* Glow orb top-left */}
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 65%)',
              top: '-15%',
              left: '-8%',
            }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Glow orb bottom-right */}
          <motion.div
            className="absolute w-[450px] h-[450px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)',
              bottom: '-12%',
              right: '-6%',
            }}
            animate={{ scale: [1, 1.18, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Scan line */}
          <motion.div
            className="absolute left-0 right-0 h-px pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.12) 40%, rgba(59,130,246,0.12) 60%, transparent 100%)',
            }}
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          />

          {/* ── Content ──────────────────────────────── */}
          <div className="relative z-10 w-full max-w-lg mx-auto px-6 py-8 flex flex-col items-center">

            {/* ── Profile Image ──────────────────────── */}
            <motion.div
              className="relative mb-7"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8, type: 'spring', stiffness: 100, damping: 15 }}
            >
              {/* Outer glow */}
              <motion.div
                className="absolute -inset-3 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
                }}
                animate={{ opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Gradient ring */}
              <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-blue-500/60 via-indigo-500/40 to-blue-600/60" />
              {/* Image */}
              <img
                src="/images/kishan.png"
                alt="Kishan Sapariya"
                className="relative w-[120px] h-[120px] rounded-full object-cover object-top border-2 border-slate-800"
              />
              {/* Status dot */}
              <motion.div
                className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-[2.5px] border-slate-900 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2, type: 'spring', stiffness: 200 }}
              >
                <Zap className="w-2.5 h-2.5 text-white" />
              </motion.div>
            </motion.div>

            {/* ── Name ───────────────────────────────── */}
            <motion.h1
              className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight text-center"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              Kishan Sapariya
            </motion.h1>

            {/* ── Title ──────────────────────────────── */}
            <motion.p
              className="text-sm font-bold text-blue-400 uppercase tracking-[0.3em] mt-2 text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.5 }}
            >
              Electrical Design Engineer
            </motion.p>

            {/* ── Tagline ────────────────────────────── */}
            <motion.div
              className="flex items-center gap-3 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.5 }}
            >
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-slate-600" />
              <p className="text-[11px] text-slate-400 tracking-[0.15em] text-center">
                Power Systems &nbsp;•&nbsp; Arc Flash &nbsp;•&nbsp; Smart Engineering Tools
              </p>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-slate-600" />
            </motion.div>

            {/* ── Core Message ────────────────────────── */}
            <motion.p
              className="text-base sm:text-lg text-slate-300/90 font-light italic text-center mt-5 mb-7"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              "Building Practical Electrical Engineering Solutions"
            </motion.p>

            {/* ── Capabilities Card ──────────────────── */}
            <motion.div
              className="relative w-full rounded-2xl overflow-hidden mb-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
            >
              {/* Glass layers */}
              <div className="absolute inset-0 bg-white/[0.035] backdrop-blur-xl rounded-2xl" />
              <div className="absolute inset-0 border border-white/[0.07] rounded-2xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.025] to-indigo-600/[0.015] rounded-2xl" />

              <div className="relative px-5 py-4">
                <div className="flex items-center gap-2 mb-3.5">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[9px] font-extrabold text-blue-400 uppercase tracking-[0.25em]">
                    Platform Capabilities
                  </span>
                </div>
                <div className="space-y-2">
                  {FEATURES.map((feature, i) => (
                    <motion.div
                      key={feature}
                      className="flex items-center gap-2.5"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.6 + i * 0.12, duration: 0.35 }}
                    >
                      <div className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                      <span className="text-[13px] text-slate-300/90">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── System Loading Panel ────────────────── */}
            <motion.div
              className="relative w-full rounded-xl overflow-hidden mb-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.4 }}
            >
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-xl" />
              <div className="absolute inset-0 border border-slate-700/30 rounded-xl" />

              <div className="relative px-4 py-3.5">
                {/* Terminal header */}
                <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-slate-800/60">
                  <div className="w-[7px] h-[7px] rounded-full bg-red-500/70" />
                  <div className="w-[7px] h-[7px] rounded-full bg-amber-500/70" />
                  <div className="w-[7px] h-[7px] rounded-full bg-emerald-500/70" />
                  <span className="text-[9px] text-slate-500 ml-2 font-mono tracking-wider">
                    system.init
                  </span>
                </div>

                {/* Loading steps */}
                <div className="space-y-2 font-mono text-[11px]">
                  {LOADING_STEPS.map((step, i) => {
                    const isComplete = activeStep > i;
                    const isActive = activeStep === i;
                    const isPending = activeStep < i;
                    return (
                      <motion.div
                        key={step.text}
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{
                          opacity: isPending ? 0 : 1,
                          x: isPending ? -8 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {isComplete ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : isActive ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <step.icon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          </motion.div>
                        ) : null}

                        <span
                          className={
                            isComplete
                              ? 'text-emerald-400/90'
                              : isActive
                              ? 'text-blue-300'
                              : 'text-slate-600'
                          }
                        >
                          {step.text}...
                        </span>

                        {isActive && (
                          <motion.span
                            className="text-blue-400 text-[10px]"
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          >
                            ▊
                          </motion.span>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* Modules Loaded indicator */}
                  <AnimatePresence>
                    {allLoaded && (
                      <motion.div
                        className="flex items-center gap-2 pt-2 mt-1 border-t border-slate-800/50"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-emerald-400 font-semibold">
                          Modules Loaded: 9/9
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* ── Footer + Launch ─────────────────────── */}
            <motion.div
              className="w-full text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8, duration: 0.5 }}
            >
              {/* Version info */}
              <div className="flex items-center justify-center gap-3 mb-5">
                <span className="text-[10px] text-slate-500 font-mono tracking-wider">
                  Version 1.0
                </span>
                <div className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="flex items-center gap-1 text-[10px] text-emerald-500/80 font-mono tracking-wider">
                  <Wifi className="w-2.5 h-2.5" />
                  System Ready
                </span>
              </div>

              {/* Launch button */}
              <motion.button
                onClick={handleEnter}
                className="relative inline-flex items-center justify-center gap-2.5 px-10 py-3.5 rounded-xl text-sm font-semibold transition-all overflow-hidden group"
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: allLoaded ? 1 : 0.25,
                  y: 0,
                }}
                transition={{ delay: 3.0, duration: 0.5 }}
                disabled={!allLoaded}
                style={{
                  background: allLoaded
                    ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)'
                    : 'rgba(30,41,59,0.5)',
                  color: allLoaded ? '#fff' : '#64748b',
                  boxShadow: allLoaded
                    ? '0 8px 32px rgba(37,99,235,0.3), 0 0 0 1px rgba(59,130,246,0.2)'
                    : 'none',
                }}
              >
                {/* Shine effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Zap className="w-4 h-4" />
                Launching System
                <ChevronRight className="w-4 h-4" />
              </motion.button>

              {/* Bottom tagline */}
              <motion.p
                className="text-[10px] text-slate-600 tracking-[0.15em] uppercase mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5, duration: 0.5 }}
              >
                Designed for Engineers &nbsp;·&nbsp; Built for Real-World Use
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      ) : (
        /* Exit screen — brief dark fade */
        <motion.div
          key="splash-exit"
          className="fixed inset-0 z-[9999] bg-slate-950"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      )}
    </AnimatePresence>
  );
}
