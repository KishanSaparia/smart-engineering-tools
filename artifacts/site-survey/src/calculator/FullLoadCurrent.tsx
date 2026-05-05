import { useState } from 'react';
import { Gauge } from 'lucide-react';
import CalcShell from './CalcShell';
import {
  CalcSection,
  CalcInput,
  CalcSegment,
  CalcError,
  CalcActions,
  HeroMetric,
  InfoBox,
  useScrollRef,
} from './CalcUI';
import { calcCurrentFromKW, calcCurrentFromKVA, calcCurrentFromHP } from './flcFormulas';

type LoadType = 'kW' | 'kVA' | 'HP';

interface FormState {
  voltage: string;
  loadType: LoadType;
  loadValue: string;
  pf: string;
}

type FieldKey = 'voltage' | 'loadValue' | 'pf';

interface Result {
  current: number;
  voltage: number;
  loadType: LoadType;
  loadValue: number;
  pf: number | null;
}

const DEFAULT_FORM: FormState = {
  voltage: '',
  loadType: 'kW',
  loadValue: '',
  pf: '0.85',
};

function validateForm(form: FormState): { field: FieldKey | null; msg: string } | null {
  const v = parseFloat(form.voltage);
  const load = parseFloat(form.loadValue);
  const pf = parseFloat(form.pf);

  if (!form.voltage || isNaN(v) || v <= 0)
    return { field: 'voltage', msg: 'Voltage must be a positive number.' };
  if (!form.loadValue || isNaN(load) || load <= 0)
    return { field: 'loadValue', msg: `${form.loadType} value must be a positive number.` };
  if (form.loadType !== 'kVA') {
    if (!form.pf || isNaN(pf))
      return { field: 'pf', msg: 'Power Factor is required.' };
    if (pf <= 0 || pf > 1)
      return { field: 'pf', msg: 'Power Factor must be between 0 (exclusive) and 1.' };
  }
  return null;
}

const LOAD_TYPES: LoadType[] = ['kW', 'kVA', 'HP'];

const LOAD_LABEL: Record<LoadType, string> = {
  kW: 'Load (kW)',
  kVA: 'Load (kVA)',
  HP: 'Load (HP)',
};

const LOAD_PLACEHOLDER: Record<LoadType, string> = {
  kW: 'e.g. 15',
  kVA: 'e.g. 20',
  HP: 'e.g. 10',
};

const FORMULA_TEXT: Record<LoadType, React.ReactNode> = {
  kW:  <p>I = (kW × 1000) / (√3 × V × PF)</p>,
  kVA: <p>I = (kVA × 1000) / (√3 × V)</p>,
  HP:  <p>I = (HP × 746) / (√3 × V × PF)</p>,
};

