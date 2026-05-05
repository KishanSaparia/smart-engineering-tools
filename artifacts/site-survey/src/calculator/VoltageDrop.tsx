import { useState, type Ref } from 'react';
import { Activity, AlertTriangle, ThumbsUp, CheckCircle2 } from 'lucide-react';
import CalcShell from './CalcShell';
import {
  CalcSection,
  CalcInput,
  CalcSegment,
  CalcError,
  CalcActions,
  ResultCard,
  ResultGrid,
  StatusBanner,
  InfoBox,
  useScrollRef,
} from './CalcUI';
import {
  AWG_TABLE,
  type Material,
  type LengthUnit,
  getResistance,
  calcThreePhaseVD,
  calculateVoltageDropPercent,
  calculateMaxLength,
  getRecommendedCableSize,
  getLabelByKey,
  toMeters,
  fromMeters,
  ohmPerKmToPerKft,
} from './vdropFormulas';

type ResistanceMode = 'standard' | 'manual';

interface FormState {
  voltage: string;
  current: string;
  length: string;
  lengthUnit: LengthUnit;
  resistanceMode: ResistanceMode;
  material: Material;
  conductorSize: string;
  manualResistance: string;
  allowedDrop: '3' | '5';
}

type FieldKey = 'voltage' | 'current' | 'length' | 'manualResistance';

interface Result {
  vd: number;
  percentDrop: number;
  maxLengthDisplay: number;
  recommendedKey: string | null;
  usedR: number;
}

const DEFAULT_FORM: FormState = {
  voltage: '',
  current: '',
  length: '',
  lengthUnit: 'm',
  resistanceMode: 'standard',
  material: 'copper',
  conductorSize: '4',
  manualResistance: '',
  allowedDrop: '3',
};

function pctVariant(p: number): 'green' | 'amber' | 'red' {
  if (p > 5) return 'red';
  if (p > 3) return 'amber';
  return 'green';
}

function asDivRef(ref: Ref<HTMLElement>): Ref<HTMLDivElement> {
  return ref as Ref<HTMLDivElement>;
}

/* ── Voltage profile SVG ──────────────────────────────────── */
function VoltageProfileDiagram({ pct, limit }: { pct: number; limit: number }) {
  const safe = pct <= limit;
  const barW = Math.min((pct / (limit * 2)) * 260, 260);
  const limitX = (limit / (limit * 2)) * 260 + 20;
  const colour = pct > 5 ? '#ef4444' : pct > 3 ? '#f59e0b' : '#22c55e';

  return (
    <svg viewBox="0 0 300 60" className="w-full max-w-xs mx-auto" aria-hidden="true">
      {/* Track */}
      <rect x="20" y="22" width="260" height="12" rx="6" fill="currentColor" className="text-muted/30" />
      {/* Fill */}
      <rect x="20" y="22" width={barW} height="12" rx="6" fill={colour} opacity="0.85" />
      {/* Limit marker */}
      <line x1={limitX} y1="16" x2={limitX} y2="40" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" strokeDasharray="3 2" />
      <text x={limitX} y="12" textAnchor="middle" fontSize="8" fill="currentColor" className="text-muted-foreground">{limit}% limit</text>
      {/* Value label */}
      <text x="20" y="52" fontSize="9" fill={colour} fontWeight="600">{pct.toFixed(2)}% drop</text>
      <text x="280" y="52" textAnchor="end" fontSize="9" fill="currentColor" className="text-muted-foreground">{safe ? '✓ OK' : '✗ Exceeds'}</text>
    </svg>
  );
}

