import { useState } from 'react';
import { Zap, ShieldAlert } from 'lucide-react';
import CalcShell from './CalcShell';
import {
  CalcSection,
  CalcInput,
  CalcError,
  CalcActions,
  ResultCard,
  ResultGrid,
  HeroMetric,
  InfoBox,
  useScrollRef,
} from './CalcUI';
import { calcThreePhaseSC, calcPrimaryCurrent, toKA } from './formulas';

interface FormState {
  kva: string;
  primaryVoltage: string;
  secondaryVoltage: string;
  impedance: string;
}

interface Result {
  secondaryKA: number;
  primaryKA: number;
}

const DEFAULT_FORM: FormState = {
  kva: '',
  primaryVoltage: '',
  secondaryVoltage: '',
  impedance: '',
};

type FieldKey = keyof FormState;

function validateForm(form: FormState): { field: FieldKey | null; msg: string } | null {
  const kva = parseFloat(form.kva);
  const vpri = parseFloat(form.primaryVoltage);
  const vsec = parseFloat(form.secondaryVoltage);
  const z = parseFloat(form.impedance);

  if (!form.kva || isNaN(kva) || kva <= 0)
    return { field: 'kva', msg: 'Transformer Rating (kVA) must be a positive number.' };
  if (!form.primaryVoltage || isNaN(vpri) || vpri <= 0)
    return { field: 'primaryVoltage', msg: 'Primary Voltage must be a positive number.' };
  if (!form.secondaryVoltage || isNaN(vsec) || vsec <= 0)
    return { field: 'secondaryVoltage', msg: 'Secondary Voltage must be a positive number.' };
  if (!form.impedance || isNaN(z))
    return { field: 'impedance', msg: 'Impedance (%Z) is required.' };
  if (z < 0.1 || z > 100)
    return { field: 'impedance', msg: 'Impedance (%Z) must be between 0.1 and 100.' };
  return null;
}

/* ── Inline transformer one-line SVG diagram ──────────────── */
function TransformerDiagram({ secKA, priKA }: { secKA?: number; priKA?: number }) {
  return (
    <svg viewBox="0 0 320 90" className="w-full max-w-sm mx-auto" aria-hidden="true">
      {/* Bus / line */}
      <line x1="10" y1="45" x2="100" y2="45" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/50" />
      {/* Transformer core */}
      <ellipse cx="115" cy="45" rx="15" ry="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
      <ellipse cx="145" cy="45" rx="15" ry="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
      <line x1="130" y1="25" x2="130" y2="65" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" className="text-border" />
      {/* Secondary bus */}
      <line x1="160" y1="45" x2="310" y2="45" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/50" />
      {/* Fault arrow on secondary */}
      <line x1="220" y1="45" x2="220" y2="72" stroke="currentColor" strokeWidth="2" className="text-destructive" />
      <polygon points="220,78 215,68 225,68" fill="currentColor" className="text-destructive" />
      {/* Labels */}
      <text x="55" y="38" textAnchor="middle" className="text-[9px] fill-muted-foreground" fontSize="9">Primary</text>
      {priKA !== undefined && (
        <text x="55" y="52" textAnchor="middle" className="text-[8px] fill-foreground font-semibold" fontSize="8" fontWeight="600">
          {priKA.toFixed(2)} kA
        </text>
      )}
      <text x="250" y="38" textAnchor="middle" className="text-[9px] fill-muted-foreground" fontSize="9">Secondary</text>
      {secKA !== undefined && (
        <text x="250" y="52" textAnchor="middle" className="text-[8px] fill-destructive font-semibold" fontSize="8" fontWeight="600">
          {secKA.toFixed(2)} kA
        </text>
      )}
      <text x="220" y="88" textAnchor="middle" className="text-[8px] fill-destructive" fontSize="8">Fault</text>
    </svg>
  );
}

