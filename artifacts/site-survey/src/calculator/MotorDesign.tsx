import { useState, useEffect, useMemo } from 'react';
import { Settings, AlertTriangle, ShieldCheck, ShieldX } from 'lucide-react';
import CalcShell from './CalcShell';
import {
  CalcSection,
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
  MotorHP,
  MotorVoltage,
  MOTOR_HP_LIST,
  MOTOR_VOLTAGES,
  ProtectionDevice
} from './motorTables';
import {
  getFLCfromTable,
  calculateOverload,
  calculateBreakerSize,
  StarterType
} from './motorFormulas';
import {
  generateCableOptions,
  GeneratedSolution
} from './motorEngine';

interface FormState {
  motorType: 'Induction Motor' | 'Synchronous Motor';
  hp: MotorHP | '';
  voltage: MotorVoltage | '';
  starterType: StarterType;
  protectionDevice: ProtectionDevice;
  cableLength: string;
  lengthUnit: 'ft' | 'm';
  allowedVd: 3 | 5;
}

const DEFAULT_FORM: FormState = {
  motorType: 'Induction Motor',
  hp: '',
  voltage: '',
  starterType: 'Not Specified',
  protectionDevice: 'Circuit Breaker',
  cableLength: '50',
  lengthUnit: 'ft',
  allowedVd: 3,
};

const SELECT_CLS =
  'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground ' +
  'focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all';

/* ── Motor nameplate card ─────────────────────────────────── */
function MotorNameplate({ hp, voltage, motorType, starterType }: {
  hp: MotorHP | '';
  voltage: MotorVoltage | '';
  motorType: string;
  starterType: StarterType;
}) {
  if (!hp || !voltage) return null;
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-2">Motor Nameplate</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-muted-foreground">Type</span>
        <span className="font-semibold text-foreground">{motorType}</span>
        <span className="text-muted-foreground">Rating</span>
        <span className="font-semibold text-foreground">{hp} HP</span>
        <span className="text-muted-foreground">Voltage</span>
        <span className="font-semibold text-foreground">{voltage} V (3φ)</span>
        <span className="text-muted-foreground">Starting</span>
        <span className="font-semibold text-foreground">{starterType === 'Not Specified' ? 'DOL (assumed)' : starterType}</span>
      </div>
    </div>
  );
}

