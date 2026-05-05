import { useState } from 'react';
import { BrainCircuit, AlertTriangle, ShieldCheck, Layers, Zap, Award, ChevronDown, ChevronUp, Activity, Trophy } from 'lucide-react';
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
import { type TempRating, type ConductorMaterial } from './necTable';
import { type LengthUnit } from './vdropFormulas';
import {
  optimizeSolution,
  type SmartDesignInput,
  type SmartDesignResult,
  type DesignSolution,
  type CalculationDetails,
} from './smartEngine';

interface FormState {
  voltage: string;
  loadCurrent: string;
  cableLength: string;
  lengthUnit: LengthUnit;
  material: ConductorMaterial;
  tempRating: TempRating;
  continuous: boolean;
  allowedDrop: '3' | '5';
}

type FieldKey = 'voltage' | 'loadCurrent' | 'cableLength';

const DEFAULT: FormState = {
  voltage: '',
  loadCurrent: '',
  cableLength: '',
  lengthUnit: 'm',
  material: 'copper',
  tempRating: 75,
  continuous: false,
  allowedDrop: '3',
};

const TEMP_OPTIONS: TempRating[] = [60, 75, 90];
const MATERIAL_OPTIONS: ConductorMaterial[] = ['copper', 'aluminum'];

/* ── Calc Details ────────────────────────────────────────── */
function CalcDetailsBox({ details }: { details: CalculationDetails }) {
  return (
    <div className="mt-4 pt-4 border-t border-border/50">
      <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5" /> Calculation Details
      </h4>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <p className="text-muted-foreground">Resistance:</p>
          <p className="font-mono text-foreground font-medium bg-muted/40 px-2 py-0.5 rounded inline-block">
            {details.resistanceDisplay} {details.resistanceUnit}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">Conductor:</p>
          <p className="text-foreground font-medium">{details.cableSize} {details.material}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">Length:</p>
          <p className="text-foreground font-medium">{details.lengthOriginal} {details.lengthUnit}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">Formula:</p>
          <p className="font-mono text-[10px] text-foreground bg-muted/40 px-2 py-1 rounded break-all">
            Vd = (√3 × I × L × R) / {details.parallelSets > 1 ? `(1000 × ${details.parallelSets})` : '1000'}
          </p>
        </div>
        <div className="col-span-2 space-y-1">
          <p className="text-muted-foreground">Substitution:</p>
          <p className="font-mono text-[10px] text-primary/80 bg-primary/5 px-2 py-1 rounded break-all border border-primary/10">
            {details.formulaSubstitution}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Ranking Scoreboard ───────────────────────────────────── */
function RankingTable({ solutions, material }: { solutions: DesignSolution[]; material: ConductorMaterial }) {
  const top3 = solutions.slice(0, 3);
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="bg-muted/30 px-4 py-2 border-b border-border flex items-center gap-2">
        <Trophy className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Design Ranking</span>
      </div>
      <div className="divide-y divide-border">
        {top3.map((sol, i) => {
          const medals = ['🥇', '🥈', '🥉'];
          return (
            <div key={`${sol.entry.key}-${sol.parallelSets}`} className="flex items-center gap-3 px-4 py-3">
              <span className="text-lg shrink-0">{medals[i]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {sol.parallelSets > 1 ? `${sol.parallelSets} × ` : ''}{sol.entry.label} {material === 'copper' ? 'Cu' : 'Al'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {sol.totalAmpacity}A · {sol.voltageDropPct}% VD · {sol.headroom}% headroom
                </p>
              </div>
              <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                #{i + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Solution Card ───────────────────────────────────────── */
function SolutionCard({ sol, rank, material }: { sol: DesignSolution; rank: number; material: ConductorMaterial }) {
  const isTop = rank === 0;
  return (
    <div className={`rounded-2xl border bg-card p-5 space-y-4 ${isTop ? 'border-indigo-500/40 shadow-md shadow-indigo-500/5' : 'border-border shadow-sm'}`}>
      <div className="flex items-center gap-2.5">
        {isTop ? (
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center">
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
            <span className="text-xs font-bold text-muted-foreground">#{rank + 1}</span>
          </div>
        )}
        <div>
          <h3 className={`text-sm font-bold ${isTop ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground'}`}>
            {isTop ? 'Recommended Design' : `Alternative ${rank}`}
          </h3>
          <p className="text-xs text-muted-foreground">
            {sol.parallelSets > 1
              ? `${sol.parallelSets} × ${sol.entry.label} ${material === 'copper' ? 'Copper' : 'Aluminum'} (parallel)`
              : `${sol.entry.label} ${material === 'copper' ? 'Copper' : 'Aluminum'}`}
          </p>
        </div>
      </div>

      {sol.parallelSets > 1 && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 border border-amber-500/30 bg-amber-500/10 text-xs">
          <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-amber-700 dark:text-amber-400 font-medium">
            {sol.parallelSets} parallel sets · NEC 310.10(H)
          </span>
        </div>
      )}

      <ResultGrid cols={sol.parallelSets > 1 ? 3 : 2}>
        <ResultCard label="Cable Size" value={sol.entry.label} variant="primary" />
        {sol.parallelSets > 1 && (
          <ResultCard label="Parallel Runs" value={sol.parallelSets} unit="sets" variant="primary" />
        )}
        <ResultCard label="Total Ampacity" value={sol.totalAmpacity} unit="A" variant="primary" />
      </ResultGrid>

      <ResultGrid cols={4}>
        <ResultCard label="Design I" value={`${sol.designCurrent} A`} variant="muted" />
        <ResultCard label="Amp/Cable" value={`${sol.ampacity} A`} variant="muted" />
        <ResultCard
          label="V-Drop"
          value={`${sol.voltageDrop} V`}
          sub={`${sol.voltageDropPct}%`}
          variant={sol.voltageDropPct <= 3 ? 'green' : sol.voltageDropPct <= 5 ? 'amber' : 'red'}
        />
        <ResultCard
          label="Headroom"
          value={`${sol.headroom}%`}
          variant={sol.headroom >= 0 ? 'green' : 'red'}
        />
      </ResultGrid>

      <CalcDetailsBox details={sol.calcDetails} />
    </div>
  );
}

export default function SmartDesign() {
  const [form, setForm] = useState<FormState>(DEFAULT);
  const [result, setResult] = useState<SmartDesignResult | null>(null);
  const [error, setError] = useState<{ field: FieldKey | null; msg: string } | null>(null);
  const [showAlts, setShowAlts] = useState(false);

  const { ref: resultRef, scrollTo: scrollToResult } = useScrollRef();
  const voltageRef = useScrollRef<HTMLDivElement>();
  const currentRef = useScrollRef<HTMLDivElement>();
  const lengthRef = useScrollRef<HTMLDivElement>();

  const fieldScrollMap: Record<FieldKey, { scrollTo: () => void }> = {
    voltage: voltageRef,
    loadCurrent: currentRef,
    cableLength: lengthRef,
  };

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    setResult(null);
    setError(null);
  }

  function handleReset() {
    setForm(DEFAULT); setResult(null); setError(null); setShowAlts(false);
  }

  function handleCalculate() {
    setError(null); setShowAlts(false);
    const V = parseFloat(form.voltage);
    const I = parseFloat(form.loadCurrent);
    const L = parseFloat(form.cableLength);

    if (!form.voltage || isNaN(V) || V <= 0) {
      setError({ field: 'voltage', msg: 'Voltage must be a positive number.' });
      setTimeout(() => fieldScrollMap.voltage.scrollTo(), 80); return;
    }
    if (!form.loadCurrent || isNaN(I) || I <= 0) {
      setError({ field: 'loadCurrent', msg: 'Load Current must be a positive number.' });
      setTimeout(() => fieldScrollMap.loadCurrent.scrollTo(), 80); return;
    }
    if (!form.cableLength || isNaN(L) || L <= 0) {
      setError({ field: 'cableLength', msg: 'Cable Length must be a positive number.' });
      setTimeout(() => fieldScrollMap.cableLength.scrollTo(), 80); return;
    }

    const input: SmartDesignInput = {
      voltage: V, loadCurrent: I, cableLength: L,
      lengthUnit: form.lengthUnit, material: form.material,
      tempRating: form.tempRating, continuous: form.continuous,
      allowedDropPct: parseFloat(form.allowedDrop),
    };

    const res = optimizeSolution(input);
    if (!res) {
      setError({ field: null, msg: 'No valid design found. Try reducing cable length, load, or increasing allowed voltage drop.' });
      return;
    }
    setResult(res);
    setTimeout(scrollToResult, 80);
  }

  return (
    <CalcShell
      icon={<BrainCircuit className="w-4 h-4 text-white" />}
      iconBg="bg-gradient-to-br from-indigo-500 to-violet-600"
      title="Smart Design Engine"
      subtitle="Cable Sizing · Voltage Drop · Parallel Optimization · NEC"
      breadcrumbLabel="Smart Design"
      accent="violet"
    >
      {/* ── Info Badge ─────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
        <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Three-Phase System · NEC Based · Auto-Optimized</span>
      </div>

      {/* ── Design Parameters ──────────────────────────── */}
      <CalcSection title="Design Parameters">
        <div ref={voltageRef.ref}>
          <CalcInput label="System Voltage" unit="V" required fieldId="sd-voltage"
            type="number" min="0" placeholder="e.g. 480"
            value={form.voltage} onChange={(e) => set('voltage', e.target.value)}
            invalid={error?.field === 'voltage'} />
        </div>

        <div ref={currentRef.ref}>
          <CalcInput label="Load Current" unit="A" required fieldId="sd-current"
            type="number" min="0" placeholder="e.g. 200"
            value={form.loadCurrent} onChange={(e) => set('loadCurrent', e.target.value)}
            invalid={error?.field === 'loadCurrent'} />
        </div>

        <div ref={lengthRef.ref}>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">
            Cable Length <span className="text-primary">*</span>
          </p>
          <div className="flex gap-2">
            <input type="number" min="0" placeholder="e.g. 100" value={form.cableLength}
              onChange={(e) => set('cableLength', e.target.value)}
              className={`flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${error?.field === 'cableLength' ? 'border-destructive ring-2 ring-destructive/20' : 'border-border'}`}
            />
            <div className="flex rounded-xl border border-border overflow-hidden shrink-0">
              {(['m', 'ft'] as LengthUnit[]).map((u) => (
                <button key={u} onClick={() => set('lengthUnit', u)}
                  className={`px-4 py-2.5 text-sm font-semibold transition-all ${form.lengthUnit === u ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}>{u}</button>
              ))}
            </div>
          </div>
        </div>

        <CalcSegment label="Conductor Material" options={MATERIAL_OPTIONS} value={form.material}
          onChange={(v) => set('material', v)} renderLabel={(v) => v.charAt(0).toUpperCase() + v.slice(1)} />

        <CalcSegment label="Temperature Rating" options={TEMP_OPTIONS} value={form.tempRating}
          onChange={(v) => set('tempRating', v)} renderLabel={(v) => `${v}°C`} />

        <CalcToggle label="Continuous Load" description="Apply NEC 125% rule"
          value={form.continuous} onChange={(v) => set('continuous', v)} />

        {form.continuous && form.loadCurrent && (
          <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">125% rule applied:</span>{' '}
            {form.loadCurrent} A × 1.25 ={' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{(parseFloat(form.loadCurrent) * 1.25).toFixed(2)} A</span>{' '}design current
          </div>
        )}

        <CalcSegment label="Allowed Voltage Drop" options={['3', '5'] as const} value={form.allowedDrop}
          onChange={(v) => set('allowedDrop', v)} renderLabel={(v) => `${v}%`} />
      </CalcSection>

      {error && <CalcError message={error.msg} />}

      <CalcActions
        calculateId="smart-calculate"
        onCalculate={handleCalculate}
        onReset={handleReset}
        calculateLabel="Calculate Optimal Design"
        icon={<BrainCircuit className="w-4 h-4" />}
      />

      {/* ── Results ────────────────────────────────────── */}
      {result && (
        <div ref={resultRef} className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <StatusBanner variant="green" icon={<ShieldCheck className="w-5 h-5" />}>
            DESIGN COMPLETE — All constraints satisfied
          </StatusBanner>

          {/* Ranking table (all solutions at a glance) */}
          {result.alternatives.length > 0 && (
            <RankingTable solutions={[result.recommended, ...result.alternatives]} material={form.material} />
          )}

          <SolutionCard sol={result.recommended} rank={0} material={form.material} />

          {result.alternatives.length > 0 && (
            <div className="space-y-3">
              <button onClick={() => setShowAlts(!showAlts)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-medium text-foreground">
                <span>Alternative Solutions ({result.alternatives.length})</span>
                {showAlts ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {showAlts && result.alternatives.map((alt, i) => (
                <SolutionCard key={`${alt.entry.key}-${alt.parallelSets}`} sol={alt} rank={i + 1} material={form.material} />
              ))}
            </div>
          )}

          <InfoBox>
            <p className="font-medium text-foreground mb-1">Parameters</p>
            <p>Voltage: <span className="font-semibold text-foreground">{form.voltage} V</span></p>
            <p>Load: <span className="font-semibold text-foreground">{form.loadCurrent} A</span></p>
            <p>Length: <span className="font-semibold text-foreground">{form.cableLength} {form.lengthUnit}</span></p>
            <p>Material: <span className="font-semibold text-foreground">{form.material === 'copper' ? 'Copper' : 'Aluminum'}</span></p>
            <p>Temp Rating: <span className="font-semibold text-foreground">{form.tempRating}°C</span></p>
            <p>Continuous: <span className="font-semibold text-foreground">{form.continuous ? 'Yes (125%)' : 'No'}</span></p>
            <p>Max V-Drop: <span className="font-semibold text-foreground">{form.allowedDrop}%</span></p>
          </InfoBox>

          <InfoBox>
            <p className="font-medium text-foreground mb-1">Engineering Notes</p>
            <p>• Based on NEC Table 310.15(B)(16)</p>
            <p>• Vd = (√3 × I × L × R) / (1000 × sets)</p>
            <p>• Parallel conductors assumed equal per NEC 310.10(H)</p>
            <p>• Al ampacity = Cu × 0.8 · Al resistance = Cu × 1.6</p>
            <p>• Derating factors not applied</p>
          </InfoBox>
        </div>
      )}
    </CalcShell>
  );
}