export default function FullLoadCurrent() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<{ field: FieldKey | null; msg: string } | null>(null);

  const { ref: resultRef, scrollTo: scrollToResult } = useScrollRef();
  const voltageRef = useScrollRef();
  const loadRef = useScrollRef();
  const pfRef = useScrollRef();

  const fieldScrollMap: Record<FieldKey, { scrollTo: () => void }> = {
    voltage: voltageRef,
    loadValue: loadRef,
    pf: pfRef,
  };

  const pfDisabled = form.loadType === 'kVA';

  // Live formula preview
  const V = parseFloat(form.voltage);
  const I = parseFloat(form.loadValue);
  const pf = parseFloat(form.pf);
  const liveResult = !isNaN(V) && V > 0 && !isNaN(I) && I > 0 && (pfDisabled || (!isNaN(pf) && pf > 0 && pf <= 1))
    ? (() => {
        switch (form.loadType) {
          case 'kW':  return calcCurrentFromKW(I, V, pf);
          case 'kVA': return calcCurrentFromKVA(I, V);
          case 'HP':  return calcCurrentFromHP(I, V, pf);
        }
      })()
    : null;

  function switchLoadType(type: LoadType) {
    setForm((prev) => ({ ...prev, loadType: type, loadValue: '', pf: type === 'kVA' ? '' : '0.85' }));
    setResult(null);
    setError(null);
  }

  function handleCalculate() {
    const err = validateForm(form);
    if (err) {
      setError(err);
      setResult(null);
      if (err.field) setTimeout(() => fieldScrollMap[err.field!].scrollTo(), 80);
      return;
    }
    setError(null);

    const voltage = parseFloat(form.voltage);
    const loadValue = parseFloat(form.loadValue);
    const pfVal = parseFloat(form.pf);

    let current: number;
    switch (form.loadType) {
      case 'kW':  current = calcCurrentFromKW(loadValue, voltage, pfVal); break;
      case 'kVA': current = calcCurrentFromKVA(loadValue, voltage); break;
      case 'HP':  current = calcCurrentFromHP(loadValue, voltage, pfVal); break;
    }

    setResult({
      current: Math.round(current * 100) / 100,
      voltage,
      loadType: form.loadType,
      loadValue,
      pf: form.loadType === 'kVA' ? null : pfVal,
    });
    setTimeout(scrollToResult, 80);
  }

  function handleReset() {
    setForm(DEFAULT_FORM);
    setResult(null);
    setError(null);
  }

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (error?.field === key) setError(null);
  };

  return (
    <CalcShell
      icon={<Gauge className="w-4 h-4 text-amber-900" />}
      iconBg="bg-amber-500"
      title="Full Load Current Calculator"
      subtitle="Three-Phase AC · kW / kVA / HP · NEC"
      breadcrumbLabel="Full Load Current"
      accent="amber"
    >
      {/* ── Info Badge ─────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Gauge className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Three-Phase AC System</span>
      </div>

      {/* ── Inputs ─────────────────────────────────────── */}
      <CalcSection title="Load Parameters">
        <div ref={voltageRef.ref}>
          <CalcInput
            label="System Voltage" unit="V" required fieldId="flc-voltage"
            type="number" min="0" step="any" value={form.voltage}
            onChange={set('voltage')} placeholder="e.g. 400"
            invalid={error?.field === 'voltage'}
          />
        </div>

        <CalcSegment label="Load Input Type" options={LOAD_TYPES} value={form.loadType} onChange={switchLoadType} />

        <div ref={loadRef.ref}>
          <CalcInput
            label={LOAD_LABEL[form.loadType]} required fieldId="flc-load"
            type="number" min="0" step="any" value={form.loadValue}
            onChange={set('loadValue')} placeholder={LOAD_PLACEHOLDER[form.loadType]}
            invalid={error?.field === 'loadValue'}
          />
        </div>

        <div ref={pfRef.ref}>
          <CalcInput
            label="Power Factor"
            unit={pfDisabled ? 'not needed for kVA' : '0–1'}
            required={!pfDisabled} fieldId="flc-pf"
            type="number" min="0" max="1" step="0.01"
            value={pfDisabled ? '' : form.pf}
            onChange={set('pf')} placeholder={pfDisabled ? '—' : 'e.g. 0.85'}
            disabled={pfDisabled}
            invalid={error?.field === 'pf'}
          />
        </div>

        {/* Live preview */}
        {liveResult !== null && (
          <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
            <span className="text-xs text-muted-foreground">Live Preview</span>
            <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
              {liveResult.toFixed(2)} A
            </span>
          </div>
        )}
      </CalcSection>

      {error && <CalcError id="flc-error" message={error.msg} />}

      <CalcActions
        calculateId="flc-calculate"
        onCalculate={handleCalculate}
        onReset={handleReset}
        calculateLabel="Calculate Full Load Current"
        icon={<Gauge className="w-4 h-4" />}
      />

      {/* ── Results ────────────────────────────────────── */}
      {result && (
        <div
          ref={resultRef}
          id="flc-results"
          className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          <CalcSection title="Results">
            <HeroMetric
              id="flc-result-current"
              label="Full Load Current (Three-Phase)"
              value={result.current.toLocaleString()}
              unit="A"
              className="!bg-amber-500/10 !border-amber-500/20 [&_p:last-of-type]:!text-amber-700 dark:[&_p:last-of-type]:!text-amber-400"
            />

            {/* Input Summary */}
            <div className="rounded-xl bg-muted/40 border border-border px-4 py-3">
              <p className="text-xs font-semibold text-foreground mb-2">Input Summary</p>
              <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                <span className="text-muted-foreground">Voltage</span>
                <span className="text-foreground font-medium text-right">{result.voltage} V</span>
                <span className="text-muted-foreground">Load Type</span>
                <span className="text-foreground font-medium text-right">{result.loadType}</span>
                <span className="text-muted-foreground">{result.loadType} Value</span>
                <span className="text-foreground font-medium text-right">{result.loadValue} {result.loadType}</span>
                {result.pf !== null && (
                  <>
                    <span className="text-muted-foreground">Power Factor</span>
                    <span className="text-foreground font-medium text-right">{result.pf}</span>
                  </>
                )}
              </div>
            </div>

            <InfoBox>
              <p className="font-medium text-foreground mb-1">Formula Reference</p>
              {FORMULA_TEXT[result.loadType]}
            </InfoBox>
          </CalcSection>
        </div>
      )}
    </CalcShell>
  );
}
