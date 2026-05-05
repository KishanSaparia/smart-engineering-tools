import { useState } from 'react';
import { Settings, RotateCcw, AlertTriangle, CheckCircle, XCircle, Network } from 'lucide-react';
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
  TRANSFORMER_AMPACITY_COPPER_75C
} from './transformerDesignData';
import {
  TransformerInputs,
  CableInputs,
  EquipmentInputs,
  DesignInputs,
  VerifyLoadInputs,
  VerifyCableInputs,
  runTransformerDesignEngine,
  runTransformerVerifyEngine
} from './transformerDesignEngine';

interface LocalTxForm {
  kVA: number | '';
  primaryV: number | '';
  secondaryV: number | '';
  impedancePercent: number | '';
}

interface LocalCbForm {
  material: CableMaterial;
  length: number | '';
  lengthUnit: 'ft' | 'm';
  customResistance: number | '';
  resistanceUnit: 'ohm/km' | 'ohm/ft';
}

interface LocalEqForm {
  continuousRating: number | '';
  scRating: number | '';
}

interface VerifyCbForm extends LocalCbForm {
  size: string;
  runs: number | '';
}

interface VerifyLdForm {
  current: number | '';
  isContinuous: boolean;
}

const DEFAULT_TX: LocalTxForm = { kVA: '', primaryV: '', secondaryV: '', impedancePercent: '' };
const DEFAULT_CB: LocalCbForm = { material: 'Copper', length: '', lengthUnit: 'ft', customResistance: '', resistanceUnit: 'ohm/km' };
const DEFAULT_EQ: LocalEqForm = { continuousRating: '', scRating: '' };
const DEFAULT_DS: DesignInputs = { isContinuous: true, vdLimit: 3 };

const DEFAULT_VERIFY_CB: VerifyCbForm = { ...DEFAULT_CB, size: '#2 AWG', runs: 1 };
const DEFAULT_VERIFY_LD: VerifyLdForm = { current: '', isContinuous: true };