export default function TransformerSC() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<{ field: FieldKey | null; msg: string } | null>(null);

  const { ref: resultRef, scrollTo: scrollToResult } = useScrollRef();
  const fieldRefs: Record<FieldKey, ReturnType<typeof useScrollRef<HTMLDivElement>>> = {
    kva: useScrollRef<HTMLDivElement>(),
    primaryVoltage: useScrollRef<HTMLDivElement>(),
    secondaryVoltage: useScrollRef<HTMLDivElement>(),
    impedance: useScrollRef<HTMLDivElement>(),
  };

  function handleCalculate() {
    const err = validateForm(form);
    if (err) {
      setError(err);
      setResult(null);
      const fieldKey = err.field;
      if (fieldKey) {
        setTimeout(() => fieldRefs[fieldKey].scrollTo(), 80);
      }
      return;
    }

    setError(null);
    const kva = parseFloat(form.kva);
    const vpri = parseFloat(form.primaryVoltage);
    const vsec = parseFloat(form.secondaryVoltage);
    const z = parseFloat(form.impedance);

    const isecAmps = calcThreePhaseSC(kva, vsec, z);
    const ipriAmps = calcPrimaryCurrent(isecAmps, vsec, vpri);

    setResult({ secondaryKA: toKA(isecAmps), primaryKA: toKA(ipriAmps) });
    setTimeout(scrollToResult, 80);
  }

  function handleReset() {
    setForm(DEFAULT_FORM);
    setResult(null);
    setError(null);
  }

  const set = (key: FieldKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (error?.field === key) setError(null);
  };

  return (
    <CalcShell
      icon={<Zap className="w-4 h-4 text-primary-foreground" />}
      iconBg="bg-primary"
      title="Transformer Short Circuit Current"
      subtitle="Three-Phase · Bolted Fault · Infinite Bus"
      breadcrumbLabel="Transformer SC"
      accent="primary"
    >
      {/* ── Info Badge ─────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
        <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-semibold text-primary">Three-Phase · Infinite Bus (Bolted Fault)</span>
      </div>

      {/* ── One-Line Diagram ───────────────────────────── */}
      <CalcSection>
        <TransformerDiagram
          secKA={result?.secondaryKA}
          priKA={result?.primaryKA}
        />
      </CalcSection>

      {/* ── Inputs ─────────────────────────────────────── */}
      <CalcSection title="Transformer Parameters">
        <div ref={fieldRefs.kva.ref}>
          <CalcInput
            label="Transformer Rating" unit="kVA" required fieldId="tsc-kva"
            type="number" min="0" step="any" value={form.kva}
            onChange={set('kva')} placeholder="e.g. 1000"
            invalid={error?.field === 'kva'}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div ref={fieldRefs.primaryVoltage.ref}>
            <CalcInput
              label="Primary Voltage" unit="V" required fieldId="tsc-vpri"
              type="number" min="0" step="any" value={form.primaryVoltage}
              onChange={set('primaryVoltage')} placeholder="e.g. 13800"
              invalid={error?.field === 'primaryVoltage'}
            />
          </div>
          <div ref={fieldRefs.secondaryVoltage.ref}>
            <CalcInput
              label="Secondary Voltage" unit="V" required fieldId="tsc-vsec"
              type="number" min="0" step="any" value={form.secondaryVoltage}
              onChange={set('secondaryVoltage')} placeholder="e.g. 480"
              invalid={error?.field === 'secondaryVoltage'}
            />
          </div>
        </div>
        <div ref={fieldRefs.impedance.ref}>
          <CalcInput
            label="Impedance" unit="%Z" required fieldId="tsc-impedance"
            type="number" min="0.1" max="100" step="any" value={form.impedance}
            onChange={set('impedance')} placeholder="e.g. 5.75"
            hint="Between 0.1% and 100%"
            invalid={error?.field === 'impedance'}
          />
        </div>
      </CalcSection>

      {/* ── Error ──────────────────────────────────────── */}
      {error && <CalcError id="tsc-error" message={error.msg} />}

      {/* ── Actions ────────────────────────────────────── */}
      <CalcActions
        calculateId="tsc-calculate"
        onCalculate={handleCalculate}
        onReset={handleReset}
        calculateLabel="Calculate Fault Current"
        icon={<Zap className="w-4 h-4" />}
      />

      {/* ── Results ────────────────────────────────────── */}
      {result && (
        <div
          ref={resultRef}
          id="tsc-results"
          className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          <CalcSection title="Results">
            <HeroMetric
              label="Secondary Fault Current (Three-Phase)"
              value={result.secondaryKA.toFixed(3)}
              unit="kA"
              sub={`${(result.secondaryKA * 1000).toLocaleString()} A`}
            />
            <ResultGrid cols={2}>
              <ResultCard
                id="tsc-result-secondary"
                label="Secondary Fault"
                value={result.secondaryKA.toFixed(3)}
                unit="kA"
                sub={`${(result.secondaryKA * 1000).toLocaleString()} A`}
                variant="red"
                large
              />
              <ResultCard
                id="tsc-result-primary"
                label="Primary Fault"
                value={result.primaryKA.toFixed(3)}
                unit="kA"
                sub={`${(result.primaryKA * 1000).toLocaleString()} A`}
                variant="muted"
                large
              />
            </ResultGrid>

            <InfoBox>
              <p className="font-medium text-foreground mb-1">Formula Reference</p>
              <p>I<sub>sc</sub> = (kVA × 1000) / (√3 × V<sub>sec</sub> × %Z)</p>
              <p>Results assume <span className="font-medium text-foreground">infinite bus</span> (bolted fault) conditions.</p>
            </InfoBox>
          </CalcSection>
        </div>
      )}
    </CalcShell>
  );
}