export default function VoltageDrop() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<{ field: FieldKey | null; msg: string } | null>(null);

  const { ref: resultRef, scrollTo: scrollToResult } = useScrollRef();
  const voltageRef = useScrollRef();
  const currentRef = useScrollRef();
  const lengthRef = useScrollRef();
  const manualRRef = useScrollRef();

  const fieldScrollMap: Record<FieldKey, { scrollTo: () => void }> = {
    voltage: voltageRef,
    current: currentRef,
    length: lengthRef,
    manualResistance: manualRRef,
  };

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    setResult(null);
    setError(null);
  }

  function handleReset() {
    setForm(DEFAULT_FORM);
    setResult(null);
    setError(null);
  }

  function handleCalculate() {
    setError(null);
    const V = parseFloat(form.voltage);
    const I = parseFloat(form.current);
    const Ld = parseFloat(form.length);
    const pct = parseFloat(form.allowedDrop);

    if (!form.voltage || isNaN(V) || V <= 0) {
      setError({ field: 'voltage', msg: 'Voltage must be a positive number.' });
      setTimeout(() => fieldScrollMap.voltage.scrollTo(), 80); return;
    }
    if (!form.current || isNaN(I) || I <= 0) {
      setError({ field: 'current', msg: 'Load current must be a positive number.' });
      setTimeout(() => fieldScrollMap.current.scrollTo(), 80); return;
    }
    if (!form.length || isNaN(Ld) || Ld <= 0) {
      setError({ field: 'length', msg: 'Cable length must be a positive number.' });
      setTimeout(() => fieldScrollMap.length.scrollTo(), 80); return;
    }

    const Lm = toMeters(Ld, form.lengthUnit);
    let R: number;

    if (form.resistanceMode === 'standard') {
      try {
        R = getResistance(form.material, form.conductorSize);
      } catch (e: unknown) {
        setError({ field: null, msg: e instanceof Error ? e.message : 'Unknown resistance error.' });
        return;
      }
    } else {
      R = parseFloat(form.manualResistance);
      if (!form.manualResistance || isNaN(R) || R <= 0) {
        setError({ field: 'manualResistance', msg: 'Resistance must be a positive number.' });
        setTimeout(() => fieldScrollMap.manualResistance.scrollTo(), 80); return;
      }
      if (form.lengthUnit === 'ft') R = R * 3.28084;
    }

    const vd = calcThreePhaseVD(I, Lm, R);
    const percentDrop = calculateVoltageDropPercent(vd, V);
    const maxLengthM = calculateMaxLength(I, V, R, pct);
    const maxLengthDisplay = parseFloat(fromMeters(maxLengthM, form.lengthUnit).toFixed(2));

    let recommendedKey: string | null = null;
    if (form.resistanceMode === 'standard') {
      if (percentDrop <= pct) {
        recommendedKey = null;
      } else {
        const rec = getRecommendedCableSize(I, Lm, V, form.material, pct);
        recommendedKey = rec ? rec.key : 'none';
      }
    }

    setResult({ vd, percentDrop, maxLengthDisplay, recommendedKey, usedR: R });
    setTimeout(scrollToResult, 80);
  }

  const liveR =
    form.resistanceMode === 'standard'
      ? (() => { try { return getResistance(form.material, form.conductorSize); } catch { return null; } })()
      : null;

  const pct = result?.percentDrop ?? 0;
  const allowedPct = parseFloat(form.allowedDrop);

  return (
    <CalcShell
      icon={<Activity className="w-4 h-4 text-white" />}
      iconBg="bg-cyan-500"
      title="Voltage Drop Calculator"
      subtitle="Three-Phase · AWG / kcmil · NEC Guidelines"
      breadcrumbLabel="Voltage Drop"
      accent="cyan"
    >
      {/* ── Info Badge ─────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
        <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
        <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-400">Three-Phase System · Voltage Drop</span>
      </div>

      {/* ── Circuit Parameters ─────────────────────────── */}
      <CalcSection title="Circuit Parameters">
        <div ref={asDivRef(voltageRef.ref)}>
          <CalcInput
            label="System Voltage" unit="V" required fieldId="vd-voltage"
            type="number" min="0" value={form.voltage}
            onChange={(e) => set('voltage', e.target.value)}
            placeholder="e.g. 415" invalid={error?.field === 'voltage'}
          />
        </div>
        <div ref={asDivRef(currentRef.ref)}>
          <CalcInput
            label="Load Current" unit="A" required fieldId="vd-current"
            type="number" min="0" value={form.current}
            onChange={(e) => set('current', e.target.value)}
            placeholder="e.g. 50" invalid={error?.field === 'current'}
          />
        </div>
        <div ref={asDivRef(lengthRef.ref)}>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">
            Cable Length <span className="text-primary">*</span>
          </p>
          <div className="flex gap-2">
            <input
              type="number" min="0" placeholder="e.g. 100" value={form.length}
              onChange={(e) => set('length', e.target.value)}
              className={`flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all ${error?.field === 'length' ? 'border-destructive ring-2 ring-destructive/20' : 'border-border'}`}
            />
            <div className="flex rounded-xl border border-border overflow-hidden shrink-0">
              {(['m', 'ft'] as LengthUnit[]).map((u) => (
                <button key={u} onClick={() => set('lengthUnit', u)}
                  className={`px-4 py-2.5 text-sm font-semibold transition-all ${form.lengthUnit === u ? 'bg-cyan-500 text-white' : 'bg-background text-foreground hover:bg-muted'}`}>
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>
        <CalcSegment
          label="Maximum Allowed Voltage Drop"
          options={['3', '5'] as const} value={form.allowedDrop}
          onChange={(v) => set('allowedDrop', v)} renderLabel={(v) => `${v}%`}
        />
      </CalcSection>

      {/* ── Resistance Input ───────────────────────────── */}
      <CalcSection title="Resistance Input">
        <CalcSegment
          options={['standard', 'manual'] as ResistanceMode[]}
          value={form.resistanceMode}
          onChange={(v) => set('resistanceMode', v)}
          renderLabel={(v) => v === 'standard' ? 'Standard Cable Data' : 'Enter Manually'}
        />
        {form.resistanceMode === 'standard' ? (
          <div className="space-y-4 pt-1">
            <CalcSegment
              label="Conductor Material"
              options={['copper', 'aluminum'] as Material[]}
              value={form.material}
              onChange={(v) => set('material', v)}
              renderLabel={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            />
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Conductor Size <span className="opacity-50">(AWG / kcmil)</span>
              </label>
              <select
                value={form.conductorSize}
                onChange={(e) => set('conductorSize', e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                {AWG_TABLE.map((entry) => (
                  <option key={entry.key} value={entry.key}>{entry.label}</option>
                ))}
              </select>
            </div>
            {liveR !== null && (
              <div className="rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  {form.material === 'copper' ? 'Copper' : 'Aluminum'} resistance:{' '}
                  <span className="font-semibold text-foreground">{liveR.toFixed(3)} Ω/km</span>
                </span>
                {form.lengthUnit === 'ft' && (
                  <span>= <span className="font-semibold text-foreground">{ohmPerKmToPerKft(liveR).toFixed(4)}</span> Ω/1000 ft</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div ref={asDivRef(manualRRef.ref)} className="pt-1">
            <CalcInput
              label="Resistance" unit={form.lengthUnit === 'ft' ? 'Ω/1000 ft' : 'Ω/km'}
              required fieldId="vd-resistance" type="number" min="0" step="0.001"
              value={form.manualResistance}
              onChange={(e) => set('manualResistance', e.target.value)}
              placeholder="e.g. 0.815"
              hint={form.lengthUnit === 'ft' ? 'Enter in Ω/1000 ft — converted automatically.' : 'Enter in Ω/km.'}
              invalid={error?.field === 'manualResistance'}
            />
          </div>
        )}
      </CalcSection>

      {error && <CalcError id="vd-error" message={error.msg} />}

      <CalcActions
        onCalculate={handleCalculate}
        onReset={handleReset}
        calculateLabel="Calculate Voltage Drop"
        icon={<Activity className="w-4 h-4" />}
      />

      {/* ── Results ────────────────────────────────────── */}
      {result && (
        <div ref={asDivRef(resultRef)} id="vd-results" className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CalcSection title="Results">
            {/* Visual drop bar */}
            <VoltageProfileDiagram pct={pct} limit={allowedPct} />

            <ResultGrid cols={3}>
              <ResultCard label="Voltage Drop" value={result.vd.toFixed(2)} unit="V" variant="primary" />
              <ResultCard label="Drop %" value={`${pct.toFixed(2)}%`} sub="of Supply" variant={pctVariant(pct)} />
              <ResultCard label="Max Length" value={result.maxLengthDisplay.toFixed(1)} unit={form.lengthUnit} sub={`@ ${allowedPct}% limit`} variant="muted" />
            </ResultGrid>

            {pct > 5 && (
              <StatusBanner variant="red" icon={<AlertTriangle className="w-4 h-4" />}>
                Warning: Voltage drop exceeds 5% limit ({pct.toFixed(2)}%)
              </StatusBanner>
            )}
            {pct > 3 && pct <= 5 && (
              <StatusBanner variant="amber" icon={<AlertTriangle className="w-4 h-4" />}>
                Voltage drop exceeds 3% recommended limit ({pct.toFixed(2)}%)
              </StatusBanner>
            )}
            {pct <= 3 && (
              <StatusBanner variant="green" icon={<ThumbsUp className="w-4 h-4" />}>
                Voltage drop within acceptable limits ({pct.toFixed(2)}% ≤ 3%)
              </StatusBanner>
            )}

            {form.resistanceMode === 'standard' && (
              <>
                {result.recommendedKey === null && (
                  <StatusBanner variant="green" icon={<ThumbsUp className="w-4 h-4" />}>
                    Selected cable is acceptable — {getLabelByKey(form.conductorSize)} ({form.material}), {pct.toFixed(2)}% drop ≤ {allowedPct}% limit
                  </StatusBanner>
                )}
                {result.recommendedKey && result.recommendedKey !== 'none' && (
                  <StatusBanner variant="primary" icon={<CheckCircle2 className="w-4 h-4" />}>
                    Recommended: <span className="underline underline-offset-2">{getLabelByKey(result.recommendedKey)}</span> — smallest {form.material} conductor within {allowedPct}% drop limit
                  </StatusBanner>
                )}
                {result.recommendedKey === 'none' && (
                  <StatusBanner variant="amber" icon={<AlertTriangle className="w-4 h-4" />}>
                    No suitable cable size found. Reduce cable length, load, or voltage drop limit.
                  </StatusBanner>
                )}
              </>
            )}

            <InfoBox>
              <p className="font-medium text-foreground mb-1">Formulas</p>
              <p>Vd = (√3 × I × L × R) / 1000</p>
              <p>%Drop = (Vd / V) × 100</p>
              <p>L<sub>max</sub> = (V × {allowedPct}% × 1000) / (√3 × I × R)</p>
              <p className="opacity-70 pt-0.5">
                R used: {result.usedR.toFixed(4)} Ω/km · L: {toMeters(parseFloat(form.length), form.lengthUnit).toFixed(1)} m
              </p>
            </InfoBox>
          </CalcSection>
        </div>
      )}
    </CalcShell>
  );
}
