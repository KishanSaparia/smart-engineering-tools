import { useState } from 'react';
import { Settings, RotateCcw, AlertTriangle, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import CalcShell from './CalcShell';
import {
  CalcSection,
  CalcInput,
  CalcSelect,
  CalcToggle,
  CalcSegment,
  CalcActions,
  InfoBox,
} from './CalcUI';
import {
  CableMaterial,
  STANDARD_CONTINUOUS_RATINGS,
  STANDARD_KAIC_RATINGS,
  STANDARD_BREAKER_SIZES,
  TRANSFORMER_AMPACITY_COPPER_75C
} from './transformerDesignData';
import {
  FullSystemInputs,
  ValidationResult,
  runFullSystemValidationEngine
} from './validationEngine';

type ResistanceUnit = 'ohm/km' | 'ohm/ft';

export default function FullSystemValidation() {

  // Transformer Inputs
  const [txForm, setTxForm] = useState({ kVA: '', primaryV: '', secondaryV: '', impedancePercent: '' });
  // Cable Inputs
  const [cbForm, setCbForm] = useState({ size: '', material: 'Copper' as CableMaterial, runs: '', length: '', lengthUnit: 'ft' as 'ft' | 'm', customResistance: '', resistanceUnit: 'ohm/km' as ResistanceUnit });
  // Load Inputs
  const [ldForm, setLdForm] = useState({ current: '', isContinuous: true });
  // Breaker Inputs (Optional)
  const [brForm, setBrForm] = useState({ rating: '', kAIC: '' });
  // Equipment Inputs
  const [eqForm, setEqForm] = useState({ rating: '', kAIC: '' });
  // Design Settings
  const [dsForm, setDsForm] = useState({ vdLimit: 3 });

  const CABLE_SIZES = Object.keys(TRANSFORMER_AMPACITY_COPPER_75C);

  const handleReset = () => {
    setTxForm({ kVA: '', primaryV: '', secondaryV: '', impedancePercent: '' });
    setCbForm({ size: '', material: 'Copper', runs: '', length: '', lengthUnit: 'ft', customResistance: '', resistanceUnit: 'ohm/km' as ResistanceUnit });
    setLdForm({ current: '', isContinuous: true });
    setBrForm({ rating: '', kAIC: '' });
    setEqForm({ rating: '', kAIC: '' });
    setDsForm({ vdLimit: 3 });
  };

  const isTxValid = txForm.kVA !== '' && txForm.primaryV !== '' && txForm.secondaryV !== '' && txForm.impedancePercent !== '';
  const isCbValid = cbForm.size !== '' && cbForm.runs !== '' && cbForm.length !== '';
  const isLdValid = ldForm.current !== '';
  const isEqValid = eqForm.rating !== '' && eqForm.kAIC !== '';

  let results: ValidationResult | null = null;

  if (isTxValid && isCbValid && isLdValid && isEqValid) {
    const inputs: FullSystemInputs = {
      transformer: {
        kVA: Number(txForm.kVA),
        primaryV: Number(txForm.primaryV),
        secondaryV: Number(txForm.secondaryV),
        impedancePercent: Number(txForm.impedancePercent)
      },
      cable: {
        size: cbForm.size,
        material: cbForm.material,
        runs: Number(cbForm.runs),
        length: Number(cbForm.length),
        lengthUnit: cbForm.lengthUnit,
        customResistance: cbForm.customResistance === '' ? 0 : Number(cbForm.customResistance),
        resistanceUnit: cbForm.resistanceUnit
      },
      load: {
        current: Number(ldForm.current),
        isContinuous: ldForm.isContinuous
      },
      breaker: {
        rating: brForm.rating === '' ? undefined : Number(brForm.rating),
        kAIC: brForm.kAIC === '' ? undefined : Number(brForm.kAIC)
      },
      equipment: {
        rating: Number(eqForm.rating),
        kAIC: Number(eqForm.kAIC)
      },
      design: {
        vdLimit: dsForm.vdLimit
      }
    };

    results = runFullSystemValidationEngine(inputs);
  }

  return (
    <CalcShell
      icon={<ShieldCheck className="w-4 h-4 text-white" />}
      iconBg="bg-teal-600"
      title="Full System Validation Engine"
      subtitle="Transformer · Cable · Breaker · Equipment · NEC"
      breadcrumbLabel="System Validation"
      accent="emerald"
    >

      {/* ── Inputs ─────────────────────────────────────── */}

      <CalcSection title="Transformer Parameters">
        <CalcInput label="Transformer Rating" unit="kVA" required fieldId="fsv-kva"
          type="number" min="0" placeholder="e.g. 1000" value={txForm.kVA}
          onChange={e => setTxForm(p => ({ ...p, kVA: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <CalcInput label="Primary Voltage" unit="V" required fieldId="fsv-vpri"
            type="number" min="0" placeholder="e.g. 13800" value={txForm.primaryV}
            onChange={e => setTxForm(p => ({ ...p, primaryV: e.target.value }))} />
          <CalcInput label="Secondary Voltage" unit="V" required fieldId="fsv-vsec"
            type="number" min="0" placeholder="e.g. 480" value={txForm.secondaryV}
            onChange={e => setTxForm(p => ({ ...p, secondaryV: e.target.value }))} />
        </div>
        <CalcInput label="Impedance" unit="%Z" required fieldId="fsv-impedance"
          type="number" min="0.1" max="100" step="0.01" placeholder="e.g. 5.75" value={txForm.impedancePercent}
          onChange={e => setTxForm(p => ({ ...p, impedancePercent: e.target.value }))}
          hint="Between 0.1% and 100%" />
      </CalcSection>

      <CalcSection title="Load Details">
        <CalcInput label="Load Current" unit="A" required fieldId="fsv-load"
          type="number" min="0" placeholder="e.g. 800" value={ldForm.current}
          onChange={e => setLdForm(p => ({ ...p, current: e.target.value }))} />
        <CalcToggle label="Continuous Load" description="Apply 125% NEC rule"
          value={ldForm.isContinuous} onChange={(v) => setLdForm(p => ({ ...p, isContinuous: v }))} />
      </CalcSection>

      <CalcSection title="Cable Configuration">
        <div className="grid grid-cols-2 gap-3">
          <CalcSelect label="Cable Size" required fieldId="fsv-csize"
            value={cbForm.size}
            onChange={v => setCbForm(p => ({ ...p, size: v }))}
            options={CABLE_SIZES.map(s => ({ value: s, label: s }))}
            placeholder="Select Size…" />
          <CalcInput label="Parallel Runs" fieldId="fsv-runs"
            type="number" min="1" max="6" placeholder="e.g. 1" value={cbForm.runs}
            onChange={e => setCbForm(p => ({ ...p, runs: e.target.value }))} />
        </div>
        <div>
          <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1.5">
            Cable Length <span className="text-primary">*</span> <span className="opacity-50 ml-0.5">(ft/m)</span>
          </label>
          <div className="flex gap-2">
            <input type="number" min="0" placeholder="e.g. 150" value={cbForm.length} onChange={e => setCbForm(p => ({ ...p, length: e.target.value }))} className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            <div className="flex rounded-xl border border-border overflow-hidden shrink-0">
              {(['ft', 'm'] as const).map(u => (
                <button key={u} onClick={() => setCbForm(p => ({ ...p, lengthUnit: u }))}
                  className={`px-3 py-2 text-sm font-semibold transition-all ${cbForm.lengthUnit === u ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}>{u}</button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1.5">
            Resistance <span className="opacity-50">(Optional)</span>
          </label>
          <div className="flex gap-2">
            <input type="number" min="0" step="0.001" placeholder="Standard Table Used" value={cbForm.customResistance} onChange={e => setCbForm(p => ({ ...p, customResistance: e.target.value }))} className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            <select value={cbForm.resistanceUnit} onChange={e => setCbForm(p => ({ ...p, resistanceUnit: e.target.value as ResistanceUnit }))} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all">
              <option value="ohm/km">Ω/km</option>
              <option value="ohm/ft">Ω/ft</option>
            </select>
          </div>
        </div>
        <CalcSegment label="Conductor Material"
          options={['Copper', 'Aluminum'] as CableMaterial[]}
          value={cbForm.material}
          onChange={v => setCbForm(p => ({ ...p, material: v }))}
          renderLabel={v => v} />
        <CalcSegment label="Voltage Drop Limit"
          options={[3, 5] as const}
          value={dsForm.vdLimit as 3 | 5}
          onChange={(v) => setDsForm(p => ({ ...p, vdLimit: v }))}
          renderLabel={v => `${v}%`} />
      </CalcSection>

      <CalcSection title="Breaker (Optional)">
        <div className="grid grid-cols-2 gap-3">
          <CalcSelect label="Breaker Rating" unit="A" fieldId="fsv-br-rating"
            value={brForm.rating}
            onChange={v => setBrForm(p => ({ ...p, rating: v }))}
            options={STANDARD_BREAKER_SIZES.map(r => ({ value: String(r), label: r + 'A' }))}
            placeholder="Not Spec'd" />
          <CalcSelect label="SC Rating" unit="kAIC" fieldId="fsv-br-sc"
            value={brForm.kAIC}
            onChange={v => setBrForm(p => ({ ...p, kAIC: v }))}
            options={STANDARD_KAIC_RATINGS.map(r => ({ value: String(r), label: r + 'kA' }))}
            placeholder="Not Spec'd" />
        </div>
      </CalcSection>

      <CalcSection title="Downstream Equipment">
        <div className="grid grid-cols-2 gap-3">
          <CalcSelect label="Continuous Rating" unit="A" required fieldId="fsv-eq-cont"
            value={eqForm.rating}
            onChange={v => setEqForm(p => ({ ...p, rating: v }))}
            options={STANDARD_CONTINUOUS_RATINGS.map(r => ({ value: String(r), label: r + 'A' }))}
            placeholder="Select Rating…" />
          <CalcSelect label="SC Rating" unit="kAIC" required fieldId="fsv-eq-sc"
            value={eqForm.kAIC}
            onChange={v => setEqForm(p => ({ ...p, kAIC: v }))}
            options={STANDARD_KAIC_RATINGS.map(r => ({ value: String(r), label: r + 'kA' }))}
            placeholder="Select kAIC…" />
        </div>
      </CalcSection>

      <CalcActions onCalculate={() => { }} onReset={handleReset}
        calculateLabel="Validate System" icon={<ShieldCheck className="w-4 h-4" />} />
      <InfoBox>
        <p className="font-medium text-foreground mb-1">Engineering Notes</p>
        <p>• Conductor ampacity based on NEC 310.16.</p>
        <p>• Parallel conductors allowed ≥ 1/0 AWG (NEC 310.10(H)).</p>
        <p>• Breaker sizing per NEC principles (rating ≥ load).</p>
        <p>• Fault current via generic impedance method.</p>
      </InfoBox>

      {/* ── Results ────────────────────────────────────── */}
      {!results ? (
        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-card rounded-2xl border border-border shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-teal-500/40" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">Awaiting Data</h3>
          <p className="text-sm text-muted-foreground">Fill all required fields to validate your system.</p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Overall Status Bar */}
          <div className={`rounded-2xl border p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm ${results.overallStatus === 'SAFE' ? 'bg-emerald-500/10 border-emerald-500/30' :
              results.overallStatus === 'WARNING' ? 'bg-amber-500/10 border-amber-500/30' :
                'bg-destructive/10 border-destructive/30'
            }`}>
            <div className="flex items-center gap-4">
              {results.overallStatus === 'SAFE' ? (
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              ) : results.overallStatus === 'WARNING' ? (
                <AlertTriangle className="w-10 h-10 text-amber-500" />
              ) : (
                <XCircle className="w-10 h-10 text-destructive" />
              )}
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {results.overallStatus.replace('_', ' ')}
                </h2>
                <p className="text-sm text-foreground/80 mt-1">
                  Design Current: {results.iDesign.toFixed(1)} A
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground">Resistance Data</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{results.resistanceUsedInfo}</p>
            </div>
          </div>

          {/* Validation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cable */}
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Cable</h3>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Ampacity</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${results.cable.ampacityStatus === 'SAFE' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-destructive/20 text-destructive'}`}>
                  {results.cable.ampacityStatus}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Voltage Drop</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${results.cable.vdStatus === 'SAFE' ? 'bg-emerald-500/20 text-emerald-600' :
                    results.cable.vdStatus === 'WARNING' ? 'bg-amber-500/20 text-amber-600' :
                      'bg-destructive/20 text-destructive'
                  }`}>
                  {results.cable.vdStatus}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Headroom</span>
                <span className="text-xs font-semibold">{results.cable.headroom.toFixed(1)}%</span>
              </div>
            </div>

            {/* Fault */}
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Fault Current</h3>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Transformer</span>
                <span className="text-xs font-semibold">{results.fault.transformerFault.toFixed(2)} kA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">End Fault</span>
                <span className="text-xs font-bold text-destructive">{results.fault.endFault.toFixed(2)} kA</span>
              </div>
            </div>

            {/* Breaker */}
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Breaker</h3>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Continuous</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${results.breaker.continuousStatus === 'N/A' ? 'bg-muted text-muted-foreground' :
                    results.breaker.continuousStatus === 'SAFE' ? 'bg-emerald-500/20 text-emerald-600' :
                      'bg-destructive/20 text-destructive'
                  }`}>
                  {results.breaker.continuousStatus}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Short Circuit</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${results.breaker.scStatus === 'N/A' ? 'bg-muted text-muted-foreground' :
                    results.breaker.scStatus === 'SAFE' ? 'bg-emerald-500/20 text-emerald-600' :
                      'bg-destructive/20 text-destructive'
                  }`}>
                  {results.breaker.scStatus}
                </span>
              </div>
            </div>

            {/* Equipment */}
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Equipment</h3>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Continuous</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${results.equipment.continuousStatus === 'SAFE' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-destructive/20 text-destructive'}`}>
                  {results.equipment.continuousStatus}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Short Circuit</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${results.equipment.scStatus === 'SAFE' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-destructive/20 text-destructive'}`}>
                  {results.equipment.scStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Smart Recommendations */}
          {results.recommendations.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-semibold text-amber-700 dark:text-amber-500 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" />
                Smart Recommendations
              </h3>
              <ul className="space-y-2">
                {results.recommendations.filter(r => !r.startsWith('Recommended')).map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {rec}
                  </li>
                ))}
              </ul>

              {/* Embedded Recommended Text */}
              <div className="mt-4 pt-4 border-t border-amber-500/20 space-y-1">
                {results.recommendations.filter(r => r.startsWith('Recommended')).map((rec, i) => (
                  <p key={i} className="text-sm font-bold text-foreground">{rec}</p>
                ))}
              </div>
            </div>
          )}

          {/* Better Option Widget (Only if user design is not the top recommendation) */}
          {results.optimalSolutions.length > 0 &&
            (results.optimalSolutions[0].size !== cbForm.size || results.optimalSolutions[0].runs !== Number(cbForm.runs)) && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-semibold text-primary mb-2">Better Option Available</h3>
                <p className="text-sm text-foreground mb-4">Your current configuration is not perfectly optimal. Consider this replacement:</p>

                <div className="rounded-xl border border-primary/20 bg-background p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {results.optimalSolutions[0].runs > 1 ? `${results.optimalSolutions[0].runs} × ` : ''}{results.optimalSolutions[0].size} {cbForm.material}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Breaker: {results.optimalSolutions[0].recommendedBreaker}A, {results.optimalSolutions[0].recommendedKaic}kAIC |
                      VD: {results.optimalSolutions[0].vdPercent.toFixed(2)}% |
                      Ampacity: {results.optimalSolutions[0].totalAmpacity}A
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (results && results.optimalSolutions.length > 0) {
                        setCbForm(p => ({
                          ...p,
                          size: results.optimalSolutions[0].size,
                          runs: results.optimalSolutions[0].runs.toString()
                        }));
                        setBrForm({
                          rating: results.optimalSolutions[0].recommendedBreaker.toString(),
                          kAIC: results.optimalSolutions[0].recommendedKaic.toString()
                        });
                      }
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
                  >
                    Apply Suggestion
                  </button>
                </div>
              </div>
            )}

          {/* Auto Design Suggestions Table */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-3">
              Auto Design Alternatives
            </h3>

            {results.optimalSolutions.length === 0 ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive font-medium">
                No valid cable meets the ampacity and voltage drop limits for this configuration.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {results.optimalSolutions.map((sol, idx) => {
                  let tag = '';
                  let containerClass = '';
                  let tagClass = '';

                  if (idx === 0) {
                    tag = '✅ Recommended';
                    containerClass = 'border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20 bg-emerald-500/5';
                    tagClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
                  } else if (idx === 1) {
                    tag = '⚖ Alternative';
                    containerClass = 'border-border shadow-sm bg-card';
                    tagClass = 'bg-primary/10 text-primary border border-primary/20';
                  } else {
                    tag = '🟢 Conservative';
                    containerClass = 'border-border shadow-sm bg-card';
                    tagClass = 'bg-muted text-muted-foreground border border-border';
                  }

                  return (
                    <div key={idx} className={`rounded-xl border p-5 ${containerClass}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium mb-1.5 ${tagClass}`}>
                            {tag}
                          </span>
                          <p className="text-base font-bold text-foreground">
                            {sol.runs > 1 ? `${sol.runs} × ` : ''}{sol.size} {cbForm.material}
                          </p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="text-muted-foreground">End Fault</p>
                          <p className="text-sm font-bold text-destructive">{(sol.faultCurrentAtEnd / 1000).toFixed(2)} kA</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="text-muted-foreground">Breaker Profile</p>
                          <p className="font-semibold text-foreground">{sol.recommendedBreaker}A / {sol.recommendedKaic}kA</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Headroom</p>
                          <p className="font-semibold text-foreground">{sol.headroom.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Voltage Drop</p>
                          <p className={`font-semibold ${sol.vdPercent > dsForm.vdLimit ? 'text-destructive' : 'text-emerald-500'}`}>
                            {sol.vdVolts.toFixed(1)}V ({sol.vdPercent.toFixed(2)}%)
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Runs / Phase</p>
                          <p className="font-semibold text-foreground">{sol.runs}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </CalcShell>
  );
}
