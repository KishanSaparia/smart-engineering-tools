import { useState } from 'react';
import { Cable, AlertTriangle, ShieldCheck, ShieldX, Layers, Zap } from 'lucide-react';
import CalcShell from './CalcShell';
import {
  CalcSection,
  CalcSegment,
  CalcInput,
  CalcToggle,
  CalcError,
  CalcActions,
  ResultCard,
  ResultGrid,
  StatusBanner,
  InfoBox,
  useScrollRef,
} from './CalcUI';
import { NEC_TABLE, type TempRating, type ConductorMaterial } from './necTable';
import {
  calculateDesignCurrent,
  findCableSize,
  checkCable,
  isParallelEligible,
  findMinimumCableSize,
} from './cableFormulas';

type Mode = 'find' | 'check';

interface FindForm {
  loadCurrent: string;
  tempRating: TempRating;
  material: ConductorMaterial;
  continuous: boolean;
}

interface CheckForm {
  cableSize: string;
  loadCurrent: string;
  tempRating: TempRating;
  material: ConductorMaterial;
  continuous: boolean;
  parallelRuns: string;
}

interface FindResult {
  cableLabel: string;
  ampacity: number;
  parallelSets: number;
  totalAmpacity: number;
  designCurrent: number;
  headroom: number;
  isSafe: boolean;
}

interface CheckResult {
  ampacity: number;
  totalAmpacity: number;
  parallelRuns: number;
  designCurrent: number;
  headroom: number;
  isSafe: boolean;
}

interface OptimizationSuggestion {
  withRule: { label: string; ampacity: number } | null;
  withoutRule: { label: string; ampacity: number } | null;
  isContinuous: boolean;
}

const DEFAULT_FIND: FindForm = { loadCurrent: '', tempRating: 75, material: 'copper', continuous: false };
const DEFAULT_CHECK: CheckForm = { cableSize: '4', loadCurrent: '', tempRating: 75, material: 'copper', continuous: false, parallelRuns: '1' };

const TEMP_OPTIONS: TempRating[] = [60, 75, 90];
const MATERIAL_OPTIONS: ConductorMaterial[] = ['copper', 'aluminum'];

/* ── Ampacity gauge SVG ──────────────────────────────────── */
function AmpacityGauge({ designI, totalAmpacity }: { designI: number; totalAmpacity: number }) {
  const pct = Math.min((designI / totalAmpacity) * 100, 100);
  const safe = pct <= 100;
  const colour = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#8b5cf6';
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="90" height="90" viewBox="0 0 90 90" aria-hidden="true">
        <circle cx="45" cy="45" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
        <circle
          cx="45" cy="45" r={r} fill="none"
          stroke={colour} strokeWidth="8"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
        />
        <text x="45" y="42" textAnchor="middle" fontSize="11" fontWeight="700" fill={colour}>{pct.toFixed(0)}%</text>
        <text x="45" y="56" textAnchor="middle" fontSize="7" fill="currentColor" className="text-muted-foreground">utilized</text>
      </svg>
      <p className="text-[10px] text-muted-foreground">{safe ? 'Within Rating' : 'Over Rated'}</p>
    </div>
  );
}