export default function MotorDesign() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  // User-triggered error state (e.g. voltage restriction message)
  const [userError, setUserError] = useState<string | null>(null);

  const { ref: resultRef, scrollTo: scrollToResult } = useScrollRef();

  const handleReset = () => { setForm(DEFAULT_FORM); setUserError(null); };

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    let value: any = e.target.value;
    if (key === 'allowedVd') value = Number(value) as 3 | 5;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isHighHP = form.hp ? Number(form.hp) >= 300 : false;
  const availableVoltages = isHighHP ? [460, 575] as MotorVoltage[] : MOTOR_VOLTAGES;

  // ── FIX: voltage restriction effect (moved OUT of render) ──
  useEffect(() => {
    if (isHighHP && form.voltage && ![460, 575].includes(Number(form.voltage))) {
      setForm((prev) => ({ ...prev, voltage: '' }));
      setUserError('Motors 300 HP and above require 460V or 575V. Please select a valid voltage.');
    } else if (userError?.includes('require 460')) {
      setUserError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.hp, isHighHP]);

  // ── Derived results (useMemo so never called during render with side-effects) ──
  const results = useMemo(() => {
    if (!form.hp || !form.voltage) return null;

    const hp = form.hp as MotorHP;
    const voltage = Number(form.voltage) as MotorVoltage;
    const length = Number(form.cableLength);
    const allowedVd = form.allowedVd;
    const flc = getFLCfromTable(hp, voltage);

    if (flc === null) return { error: `No FLC data for ${hp} HP at ${voltage}V in NEC Table 430.250.` };

    const overload = calculateOverload(flc);
    const breaker = calculateBreakerSize(flc, form.protectionDevice);
    let solutions: GeneratedSolution[] = [];
    if (!isNaN(length) && length > 0) {
      const lengthKm = form.lengthUnit === 'ft' ? length / 3280.84 : length / 1000;
      solutions = generateCableOptions(flc, voltage, lengthKm, allowedVd, form.starterType);
    }
    return { flc, overload, breaker, solutions, isSafe: solutions.length > 0, error: null };
  }, [form.hp, form.voltage, form.cableLength, form.lengthUnit, form.allowedVd, form.starterType, form.protectionDevice]);

  // ── Scroll to results when they first appear ──
  useEffect(() => {
    if (results && !results.error) setTimeout(scrollToResult, 150);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.hp, form.voltage]);

  const computedError = results?.error ?? null;
  const displayError = userError ?? computedError;

  return (
    <CalcShell
      icon={<Settings className="w-4 h-4 text-white" />}
      iconBg="bg-emerald-600"
      title="Motor Design & Starting"
      subtitle="NEC 430 · Branch Circuit · Cable Sizing · Protection"
      breadcrumbLabel="Motor Design"
      accent="emerald"
    >
      {/* ── System Info ────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Three-Phase Motor · NEC Art. 430</span>
      </div>

      {/* ── Inputs ─────────────────────────────────────── */}
          <CalcSection title="Motor Parameters">
            {/* Motor Type */}
            <CalcSegment
              label="Motor Type"
              options={['Induction Motor', 'Synchronous Motor'] as const}
              value={form.motorType}
              onChange={(v) => setForm((prev) => ({ ...prev, motorType: v }))}
              renderLabel={(v) => v.split(' ')[0]}
            />

            {/* HP */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Motor Rating <span className="text-primary">*</span> <span className="opacity-50">(HP)</span>
              </label>
              <select value={form.hp} onChange={set('hp')} className={SELECT_CLS}>
                <option value="" disabled>Select HP…</option>
                {MOTOR_HP_LIST.map((hp) => (
                  <option key={hp} value={hp}>{hp} HP</option>
                ))}
              </select>
            </div>

            {/* Voltage */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Voltage <span className="text-primary">*</span> <span className="opacity-50">(V)</span>
              </label>
              <select value={form.voltage} onChange={set('voltage')} className={SELECT_CLS}>
                <option value="" disabled>Select Voltage…</option>
                {availableVoltages.map((v) => (
                  <option key={v} value={v}>{v} V</option>
                ))}
              </select>
              {isHighHP && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  Motors ≥ 300 HP restricted to 460 V or 575 V.
                </p>
              )}
            </div>

            {/* Nameplate summary */}
            <MotorNameplate hp={form.hp} voltage={form.voltage} motorType={form.motorType} starterType={form.starterType} />

            {/* Starter Type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Motor Starter Type</label>
              <select value={form.starterType} onChange={set('starterType')} className={SELECT_CLS}>
                <option value="Not Specified">Not Specified (Assumes DOL)</option>
                <option value="DOL">DOL (Direct Online)</option>
                <option value="Star-Delta">Star-Delta</option>
                <option value="Soft Starter">Soft Starter</option>
                <option value="VFD">VFD</option>
              </select>
              {form.starterType === 'Not Specified' && (
                <p className="text-[11px] text-muted-foreground mt-1">Assumes DOL — worst-case design</p>
              )}
            </div>

            {/* Protection Device */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Protection Device</label>
              <select value={form.protectionDevice} onChange={set('protectionDevice')} className={SELECT_CLS}>
                <option value="Circuit Breaker">Inverse Time Circuit Breaker</option>
                <option value="Time Delay Fuse">Time Delay Fuse</option>
                <option value="Non-Time Delay Fuse">Non-Time Delay Fuse</option>
              </select>
            </div>

            {/* Cable Length */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Cable Length</label>
              <div className="flex gap-2">
                <input
                  type="number" min="0" step="any"
                  value={form.cableLength} onChange={set('cableLength')}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
                <div className="flex rounded-xl border border-border overflow-hidden shrink-0">
                  {(['ft', 'm'] as const).map((u) => (
                    <button key={u} onClick={() => setForm((p) => ({ ...p, lengthUnit: u }))}
                      className={`px-4 py-2.5 text-sm font-semibold transition-all ${form.lengthUnit === u ? 'bg-emerald-500 text-white' : 'bg-background text-foreground hover:bg-muted'}`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Allowed Voltage Drop */}
            <CalcSegment
              label="Allowed Running Voltage Drop"
              options={[3, 5] as const}
              value={form.allowedVd}
              onChange={(v) => setForm((p) => ({ ...p, allowedVd: v }))}
              renderLabel={(v) => `${v}%`}
            />

            {displayError && <CalcError message={displayError} />}

            <CalcActions
              onCalculate={() => {}}
              onReset={handleReset}
              calculateLabel="Recalculate"
              icon={<Settings className="w-4 h-4" />}
            />
          </CalcSection>

          <CalcSection title="Engineering Notes">
            <InfoBox>
              <p>• Starter type affects starting current multiplier.</p>
              <p>• Parallel conductors reduce resistance and voltage drop.</p>
              <p>• Voltage drop increases with cable length.</p>
              <p>• Large motors benefit from reduced-voltage starting (Soft Starter / VFD).</p>
            </InfoBox>
          </CalcSection>
      {/* ── Results ────────────────────────────────────── */}
      <div ref={resultRef}>
          {results && !results.error ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* FLC Hero */}
              <div className="bg-card rounded-2xl border border-emerald-500/30 p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Full Load Current</p>
                  <p className="text-xs text-muted-foreground">NEC Table 430.250 · {form.hp} HP @ {form.voltage} V</p>
                </div>
                <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{results.flc.toFixed(1)} <span className="text-lg font-semibold">A</span></p>
              </div>

              {/* Warnings */}
              {results.solutions.length === 0 && Number(form.cableLength) > 0 && (
                <StatusBanner variant="red" icon={<ShieldX className="w-4 h-4" />}>
                  Cannot meet voltage drop limit — try larger cable, parallel conductors, or reduced-voltage starting.
                </StatusBanner>
              )}
              {results.solutions.length > 0 && results.solutions[0].startingVDPercent > 12 && (
                <StatusBanner variant="amber" icon={<AlertTriangle className="w-4 h-4" />}>
                  High starting voltage drop ({results.solutions[0].startingVDPercent.toFixed(1)}%) — consider VFD or Soft Starter.
                </StatusBanner>
              )}
              {results.solutions.length > 0 && results.solutions[0].headroom > 30 && (
                <StatusBanner variant="primary" icon={<Settings className="w-4 h-4" />}>
                  Cable oversized (headroom {results.solutions[0].headroom.toFixed(1)}%) — consider reducing size if voltage drop allows.
                </StatusBanner>
              )}

              {/* Cable Solutions */}
              {results.solutions.length > 0 && (
                <CalcSection title="Optimized Cable Solutions">
                  <div className="space-y-4">
                    {results.solutions.map((sol, idx) => {
                      const isRec = idx === 0;
                      const isAlt = idx === 1;
                      const border = isRec
                        ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                        : 'border-border bg-card';
                      const tagCls = isRec
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                        : isAlt
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'bg-muted text-muted-foreground border border-border';
                      const tag = isRec ? '✅ Recommended' : isAlt ? '⚖ Alternative' : '🟢 Conservative';
                      return (
                        <div key={idx} className={`rounded-2xl border p-5 shadow-sm ${border}`}>
                          <div className="flex items-center gap-3 mb-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${tagCls}`}>{tag}</span>
                            <p className="text-base font-bold text-foreground">
                              {sol.runs > 1 ? `${sol.runs} × ` : ''}{sol.size} Copper
                            </p>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <ResultCard label="Runs" value={sol.runs} variant="muted" />
                            <ResultCard label="Ampacity/Cable" value={`${sol.ampacity} A`} variant="primary" />
                            <ResultCard label="Total Ampacity" value={`${sol.totalAmpacity} A`} variant="primary" />
                            <ResultCard label="Headroom" value={`${sol.headroom.toFixed(1)}%`}
                              variant={sol.headroom >= 0 ? 'green' : 'red'} />
                            <ResultCard label="Running VD"
                              value={`${sol.runningVDVolts.toFixed(1)} V`}
                              sub={`${sol.runningVDPercent.toFixed(2)}%`}
                              variant={sol.runningVDPercent > form.allowedVd ? 'red' : 'green'} />
                            <ResultCard label="Starting VD"
                              value={`${sol.startingVDVolts.toFixed(1)} V`}
                              sub={`${sol.startingVDPercent.toFixed(2)}%`}
                              variant={sol.startingVDPercent > 15 ? 'red' : 'green'} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CalcSection>
              )}

              {/* Protection */}
              <CalcSection title="Branch Circuit Protection">
                <ResultGrid cols={2}>
                  <ResultCard label="Overload Setting (NEC 430.32)" value={`${results.overload.toFixed(1)} A`} sub="125% of FLC" variant="primary" />
                  <ResultCard label="Short-Circuit Protection" value={`${results.breaker.standard} A`} sub={`Calc: ${results.breaker.calculated.toFixed(1)} A`} variant="primary" />
                </ResultGrid>
              </CalcSection>

              {/* Summary */}
              {results.solutions.length > 0 && (
                <CalcSection title="Final Summary">
                  <StatusBanner variant={results.isSafe ? 'green' : 'red'}
                    icon={results.isSafe ? <ShieldCheck className="w-4 h-4" /> : <ShieldX className="w-4 h-4" />}>
                    {results.isSafe ? 'SAFE — Design meets NEC requirements' : 'REVIEW REQUIRED'}
                  </StatusBanner>
                  <InfoBox>
                    <p>Motor: <span className="font-semibold text-foreground">{form.hp} HP @ {form.voltage} V</span></p>
                    <p>FLC: <span className="font-semibold text-foreground">{results.flc.toFixed(1)} A</span></p>
                    <p>Recommended Cable: <span className="font-semibold text-foreground">
                      {results.solutions[0].runs > 1 ? `${results.solutions[0].runs} × ` : ''}{results.solutions[0].size} Copper
                    </span></p>
                    <p>Protection: <span className="font-semibold text-foreground">{results.breaker.standard} A</span></p>
                  </InfoBox>
                </CalcSection>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-card rounded-2xl border border-border shadow-sm min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <Settings className="w-8 h-8 text-emerald-500/40" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Select Motor HP &amp; Voltage</h3>
              <p className="text-sm text-muted-foreground">Results will appear automatically once both fields are selected.</p>
            </div>
          )}
      </div>
    </CalcShell>
  );
}
