import { useState } from 'react';
import { Flame, AlertTriangle, CheckCircle, Info, RotateCcw, ShieldAlert, User } from 'lucide-react';
import CalcShell from './CalcShell';
import {
  CalcSection,
  CalcInput,
  CalcSegment,
  CalcError,
  CalcToggle,
  CalcActions,
  ResultCard,
  ResultGrid,
  StatusBanner,
  InfoBox,
  useScrollRef,
} from './CalcUI';
import {
  EquipmentType,
  ElectrodeConfig,
  ArcFlashInputs,
  ArcFlashResult,
  runArcFlashEngine
} from './arcFlashEngine';

type DistanceUnit = 'mm' | 'in';

const EQUIPMENT_TYPES: EquipmentType[] = ['Switchgear', 'Switchboard', 'MCC', 'Panelboard', 'Open Air'];
const ELECTRODE_CONFIGS: (ElectrodeConfig | '')[] = ['', 'Vertical', 'Horizontal'];

function Badge({ source }: { source: 'User' | 'Assumed' }) {
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-1 ${
      source === 'User'
        ? 'bg-primary/20 text-primary'
        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
    }`}>
      {source === 'User' ? 'User' : 'Auto'}
    </span>
  );
}

function AuditRow({ label, value, source }: { label: string; value: string; source: 'User' | 'Assumed' }) {
  return (
    <div className="flex justify-between items-center border-b border-border/50 pb-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-foreground">{value}</span>
        <Badge source={source} />
      </div>
    </div>
  );
}

function riskVariant(risk: string): 'green' | 'amber' | 'red' {
  if (risk === 'LOW') return 'green';
  if (risk === 'MEDIUM') return 'amber';
  return 'red';
}

function riskHeroClasses(risk: string) {
  switch (risk) {
    case 'LOW':     return 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400';
    case 'MEDIUM':  return 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400';
    case 'HIGH':    return 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400';
    case 'EXTREME': return 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400';
    default:        return 'bg-muted border-border text-muted-foreground';
  }
}

/* ── Hazard Boundary Diagram ─────────────────────────────── */
function HazardBoundaryDiagram({ boundaryM, workingDistMm, riskLevel }: {
  boundaryM: number;
  workingDistMm: number;
  riskLevel: string;
}) {
  const colours: Record<string, string> = {
    LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', EXTREME: '#ef4444',
  };
  const col = colours[riskLevel] ?? '#94a3b8';
  const workingM = workingDistMm / 1000;
  const scale = 110 / Math.max(boundaryM, workingM, 1);
  const cx = 150;
  const cy = 150;
  const rBoundary = Math.min(boundaryM * scale, 110);
  const rWorking = Math.min(workingM * scale, 110);
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto" aria-hidden="true">
        {/* Outer boundary circle */}
        <circle cx={cx} cy={cy} r={rBoundary} fill={col} fillOpacity="0.08" stroke={col} strokeWidth="2" strokeDasharray="6 3" />
        {/* Working distance circle */}
        <circle cx={cx} cy={cy} r={rWorking} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" className="text-muted-foreground/50" />
        {/* Inner zone */}
        <circle cx={cx} cy={cy} r={Math.min(rBoundary * 0.3, 20)} fill={col} fillOpacity="0.25" />
        {/* Worker icon */}
        <circle cx={cx} cy={cy - rWorking} r="5" fill={col} fillOpacity="0.8" />
        <line x1={cx} y1={cy - rWorking + 5} x2={cx} y2={cy - rWorking + 15} stroke={col} strokeWidth="2" strokeOpacity="0.8" />
        {/* Labels */}
        <text x={cx + rBoundary + 4} y={cy} fontSize="9" fill={col} fontWeight="600">{boundaryM.toFixed(1)} m</text>
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={col} fontWeight="700">{riskLevel}</text>
        <text x={cx + rWorking + 4} y={cy - 4} fontSize="8" fill="currentColor" className="text-muted-foreground">WD: {(workingDistMm / 1000).toFixed(1)} m</text>
      </svg>
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-[2px] rounded" style={{ background: col, border: `1px dashed ${col}` }}></span>Arc Flash Boundary</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-[1px] bg-muted-foreground/40 rounded"></span>Working Distance</span>
      </div>
    </div>
  );
}

/* ── PPE Category Card ───────────────────────────────────── */
const PPE_INFO: Record<string, { label: string; items: string[]; colour: string }> = {
  'Category 0': { label: 'Category 0 (< 1.2 cal/cm²)', colour: 'border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400', items: ['Non-melting, flammable material', 'Safety glasses / face shield', 'Leather gloves'] },
  'Category 1': { label: 'Category 1 (1.2–4 cal/cm²)', colour: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400', items: ['Arc-rated clothing (min. 4 cal/cm²)', 'Arc-rated face shield', 'Heavy-duty leather gloves'] },
  'Category 2': { label: 'Category 2 (4–8 cal/cm²)', colour: 'border-orange-500/30 bg-orange-500/5 text-orange-700 dark:text-orange-400', items: ['Arc-rated shirt + pants (min. 8 cal/cm²)', 'Arc-rated face shield / hood', 'Arc-rated gloves', 'Leather work shoes'] },
  'Category 3': { label: 'Category 3 (8–25 cal/cm²)', colour: 'border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-400', items: ['Arc flash suit (min. 25 cal/cm²)', 'Arc-rated hood / face shield', 'Arc-rated gloves', 'Hearing protection', 'Leather boots'] },
  'Category 4': { label: 'Category 4 (25–40 cal/cm²)', colour: 'border-red-600/40 bg-red-600/10 text-red-800 dark:text-red-400', items: ['Heavy arc flash suit (min. 40 cal/cm²)', 'Arc-rated hood', 'Insulated gloves', 'Hearing protection', 'Leather boots'] },
};

function PPECard({ category, energy }: { category: string; energy: number }) {
  const info = PPE_INFO[category];
  if (!info) return null;
  return (
    <div className={`rounded-xl border p-4 ${info.colour}`}>
      <p className="text-xs font-bold uppercase tracking-wider mb-2">PPE Required: {info.label}</p>
      <ul className="space-y-1">
        {info.items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-[11px]">
            <span className="w-1 h-1 rounded-full bg-current shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ArcFlashAnalysis() {
  // Mandatory
  const [voltage, setVoltage] = useState('');
  const [faultCurrent, setFaultCurrent] = useState('');
  const [equipmentType, setEquipmentType] = useState<EquipmentType | ''>('');
  const [grounded, setGrounded] = useState(true);

  // Optional overrides
  const [gap, setGap] = useState('');
  const [workingDistance, setWorkingDistance] = useState('');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('mm');
  const [clearingTime, setClearingTime] = useState('');
  const [arcCurrent, setArcCurrent] = useState('');
  const [electrodeConfig, setElectrodeConfig] = useState<ElectrodeConfig | ''>('');

  const { ref: resultRef, scrollTo: scrollToResult } = useScrollRef();
  const [calcTriggered, setCalcTriggered] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const handleReset = () => {
    setVoltage(''); setFaultCurrent(''); setEquipmentType(''); setGrounded(true);
    setGap(''); setWorkingDistance(''); setDistanceUnit('mm');
    setClearingTime(''); setArcCurrent(''); setElectrodeConfig('');
    setCalcTriggered(false); setManualError(null);
  };

  const isMandatoryValid = voltage !== '' && faultCurrent !== '' && equipmentType !== '';

  let results: ArcFlashResult | null = null;
  if (isMandatoryValid) {
    let wdMm: number | undefined;
    if (workingDistance !== '') {
      wdMm = distanceUnit === 'in' ? Number(workingDistance) * 25.4 : Number(workingDistance);
    }
    const inputs: ArcFlashInputs = {
      voltage: Number(voltage),
      faultCurrent: Number(faultCurrent),
      equipmentType: equipmentType as EquipmentType,
      grounded,
      gap: gap === '' ? undefined : Number(gap),
      workingDistance: wdMm,
      clearingTime: clearingTime === '' ? undefined : Number(clearingTime),
      arcCurrent: arcCurrent === '' ? undefined : Number(arcCurrent),
      electrodeConfig: electrodeConfig === '' ? undefined : electrodeConfig as ElectrodeConfig,
    };
    results = runArcFlashEngine(inputs);
  }

  function handleCalculate() {
    if (!isMandatoryValid) {
      setManualError('Please fill in all mandatory fields: System Voltage, Fault Current, and Equipment Type.');
      return;
    }
    setManualError(null);
    setCalcTriggered(true);
    setTimeout(scrollToResult, 100);
  }

  return (
    <CalcShell
      icon={<Flame className="w-4 h-4 text-white" />}
      iconBg="bg-orange-500"
      title="Arc Flash Analysis"
      subtitle="IEEE 1584 Simplified · Incident Energy · PPE Category"
      breadcrumbLabel="Arc Flash"
      accent="orange"
    >
      {/* ── Warning Badge ──────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
        <Flame className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">IEEE 1584 Simplified Model</p>
          <p className="text-xs text-orange-600/80 dark:text-orange-400/70 mt-0.5">
            For screening purposes only. All results must be reviewed by a licensed professional engineer.
          </p>
        </div>
      </div>

      {/* ── Inputs ─────────────────────────────────────── */}
          {/* Mandatory Inputs */}
          <CalcSection title="Mandatory System Inputs">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">REQUIRED</span>
            </div>

            <CalcInput label="System Voltage" unit="V" required fieldId="af-voltage"
              type="number" min="0" placeholder="e.g. 480"
              value={voltage} onChange={(e) => { setVoltage(e.target.value); setCalcTriggered(false); }}
              invalid={calcTriggered && !voltage} />

            <CalcInput label="Bolted Fault Current" unit="kA" required fieldId="af-fault"
              type="number" min="0" step="0.1" placeholder="e.g. 20.5"
              value={faultCurrent} onChange={(e) => { setFaultCurrent(e.target.value); setCalcTriggered(false); }}
              invalid={calcTriggered && !faultCurrent} />

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Equipment Type <span className="text-primary">*</span>
              </label>
              <select value={equipmentType}
                onChange={(e) => { setEquipmentType(e.target.value as EquipmentType); setCalcTriggered(false); }}
                className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${calcTriggered && !equipmentType ? 'border-destructive ring-2 ring-destructive/20' : 'border-border'}`}
              >
                <option value="" disabled>Select Equipment…</option>
                {EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <CalcToggle
              label="Solidly Grounded System"
              description="Affects arc flash calculation method"
              value={grounded}
              onChange={setGrounded}
            />
          </CalcSection>

          {/* Optional Overrides */}
          <CalcSection title="Configuration Overrides">
            <p className="text-[11px] text-muted-foreground leading-relaxed -mt-1">
              Leave blank to use standard assumptions based on equipment type.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-foreground mb-1 flex items-center">
                  Gap (mm) <Badge source={gap === '' ? 'Assumed' : 'User'} />
                </label>
                <input type="number" min="0" placeholder="Auto" value={gap}
                  onChange={(e) => setGap(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-foreground mb-1 flex items-center">
                  Clearing Time (s) <Badge source={clearingTime === '' ? 'Assumed' : 'User'} />
                </label>
                <input type="number" min="0" step="0.01" placeholder="Auto (0.2s)" value={clearingTime}
                  onChange={(e) => setClearingTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-medium text-foreground mb-1 flex items-center">
                  Working Distance <Badge source={workingDistance === '' ? 'Assumed' : 'User'} />
                </label>
                <div className="flex gap-2">
                  <input type="number" min="0" placeholder="Auto based on Equipment" value={workingDistance}
                    onChange={(e) => setWorkingDistance(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                  <div className="flex rounded-xl border border-border overflow-hidden shrink-0">
                    {(['mm', 'in'] as DistanceUnit[]).map((u) => (
                      <button key={u} onClick={() => setDistanceUnit(u)}
                        className={`px-3 py-2 text-xs font-semibold transition-all ${distanceUnit === u ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-foreground mb-1 flex items-center">
                  Arc Current (kA) <Badge source={arcCurrent === '' ? 'Assumed' : 'User'} />
                </label>
                <input type="number" min="0" step="0.1" placeholder="Auto" value={arcCurrent}
                  onChange={(e) => setArcCurrent(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-foreground mb-1 flex items-center">
                  Electrode <Badge source={electrodeConfig === '' ? 'Assumed' : 'User'} />
                </label>
                <select value={electrodeConfig} onChange={(e) => setElectrodeConfig(e.target.value as ElectrodeConfig)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
                  <option value="">Auto (Vertical)</option>
                  <option value="Vertical">Vertical</option>
                  <option value="Horizontal">Horizontal</option>
                </select>
              </div>
            </div>
          </CalcSection>

          {/* Error */}
          {manualError && <CalcError message={manualError} />}

      {/* Actions */}
      <CalcActions
        onCalculate={handleCalculate}
        onReset={handleReset}
        calculateLabel="Calculate Arc Flash"
        icon={<Flame className="w-4 h-4" />}
      />

          {/* Engineering Notes */}
          <CalcSection>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Engineering Notes</p>
                <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc pl-3 leading-relaxed">
                  <li>Simplified arc flash model based on IEEE 1584 concepts.</li>
                  <li>Results heavily depend on exact protection clearing time.</li>
                  <li>Hazard increases with higher fault current, longer clearing time, smaller working distance.</li>
                  <li>Do not use for compliance without a licensed PE review.</li>
                </ul>
              </div>
            </div>
          </CalcSection>
      {/* ── Results ────────────────────────────────────── */}
      <div ref={resultRef}>
          {!results ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-card rounded-2xl border border-border shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
                <Flame className="w-8 h-8 text-orange-500/40" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Awaiting Input</h3>
              <p className="text-sm text-muted-foreground">Fill all mandatory fields and click Calculate.</p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Hero Risk Card */}
              <div className={`rounded-2xl border p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm ${riskHeroClasses(results.riskLevel)}`}>
                <div className="flex items-center gap-5">
                  {results.riskLevel === 'LOW'
                    ? <CheckCircle className="w-12 h-12 shrink-0" />
                    : <AlertTriangle className="w-12 h-12 shrink-0" />
                  }
                  <div>
                    <p className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-1">
                      Risk Level: {results.riskLevel}
                    </p>
                    <p className="text-4xl font-extrabold">
                      {results.incidentEnergy.toFixed(2)}{' '}
                      <span className="text-xl font-semibold">cal/cm²</span>
                    </p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-xs font-semibold opacity-70 uppercase tracking-wider mb-1">PPE Requirement</p>
                  <p className="text-3xl font-extrabold">{results.ppeCategory}</p>
                </div>
              </div>

              {/* Hazard Boundary Diagram */}
              <CalcSection title="Hazard Boundary Diagram">
                <HazardBoundaryDiagram
                  boundaryM={results.arcFlashBoundary}
                  workingDistMm={results.appliedValues.workingDistance}
                  riskLevel={results.riskLevel}
                />
              </CalcSection>

              {/* Key Metrics */}
              <CalcSection title="Key Results">
                <ResultGrid cols={2}>
                  <ResultCard label="Arc Flash Boundary" value={results.arcFlashBoundary.toFixed(2)} unit="m"
                    sub={`${(results.arcFlashBoundary * 3.28084).toFixed(2)} ft`}
                    variant={riskVariant(results.riskLevel)} large />
                  <ResultCard label="Estimated Arc Current"
                    value={results.arcCurrent.toFixed(2)} unit="kA"
                    sub={`Bolted: ${faultCurrent} kA`}
                    variant="primary" large />
                </ResultGrid>
                {/* PPE Card */}
                <PPECard category={results.ppeCategory} energy={results.incidentEnergy} />
              </CalcSection>

              {/* Parameter Audit Log */}
              <CalcSection title="Parameter Audit Log">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">
                  <AuditRow label="Bolted Fault Current" value={`${faultCurrent} kA`} source="User" />
                  <AuditRow label="Arc Duration" value={`${results.appliedValues.clearingTime} s`} source={results.assumptionMap.clearingTime} />
                  <AuditRow label="Working Distance" value={`${results.appliedValues.workingDistance} mm`} source={results.assumptionMap.workingDistance} />
                  <AuditRow label="Conductor Gap" value={`${results.appliedValues.gap} mm`} source={results.assumptionMap.gap} />
                  <AuditRow label="Electrode Config" value={results.appliedValues.electrodeConfig} source={results.assumptionMap.electrodeConfig} />
                </div>
              </CalcSection>

              {/* Recommendations */}
              {results.recommendations.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4" />
                    Safety &amp; Engineering Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {results.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
      </div>
    </CalcShell>
  );
}