export default function CableSize() {
  const [mode, setMode] = useState<Mode>('find');

  const [findForm, setFindForm] = useState<FindForm>(DEFAULT_FIND);
  const [findResult, setFindResult] = useState<FindResult | null>(null);
  const [findError, setFindError] = useState<string | null>(null);

  const [checkForm, setCheckForm] = useState<CheckForm>(DEFAULT_CHECK);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [optimization, setOptimization] = useState<OptimizationSuggestion | null>(null);

  const { ref: findResultRef, scrollTo: scrollToFindResult } = useScrollRef();
  const { ref: checkResultRef, scrollTo: scrollToCheckResult } = useScrollRef();
  const findLoadRef = useScrollRef<HTMLDivElement>();
  const checkLoadRef = useScrollRef<HTMLDivElement>();

  const parallelEligible = isParallelEligible(checkForm.cableSize);

  function switchMode(m: Mode) { setMode(m); }

  function handleReset() {
    if (mode === 'find') {
      setFindForm(DEFAULT_FIND); setFindResult(null); setFindError(null);
    } else {
      setCheckForm(DEFAULT_CHECK); setCheckResult(null); setCheckError(null); setOptimization(null);
    }
  }

  /* ── Find ── */
  function handleFind() {
    setFindError(null);
    const load = parseFloat(findForm.loadCurrent);
    if (!findForm.loadCurrent || isNaN(load) || load <= 0) {
      setFindError('Load Current must be a positive number.');
      setFindResult(null);
      setTimeout(() => findLoadRef.scrollTo(), 80); return;
    }

    const designI = calculateDesignCurrent(load, findForm.continuous);
    const match = findCableSize(designI, findForm.material, findForm.tempRating);

    if (!match) {
      setFindError('No suitable cable found even with parallel conductors (max 10 sets).');
      setFindResult(null); return;
    }

    const headroom = ((match.totalAmpacity - designI) / match.totalAmpacity) * 100;
    setFindResult({
      cableLabel: match.entry.label,
      ampacity: match.ampacity,
      parallelSets: match.parallelSets,
      totalAmpacity: match.totalAmpacity,
      designCurrent: parseFloat(designI.toFixed(2)),
      headroom: parseFloat(headroom.toFixed(1)),
      isSafe: match.totalAmpacity >= designI,
    });
    setTimeout(scrollToFindResult, 80);
  }

  /* ── Check ── */
  function handleCheck() {
    setCheckError(null); setOptimization(null);
    const load = parseFloat(checkForm.loadCurrent);
    if (!checkForm.loadCurrent || isNaN(load) || load <= 0) {
      setCheckError('Load Current must be a positive number.');
      setCheckResult(null);
      setTimeout(() => checkLoadRef.scrollTo(), 80); return;
    }
    const runs = parseInt(checkForm.parallelRuns, 10);
    if (isNaN(runs) || runs < 1 || runs > 10 || !Number.isInteger(runs)) {
      setCheckError('Parallel Runs must be an integer between 1 and 10.');
      setCheckResult(null); return;
    }

    const res = checkCable(checkForm.cableSize, load, checkForm.material, checkForm.tempRating, checkForm.continuous, runs);
    setCheckResult(res);

    if (res.isSafe && res.headroom > 30) {
      const designWithRule = calculateDesignCurrent(load, checkForm.continuous);
      const minWithRule = findMinimumCableSize(designWithRule, checkForm.material, checkForm.tempRating);
      const selectedIdx = NEC_TABLE.findIndex((e) => e.key === checkForm.cableSize);
      const suggestedIdx = minWithRule ? NEC_TABLE.findIndex((e) => e.key === minWithRule.entry.key) : -1;

      if (minWithRule && suggestedIdx >= 0 && suggestedIdx < selectedIdx) {
        let withoutRuleSuggestion: { label: string; ampacity: number } | null = null;
        if (checkForm.continuous) {
          const designWithoutRule = calculateDesignCurrent(load, false);
          const minWithoutRule = findMinimumCableSize(designWithoutRule, checkForm.material, checkForm.tempRating);
          if (minWithoutRule) withoutRuleSuggestion = { label: minWithoutRule.entry.label, ampacity: minWithoutRule.ampacity };
        }
        setOptimization({ withRule: { label: minWithRule.entry.label, ampacity: minWithRule.ampacity }, withoutRule: withoutRuleSuggestion, isContinuous: checkForm.continuous });
      }
    }
    setTimeout(scrollToCheckResult, 80);
  }

  return (
    <CalcShell
      icon={<Cable className="w-4 h-4 text-white" />}
      iconBg="bg-violet-500"
      title="Cable Size Calculator"
      subtitle="NEC 310.15(B)(16) · Up to 2000 V · Parallel Conductors"
      breadcrumbLabel="Cable Size"
      accent="violet"
    >
      {/* ── Mode Tabs ──────────────────────────────────── */}
      <div className="flex rounded-xl border border-border overflow-hidden">
        {([{ key: 'find' as Mode, label: 'Find Cable Size' }, { key: 'check' as Mode, label: 'Check Cable' }]).map((tab) => (
          <button
            key={tab.key}
            id={`csc-tab-${tab.key}`}
            onClick={() => switchMode(tab.key)}
            className={`flex-1 py-3 text-sm font-semibold transition-all ${mode === tab.key ? 'bg-violet-500 text-white' : 'bg-background text-foreground hover:bg-muted'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MODE 1: Find ───────────────────────────────── */}
      {mode === 'find' && (
        <CalcSection title="Find Cable Size — NEC 310.15(B)(16)">
          <div ref={findLoadRef.ref}>
            <CalcInput
              label="Load Current" unit="A" required fieldId="csc-find-load"
              type="number" min="0" step="any" value={findForm.loadCurrent}
              onChange={(e) => { setFindForm((f) => ({ ...f, loadCurrent: e.target.value })); setFindResult(null); setFindError(null); }}
              placeholder="e.g. 80" invalid={!!findError && !findForm.loadCurrent}
            />
          </div>
          <CalcSegment label="Temperature Rating" options={TEMP_OPTIONS} value={findForm.tempRating}
            onChange={(t) => { setFindForm((f) => ({ ...f, tempRating: t })); setFindResult(null); }}
            renderLabel={(t) => `${t}°C`} />
          <CalcSegment label="Conductor Material" options={MATERIAL_OPTIONS} value={findForm.material}
            onChange={(m) => { setFindForm((f) => ({ ...f, material: m })); setFindResult(null); }}
            renderLabel={(m) => m.charAt(0).toUpperCase() + m.slice(1)} />
          <CalcToggle label="Continuous Load" description="Apply 125% NEC rule"
            value={findForm.continuous}
            onChange={(v) => { setFindForm((f) => ({ ...f, continuous: v })); setFindResult(null); }} />
          {findForm.continuous && findForm.loadCurrent && (
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 px-4 py-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">125% rule applied: </span>
              {findForm.loadCurrent} A × 1.25 = <span className="font-semibold text-violet-600 dark:text-violet-400">{(parseFloat(findForm.loadCurrent) * 1.25).toFixed(2)} A</span> design current
            </div>
          )}
        </CalcSection>
      )}

      {/* ── MODE 2: Check ──────────────────────────────── */}
      {mode === 'check' && (
        <CalcSection title="Check Cable Ampacity">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Cable Size <span className="opacity-50">(AWG / kcmil)</span>
            </label>
            <select
              id="csc-check-size"
              value={checkForm.cableSize}
              onChange={(e) => {
                const newSize = e.target.value;
                const eligible = isParallelEligible(newSize);
                setCheckForm((f) => ({ ...f, cableSize: newSize, parallelRuns: eligible ? f.parallelRuns : '1' }));
                setCheckResult(null);
              }}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
            >
              {NEC_TABLE.map((entry) => (
                <option key={entry.key} value={entry.key}>{entry.label}</option>
              ))}
            </select>
          </div>
          <CalcSegment label="Conductor Material" options={MATERIAL_OPTIONS} value={checkForm.material}
            onChange={(m) => { setCheckForm((f) => ({ ...f, material: m })); setCheckResult(null); }}
            renderLabel={(m) => m.charAt(0).toUpperCase() + m.slice(1)} />
          <CalcSegment label="Temperature Rating" options={TEMP_OPTIONS} value={checkForm.tempRating}
            onChange={(t) => { setCheckForm((f) => ({ ...f, tempRating: t })); setCheckResult(null); }}
            renderLabel={(t) => `${t}°C`} />
          <div ref={checkLoadRef.ref}>
            <CalcInput
              label="Load Current" unit="A" required fieldId="csc-check-load"
              type="number" min="0" step="any" value={checkForm.loadCurrent}
              onChange={(e) => { setCheckForm((f) => ({ ...f, loadCurrent: e.target.value })); setCheckResult(null); setCheckError(null); }}
              placeholder="e.g. 65" invalid={!!checkError && !checkForm.loadCurrent}
            />
          </div>
          <div>
            <CalcInput
              label="Parallel Runs" unit="1–10" fieldId="csc-check-parallel"
              type="number" min="1" max="10" step="1"
              value={parallelEligible ? checkForm.parallelRuns : '1'}
              disabled={!parallelEligible}
              onChange={(e) => { setCheckForm((f) => ({ ...f, parallelRuns: e.target.value })); setCheckResult(null); setCheckError(null); }}
              placeholder="1"
              hint={parallelEligible ? 'Enter 1 for single conductor, or 2–10 for parallel sets per NEC 310.10(H)' : undefined}
            />
            {!parallelEligible && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                Parallel conductors allowed only for 1/0 AWG and larger (NEC 310.10(H))
              </p>
            )}
          </div>
          <CalcToggle label="Continuous Load" description="Apply 125% NEC rule"
            value={checkForm.continuous}
            onChange={(v) => { setCheckForm((f) => ({ ...f, continuous: v })); setCheckResult(null); }} />
          {checkForm.continuous && checkForm.loadCurrent && (
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 px-4 py-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">125% rule applied: </span>
              {checkForm.loadCurrent} A × 1.25 = <span className="font-semibold text-violet-600 dark:text-violet-400">{(parseFloat(checkForm.loadCurrent) * 1.25).toFixed(2)} A</span> design current
            </div>
          )}
        </CalcSection>
      )}

      {(mode === 'find' ? findError : checkError) && (
        <CalcError message={(mode === 'find' ? findError : checkError)!} />
      )}

      <CalcActions
        calculateId="csc-calculate"
        onCalculate={mode === 'find' ? handleFind : handleCheck}
        onReset={handleReset}
        calculateLabel={mode === 'find' ? 'Find Cable Size' : 'Check Cable'}
        icon={<Cable className="w-4 h-4" />}
      />

      {/* ── Results: Find ──────────────────────────────── */}
      {mode === 'find' && findResult && (
        <div ref={findResultRef} id="csc-find-results" className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CalcSection title="Results">
            <StatusBanner variant={findResult.isSafe ? 'green' : 'red'}
              icon={findResult.isSafe ? <ShieldCheck className="w-5 h-5" /> : <ShieldX className="w-5 h-5" />}>
              {findResult.isSafe ? 'SAFE — Design meets NEC requirements' : 'NOT SAFE'}
            </StatusBanner>

            {findResult.parallelSets > 1 && (
              <StatusBanner variant="amber" icon={<Layers className="w-4 h-4" />}>
                Parallel Conductors Required: {findResult.parallelSets} × {findResult.cableLabel}
              </StatusBanner>
            )}

            <div className="flex items-center gap-4">
              <AmpacityGauge designI={findResult.designCurrent} totalAmpacity={findResult.totalAmpacity} />
              <div className="flex-1 space-y-3">
                <ResultGrid cols={findResult.parallelSets > 1 ? 3 : 2}>
                  <ResultCard label="Recommended Cable" value={findResult.cableLabel} variant="primary" large />
                  {findResult.parallelSets > 1 && (
                    <ResultCard label="Parallel Runs" value={findResult.parallelSets} unit="sets" variant="primary" />
                  )}
                  <ResultCard label={findResult.parallelSets > 1 ? 'Total Ampacity' : 'Ampacity'} value={findResult.totalAmpacity} unit="A" variant="primary" />
                </ResultGrid>
                <ResultGrid cols={findResult.parallelSets > 1 ? 3 : 2}>
                  <ResultCard label="Design Current" value={`${findResult.designCurrent} A`} variant="muted" />
                  {findResult.parallelSets > 1 && (
                    <ResultCard label="Ampacity / Cable" value={`${findResult.ampacity} A`} variant="muted" />
                  )}
                  <ResultCard label="Headroom" value={`${findResult.headroom}%`} variant={findResult.headroom >= 0 ? 'green' : 'red'} />
                </ResultGrid>
              </div>
            </div>

            <InfoBox>
              <p className="font-medium text-foreground mb-1">Parameters</p>
              <p>Material: <span className="font-semibold text-foreground">{findForm.material === 'copper' ? 'Copper' : 'Aluminum'}</span></p>
              <p>Temperature Rating: <span className="font-semibold text-foreground">{findForm.tempRating}°C</span></p>
              <p>Continuous Load: <span className="font-semibold text-foreground">{findForm.continuous ? 'Yes (125%)' : 'No'}</span></p>
              {findResult.parallelSets > 1 && (
                <p>Configuration: <span className="font-semibold text-foreground">{findResult.parallelSets} × {findResult.cableLabel}</span></p>
              )}
              <p className="opacity-70">NEC Table 310.15(B)(16)</p>
            </InfoBox>
          </CalcSection>
        </div>
      )}

      {/* ── Results: Check ─────────────────────────────── */}
      {mode === 'check' && checkResult && (
        <div ref={checkResultRef} id="csc-check-results" className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CalcSection title="Results">
            <StatusBanner variant={checkResult.isSafe ? 'green' : 'red'}
              icon={checkResult.isSafe ? <ShieldCheck className="w-5 h-5" /> : <ShieldX className="w-5 h-5" />}>
              {checkResult.isSafe ? 'SAFE — Cable is adequate' : 'NOT SAFE — Cable under-rated'}
            </StatusBanner>

            <div className="flex items-center gap-4">
              <AmpacityGauge designI={checkResult.designCurrent} totalAmpacity={checkResult.totalAmpacity} />
              <div className="flex-1 space-y-3">
                <ResultGrid cols={checkResult.parallelRuns > 1 ? 3 : 2}>
                  <ResultCard label="Ampacity per Cable" value={checkResult.ampacity} unit="A" variant="primary" large />
                  {checkResult.parallelRuns > 1 && (
                    <ResultCard label="Total Ampacity" value={checkResult.totalAmpacity} unit="A" variant="primary" />
                  )}
                  <ResultCard label="Design Current" value={checkResult.designCurrent} unit="A" variant="primary" />
                </ResultGrid>
                <ResultGrid cols={checkResult.parallelRuns > 1 ? 3 : 2}>
                  {checkResult.parallelRuns > 1 && (
                    <ResultCard label="Parallel Runs" value={checkResult.parallelRuns} unit="sets" variant="muted" />
                  )}
                  <ResultCard label="Headroom" value={`${checkResult.headroom}%`} variant={checkResult.headroom >= 0 ? 'green' : 'red'} />
                  <ResultCard label="Status" value={checkResult.isSafe ? 'SAFE' : 'FAIL'} variant={checkResult.isSafe ? 'green' : 'red'} />
                </ResultGrid>
              </div>
            </div>

            <InfoBox>
              <p className="font-medium text-foreground mb-1">Parameters</p>
              <p>Cable: <span className="font-semibold text-foreground">{NEC_TABLE.find(e => e.key === checkForm.cableSize)?.label}</span></p>
              <p>Material: <span className="font-semibold text-foreground">{checkForm.material === 'copper' ? 'Copper' : 'Aluminum'}</span></p>
              <p>Temperature Rating: <span className="font-semibold text-foreground">{checkForm.tempRating}°C</span></p>
              <p>Continuous Load: <span className="font-semibold text-foreground">{checkForm.continuous ? 'Yes (125%)' : 'No'}</span></p>
              <p className="opacity-70">NEC Table 310.15(B)(16)</p>
            </InfoBox>

            {checkResult.parallelRuns > 1 && (
              <InfoBox>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                  <p>Parallel conductors assumed identical in length, material, and installation per NEC 310.10(H). Derating factors not applied.</p>
                </div>
              </InfoBox>
            )}

            {optimization && (
              <div id="csc-optimization-suggestion" className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/10 via-violet-400/5 to-transparent p-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-violet-500" />
                  </div>
                  <h3 className="text-sm font-bold text-violet-600 dark:text-violet-400 tracking-tight">Optimization Suggestion</h3>
                </div>
                {optimization.withRule && (
                  <div className="rounded-xl bg-violet-500/10 border border-violet-400/20 px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">
                      You can reduce to{' '}
                      <span className="text-violet-600 dark:text-violet-400">{optimization.withRule.label}</span>{' '}
                      <span className="text-muted-foreground font-normal">({optimization.withRule.ampacity} A)</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {optimization.isContinuous ? 'With 125% continuous load rule applied' : 'While meeting NEC requirements'}
                    </p>
                  </div>
                )}
                {optimization.isContinuous && optimization.withoutRule && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-400/20 px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">
                      Without 125% rule:{' '}
                      <span className="text-amber-600 dark:text-amber-400">{optimization.withoutRule.label}</span>{' '}
                      <span className="text-muted-foreground font-normal">({optimization.withoutRule.ampacity} A)</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">For non-continuous operation only</p>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                  Suggestion only — verify with project specs, voltage drop calculations, and local code.
                </p>
              </div>
            )}
          </CalcSection>
        </div>
      )}
    </CalcShell>
  );
}