export default function TransformerDesign() {
  const [mode, setMode] = useState<'design' | 'verify'>('design');
  
  const [txForm, setTxForm] = useState<LocalTxForm>(DEFAULT_TX);
  const [eqForm, setEqForm] = useState<LocalEqForm>(DEFAULT_EQ);
  
  const [cbForm, setCbForm] = useState<LocalCbForm>(DEFAULT_CB);
  const [dsForm, setDsForm] = useState<DesignInputs>(DEFAULT_DS);

  const [vCbForm, setVCbForm] = useState<VerifyCbForm>(DEFAULT_VERIFY_CB);
  const [vLdForm, setVLdForm] = useState<VerifyLdForm>(DEFAULT_VERIFY_LD);
  const [vDsLimit, setVDsLimit] = useState<number>(3);

  const CABLE_SIZES = Object.keys(TRANSFORMER_AMPACITY_COPPER_75C);

  const handleReset = () => {
    setTxForm(DEFAULT_TX);
    setEqForm(DEFAULT_EQ);
    if (mode === 'design') {
      setCbForm(DEFAULT_CB);
      setDsForm(DEFAULT_DS);
    } else {
      setVCbForm(DEFAULT_VERIFY_CB);
      setVLdForm(DEFAULT_VERIFY_LD);
      setVDsLimit(3);
    }
  };

  let designResults = null;
  let verifyResults = null;
  
  const isTxValid = txForm.kVA !== '' && txForm.primaryV !== '' && txForm.secondaryV !== '' && txForm.impedancePercent !== '';
  const isEqValid = eqForm.continuousRating !== '' && eqForm.scRating !== '';

  const isCbValid = cbForm.length !== '';
  if (mode === 'design' && isTxValid && isCbValid && isEqValid) {
    designResults = runTransformerDesignEngine(
      txForm as TransformerInputs,
      { ...cbForm, customResistance: cbForm.customResistance === '' ? 0 : cbForm.customResistance, tempRating: '75°C' } as CableInputs,
      eqForm as EquipmentInputs,
      dsForm
    );
  }

  const isVCbValid = vCbForm.length !== '' && vCbForm.runs !== '';
  const isVLdValid = vLdForm.current !== '';
  if (mode === 'verify' && isTxValid && isVCbValid && isVLdValid && isEqValid) {
    verifyResults = runTransformerVerifyEngine(
      txForm as TransformerInputs,
      { ...vCbForm, runs: Number(vCbForm.runs), customResistance: vCbForm.customResistance === '' ? 0 : vCbForm.customResistance } as VerifyCableInputs,
      vLdForm as VerifyLoadInputs,
      eqForm as EquipmentInputs,
      vDsLimit
    );
  }

  return (
    <CalcShell
      icon={<Network className="w-4 h-4 text-white" />}
      iconBg="bg-sky-600"
      title="Transformer Fault, Cable & Equipment Engine"
      subtitle="End-to-end System Optimizer · NEC Compliant"
      breadcrumbLabel="Transformer Engine"
      accent="primary"
    >

      {/* Mode Tabs */}
      <CalcSegment
        options={['design', 'verify'] as const}
        value={mode}
        onChange={(v) => setMode(v)}
        renderLabel={(v) => v === 'design' ? 'Design Mode' : 'Verify Mode'}
      />


      {/* ── Inputs ─────────────────────────────────────── */}
      <CalcSection title="Transformer Parameters">
        <CalcInput label="Transformer Rating" unit="kVA" required fieldId="td-kva"
          type="number" min="0" step="any" value={txForm.kVA}
          onChange={e => setTxForm(p => ({ ...p, kVA: e.target.value === '' ? '' : Number(e.target.value) }))}
          placeholder="e.g. 1000" />
        <div className="grid grid-cols-2 gap-3">
          <CalcInput label="Primary Voltage" unit="V" required fieldId="td-vpri"
            type="number" min="0" step="any" value={txForm.primaryV}
            onChange={e => setTxForm(p => ({ ...p, primaryV: e.target.value === '' ? '' : Number(e.target.value) }))}
            placeholder="e.g. 13800" />
          <CalcInput label="Secondary Voltage" unit="V" required fieldId="td-vsec"
            type="number" min="0" step="any" value={txForm.secondaryV}
            onChange={e => setTxForm(p => ({ ...p, secondaryV: e.target.value === '' ? '' : Number(e.target.value) }))}
            placeholder="e.g. 480" />
        </div>
        <CalcInput label="Impedance" unit="%Z" required fieldId="td-impedance"
          type="number" min="0.1" max="100" step="any" value={txForm.impedancePercent}
          onChange={e => setTxForm(p => ({ ...p, impedancePercent: e.target.value === '' ? '' : Number(e.target.value) }))}
          placeholder="e.g. 5.75" hint="Between 0.1% and 100%" />
      </CalcSection>

      {mode === 'verify' && (
        <CalcSection title="Load Details">
          <CalcInput label="Load Current" unit="A" required fieldId="td-load"
            type="number" min="0" step="any" value={vLdForm.current}
            onChange={e => setVLdForm(p => ({ ...p, current: e.target.value === '' ? '' : Number(e.target.value) }))}
            placeholder="e.g. 800" />
          <CalcToggle label="Continuous Load" description="Apply 125% NEC rule"
            value={vLdForm.isContinuous} onChange={(v) => setVLdForm(p => ({ ...p, isContinuous: v }))} />
        </CalcSection>
      )}

      <CalcSection title="Cable Configuration">
        {mode === 'verify' && (
          <div className="grid grid-cols-2 gap-3">
            <CalcSelect label="Cable Size" required fieldId="td-csize"
              value={vCbForm.size}
              onChange={v => setVCbForm(p => ({ ...p, size: v }))}
              options={CABLE_SIZES.map(s => ({ value: s, label: s }))}
              placeholder="Select Size…" />
            <CalcInput label="Parallel Runs" fieldId="td-runs"
              type="number" min="1" max="6" value={vCbForm.runs}
              onChange={e => setVCbForm(p => ({ ...p, runs: e.target.value === '' ? '' : Number(e.target.value) }))}
              placeholder="e.g. 1" />
          </div>
        )}
        <div>
          <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1.5">
            Cable Length <span className="text-primary">*</span> <span className="opacity-50 ml-0.5">(ft/m)</span>
          </label>
          <div className="flex gap-2">
            <input type="number" min="0" placeholder="e.g. 150"
              value={mode === 'design' ? cbForm.length : vCbForm.length}
              onChange={e => {
                const val = e.target.value === '' ? '' : Number(e.target.value);
                if (mode === 'design') setCbForm(p => ({ ...p, length: val }));
                else setVCbForm(p => ({ ...p, length: val }));
              }}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            <div className="flex rounded-xl border border-border overflow-hidden shrink-0">
              {(['ft', 'm'] as const).map(u => (
                <button key={u} onClick={() => {
                  if (mode === 'design') setCbForm(p => ({ ...p, lengthUnit: u }));
                  else setVCbForm(p => ({ ...p, lengthUnit: u }));
                }}
                  className={`px-3 py-2 text-sm font-semibold transition-all ${
                    (mode === 'design' ? cbForm.lengthUnit : vCbForm.lengthUnit) === u
                      ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'
                  }`}>{u}</button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1.5">
            Resistance <span className="opacity-50">(Optional)</span>
          </label>
          <div className="flex gap-2">
            <input type="number" min="0" step="0.001" placeholder="Standard Table Used"
              value={mode === 'design' ? cbForm.customResistance : vCbForm.customResistance}
              onChange={e => {
                const val = e.target.value === '' ? '' : Number(e.target.value);
                if (mode === 'design') setCbForm(p => ({ ...p, customResistance: val }));
                else setVCbForm(p => ({ ...p, customResistance: val }));
              }}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            <select value={mode === 'design' ? cbForm.resistanceUnit : vCbForm.resistanceUnit}
              onChange={e => {
                const val = e.target.value as 'ohm/km' | 'ohm/ft';
                if (mode === 'design') setCbForm(p => ({ ...p, resistanceUnit: val }));
                else setVCbForm(p => ({ ...p, resistanceUnit: val }));
              }}
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all">
              <option value="ohm/km">Ω/km</option>
              <option value="ohm/ft">Ω/ft</option>
            </select>
          </div>
        </div>
        <CalcSegment label="Conductor Material"
          options={['Copper', 'Aluminum'] as CableMaterial[]}
          value={mode === 'design' ? cbForm.material : vCbForm.material}
          onChange={v => { if (mode === 'design') setCbForm(p => ({ ...p, material: v })); else setVCbForm(p => ({ ...p, material: v })); }}
          renderLabel={v => v} />
        <CalcSegment label="Voltage Drop Limit"
          options={[3, 5] as const}
          value={(mode === 'design' ? dsForm.vdLimit : vDsLimit) as 3 | 5}
          onChange={v => mode === 'design' ? setDsForm(p => ({ ...p, vdLimit: v })) : setVDsLimit(v)}
          renderLabel={v => `${v}%`} />
      </CalcSection>

      <CalcSection title="Downstream Equipment">
        <div className="grid grid-cols-2 gap-3">
          <CalcSelect label="Continuous Rating" unit="A" required fieldId="td-eq-cont"
            value={eqForm.continuousRating === '' ? '' : String(eqForm.continuousRating)}
            onChange={v => setEqForm(p => ({ ...p, continuousRating: v === '' ? '' : Number(v) }))}
            options={STANDARD_CONTINUOUS_RATINGS.map(r => ({ value: String(r), label: r + ' A' }))}
            placeholder="Select Rating…" />
          <CalcSelect label="SC Rating" unit="kAIC" required fieldId="td-eq-sc"
            value={eqForm.scRating === '' ? '' : String(eqForm.scRating)}
            onChange={v => setEqForm(p => ({ ...p, scRating: v === '' ? '' : Number(v) }))}
            options={STANDARD_KAIC_RATINGS.map(r => ({ value: String(r), label: r + ' kA' }))}
            placeholder="Select kAIC…" />
        </div>
        {mode === 'design' && (
          <CalcToggle label="Continuous Load (125%)" description="Apply NEC 125% continuous load factor"
            value={dsForm.isContinuous} onChange={(v) => setDsForm(p => ({ ...p, isContinuous: v }))} />
        )}
      </CalcSection>

      {/* ── Actions ────────────────────────────────────── */}
      <CalcActions onCalculate={() => {}} onReset={handleReset}
        calculateLabel={mode === 'design' ? 'Generate Design' : 'Verify Design'}
        icon={<Network className="w-4 h-4" />} />

      {/* ── Results ────────────────────────────────────── */}
            {(mode === 'design' && !designResults) || (mode === 'verify' && !verifyResults) ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-12 bg-card rounded-2xl border border-border shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Network className="w-8 h-8 text-primary/30" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Awaiting Input</h3>
                <p className="text-sm text-muted-foreground">Fill all required fields to {mode === 'design' ? 'generate a design' : 'verify your design'}.</p>
              </div>
            ) : mode === 'design' && designResults ? (
              // DESIGN MODE RESULTS
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Transformer FLC</p>
                    <p className="text-2xl font-bold text-foreground">{designResults.transformer.flc.toFixed(1)} <span className="text-sm font-semibold">A</span></p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Secondary SC Fault</p>
                    <p className="text-2xl font-bold text-destructive">{(designResults.transformer.scSecondary / 1000).toFixed(1)} <span className="text-sm font-semibold">kA</span></p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Primary SC Fault</p>
                    <p className="text-2xl font-bold text-foreground">{(designResults.transformer.scPrimary / 1000).toFixed(2)} <span className="text-sm font-semibold">kA</span></p>
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                  <h3 className="text-lg font-semibold text-foreground flex items-center justify-between">
                    Cable Network Solutions
                    <span className="text-xs font-normal text-muted-foreground">Design Current: {designResults.transformer.iDesign.toFixed(1)} A</span>
                  </h3>

                  {designResults.solutions.length === 0 ? (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-5">
                      <h4 className="text-sm font-semibold text-destructive mb-2">No valid cable meets ampacity and voltage drop limits. Consider:</h4>
                      <ul className="list-disc pl-5 text-sm text-destructive/90 space-y-1">
                        <li>Increasing cable size or parallel runs</li>
                        <li>Increasing VD limit</li>
                        <li>Reducing cable length</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {designResults.solutions.map((sol, idx) => {
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
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">End Fault</p>
                                <p className="text-lg font-bold text-destructive">{(sol.faultCurrentAtEnd / 1000).toFixed(2)} kA</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div>
                                <p className="text-muted-foreground">Total Ampacity</p>
                                <p className="font-semibold text-foreground">{sol.totalAmpacity} A</p>
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
                                <p className="text-muted-foreground">Runs / Size</p>
                                <p className="font-semibold text-foreground">{sol.runs} per phase</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Equipment Rating Verification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`rounded-xl border p-4 ${designResults.equipment.continuousSafe ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-foreground">Continuous Rating</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${designResults.equipment.continuousSafe ? 'bg-emerald-500/20 text-emerald-600' : 'bg-destructive/20 text-destructive'}`}>
                          {designResults.equipment.continuousSafe ? 'SAFE' : 'FAIL'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Required: {designResults.transformer.iDesign.toFixed(0)}A | Rated: {eqForm.continuousRating}A</p>
                      {!designResults.equipment.continuousSafe && (
                        <p className="text-xs font-semibold text-destructive mt-2">
                          Upgrade to {designResults.equipment.recommendedContinuous}A or higher.
                        </p>
                      )}
                    </div>

                    <div className={`rounded-xl border p-4 ${designResults.equipment.scSafe ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-foreground">Short Circuit (kAIC)</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${designResults.equipment.scSafe ? 'bg-emerald-500/20 text-emerald-600' : 'bg-destructive/20 text-destructive'}`}>
                          {designResults.equipment.scSafe ? 'SAFE' : 'FAIL'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Fault: {((designResults.solutions[0]?.faultCurrentAtEnd || designResults.transformer.scSecondary) / 1000).toFixed(1)}kA | Rated: {eqForm.scRating}kA
                      </p>
                      {!designResults.equipment.scSafe && (
                        <p className="text-xs font-semibold text-destructive mt-2">
                          Upgrade to {designResults.equipment.recommendedSc}kA or higher.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : verifyResults && (
              // VERIFY MODE RESULTS
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {/* Overall Status */}
                <div className={`rounded-2xl border p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm ${
                  verifyResults.recommendations.length === 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-destructive/10 border-destructive/30'
                }`}>
                  <div className="flex items-center gap-4">
                    {verifyResults.recommendations.length === 0 ? (
                      <CheckCircle className="w-10 h-10 text-emerald-500" />
                    ) : (
                      <XCircle className="w-10 h-10 text-destructive" />
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        {verifyResults.recommendations.length === 0 ? 'SAFE' : 'REVIEW REQUIRED'}
                      </h2>
                      <p className="text-sm text-foreground/80 mt-1">
                        Design Current: {verifyResults.iDesign.toFixed(1)} A
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-muted-foreground">Resistance Data</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{verifyResults.resistanceUsedInfo}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Cable Card */}
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                    <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">Cable</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Ampacity</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${verifyResults.ampacityStatus === 'SAFE' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-destructive/20 text-destructive'}`}>
                          {verifyResults.ampacityStatus}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Voltage Drop</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          verifyResults.vdStatus === 'SAFE' ? 'bg-emerald-500/20 text-emerald-600' :
                          verifyResults.vdStatus === 'WARNING' ? 'bg-amber-500/20 text-amber-600' :
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {verifyResults.vdStatus}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Headroom</span>
                        <span className="text-xs font-semibold text-foreground">{verifyResults.headroom.toFixed(1)}%</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground pt-1">{verifyResults.totalAmpacity}A Total | {verifyResults.vdVolts.toFixed(1)}V ({verifyResults.vdPercent.toFixed(2)}%) VD</p>
                    </div>
                  </div>

                  {/* Fault Card */}
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                    <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">Fault Current</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Transformer</span>
                        <span className="text-xs font-bold text-foreground">{verifyResults.transformerFault.toFixed(2)} kA</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">End of Line</span>
                        <span className="text-xs font-bold text-destructive">{verifyResults.endFault.toFixed(2)} kA</span>
                      </div>
                    </div>
                  </div>

                  {/* Equipment Card */}
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                    <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">Equipment</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Continuous</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${Number(eqForm.continuousRating) >= verifyResults.iDesign ? 'bg-emerald-500/20 text-emerald-600' : 'bg-destructive/20 text-destructive'}`}>
                          {Number(eqForm.continuousRating) >= verifyResults.iDesign ? 'SAFE' : 'FAIL'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Short Circuit</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${Number(eqForm.scRating) >= verifyResults.endFault ? 'bg-emerald-500/20 text-emerald-600' : 'bg-destructive/20 text-destructive'}`}>
                          {Number(eqForm.scRating) >= verifyResults.endFault ? 'SAFE' : 'FAIL'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {verifyResults.recommendations.length > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 space-y-4 shadow-sm">
                    <h3 className="text-base font-semibold text-amber-700 dark:text-amber-500 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Smart Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {verifyResults.recommendations.filter(r => !r.startsWith('Recommended:')).map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                          <span className="text-amber-500 mt-0.5">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Better Option */}
                {verifyResults.closestSolution && (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-primary mb-2">Better Option Available</h3>
                    <p className="text-sm text-foreground mb-4">The system calculated an optimal replacement for your design:</p>
                    
                    <div className="rounded-xl border border-primary/20 bg-background p-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {verifyResults.closestSolution.runs > 1 ? `${verifyResults.closestSolution.runs} × ` : ''}{verifyResults.closestSolution.size} {vCbForm.material}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ampacity: {verifyResults.closestSolution.totalAmpacity}A | VD: {verifyResults.closestSolution.vdPercent.toFixed(2)}% | End Fault: {(verifyResults.closestSolution.faultCurrentAtEnd / 1000).toFixed(2)}kA
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          if (verifyResults && verifyResults.closestSolution) {
                            setVCbForm(p => ({
                              ...p, 
                              size: verifyResults.closestSolution!.size,
                              runs: verifyResults.closestSolution!.runs
                            }));
                          }
                        }}
                        className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Apply Suggestion
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
    </CalcShell>
  );
}
