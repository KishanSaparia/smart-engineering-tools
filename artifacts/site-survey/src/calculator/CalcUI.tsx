/**
 * CalcUI.tsx – Shared UI primitives for all Electrical Calculator pages.
 *
 * Components exported:
 *  CalcSection   – white card section with title + decorative title bar
 *  FieldLabel    – labelled wrapper for any form element
 *  CalcInput     – labelled number input with optional unit suffix
 *  CalcSelect    – labelled styled <select> with consistent styling
 *  CalcSegment   – toggle-button group (pill-style)
 *  CalcToggle    – labelled on/off switch
 *  CalcError     – red alert strip
 *  CalcActions   – Calculate + Reset button row
 *  ResultCard    – single metric result bubble
 *  ResultGrid    – 2/3/4 column grid of ResultCards
 *  HeroMetric    – large centred single result hero
 *  StatusBanner  – SAFE / UNSAFE / custom status strip
 *  InfoBox       – neutral muted info pill
 *  useScrollRef  – hook: ref + scrollTo() helper
 */
import { type ReactNode, useRef } from 'react';
import { AlertTriangle, RotateCcw, Zap } from 'lucide-react';

/* ─── Section Card ───────────────────────────────────────── */

export function CalcSection({
  title,
  children,
  id,
}: {
  title?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4 overflow-visible"
    >
      {title && (
        <div className="flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-primary/60 shrink-0" />
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            {title}
          </h2>
        </div>
      )}
      {children}
    </section>
  );
}

/* ─── Labelled Field Wrapper ─────────────────────────────── */

export function FieldLabel({
  label,
  unit,
  required,
  hint,
  children,
  id,
}: {
  label: string;
  unit?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1.5"
      >
        {label}
        {required && <span className="text-primary">*</span>}
        {unit && <span className="opacity-50 ml-0.5">({unit})</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/60 mt-1">{hint}</p>}
    </div>
  );
}

/* ─── Shared Input / Select Class ────────────────────────── */

const INPUT_CLS =
  'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground ' +
  'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 ' +
  'focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed';

/* ─── Number / Text Input ────────────────────────────────── */

export function CalcInput(props: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  unit?: string;
  required?: boolean;
  hint?: string;
  fieldId?: string;
  /** Highlight field as invalid (red border) */
  invalid?: boolean;
}) {
  const { label, unit, required, hint, fieldId, invalid, className: _, ...inputProps } = props;
  return (
    <FieldLabel label={label} unit={unit} required={required} hint={hint} id={fieldId}>
      <input
        id={fieldId}
        {...inputProps}
        className={`${INPUT_CLS} ${invalid ? 'border-destructive ring-2 ring-destructive/20' : ''}`}
      />
    </FieldLabel>
  );
}

/* ─── Styled Select ──────────────────────────────────────── */

export function CalcSelect({
  label,
  unit,
  required,
  hint,
  fieldId,
  value,
  onChange,
  options,
  placeholder,
  invalid,
}: {
  label: string;
  unit?: string;
  required?: boolean;
  hint?: string;
  fieldId?: string;
  value: string | number;
  onChange: (v: string) => void;
  options: readonly { value: string | number; label: string }[];
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <FieldLabel label={label} unit={unit} required={required} hint={hint} id={fieldId}>
      <select
        id={fieldId}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT_CLS} ${invalid ? 'border-destructive ring-2 ring-destructive/20' : ''}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldLabel>
  );
}

/* ─── Segment / Toggle-Button Group ─────────────────────── */

export function CalcSegment<T extends string | number>({
  label,
  options,
  value,
  onChange,
  renderLabel,
}: {
  label?: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  renderLabel?: (v: T) => ReactNode;
}) {
  return (
    <div>
      {label && (
        <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      )}
      <div className="flex gap-1.5 flex-wrap">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={String(opt)}
              type="button"
              onClick={() => onChange(opt)}
              className={`flex-1 min-w-0 py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all ${
                active
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-foreground border-border hover:border-primary/40 hover:bg-muted/40'
              }`}
            >
              {renderLabel ? renderLabel(opt) : String(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Toggle Switch ──────────────────────────────────────── */

export function CalcToggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-primary/50 ${
          value ? 'bg-primary' : 'bg-muted-foreground/30'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

/* ─── Error Banner ───────────────────────────────────────── */

export function CalcError({ message, id }: { message: string; id?: string }) {
  return (
    <div
      id={id}
      className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-150"
    >
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

/* ─── Action Row ─────────────────────────────────────────── */

export function CalcActions({
  onCalculate,
  onReset,
  calculateLabel = 'Calculate',
  calculateId,
  loading,
  icon,
}: {
  onCalculate: () => void;
  onReset: () => void;
  calculateLabel?: string;
  calculateId?: string;
  loading?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <button
        id={calculateId}
        type="button"
        onClick={onCalculate}
        disabled={loading}
        className="flex-1 relative flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm shadow-primary/20 disabled:opacity-60 overflow-hidden group"
      >
        {/* Shimmer effect */}
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        {icon ?? <Zap className="w-4 h-4" />}
        {calculateLabel}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="p-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors"
        title="Reset all fields"
      >
        <RotateCcw className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}

/* ─── Single Result Card ─────────────────────────────────── */

type ResultVariant = 'primary' | 'muted' | 'green' | 'amber' | 'red';

const variantClasses: Record<ResultVariant, string> = {
  primary: 'bg-primary/10 border-primary/20 text-primary',
  muted:   'bg-muted/40 border-border text-foreground',
  green:   'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
  amber:   'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
  red:     'bg-destructive/10 border-destructive/30 text-destructive',
};

export function ResultCard({
  label,
  value,
  unit,
  sub,
  variant = 'primary',
  large,
  id,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: string;
  variant?: ResultVariant;
  large?: boolean;
  id?: string;
}) {
  const cls = variantClasses[variant];
  return (
    <div id={id} className={`rounded-xl border p-4 text-center ${cls}`}>
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className={`font-bold ${large ? 'text-3xl' : 'text-xl'}`}>
        {value}
        {unit && <span className={`font-semibold ml-1 ${large ? 'text-lg' : 'text-sm'}`}>{unit}</span>}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Result Grid ────────────────────────────────────────── */

export function ResultGrid({
  cols = 2,
  children,
}: {
  cols?: 2 | 3 | 4;
  children: ReactNode;
}) {
  const gridCls =
    cols === 2 ? 'grid-cols-2' :
    cols === 3 ? 'grid-cols-2 sm:grid-cols-3' :
    'grid-cols-2 sm:grid-cols-4';
  return <div className={`grid gap-3 ${gridCls}`}>{children}</div>;
}

/* ─── Hero Metric (large single result) ──────────────────── */

export function HeroMetric({
  label,
  value,
  unit,
  sub,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-primary/10 border border-primary/20 p-6 text-center ${className ?? ''}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-4xl font-extrabold text-primary">
        {value}
        {unit && <span className="text-xl font-semibold ml-1">{unit}</span>}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Status Banner ──────────────────────────────────────── */

export function StatusBanner({
  variant,
  icon,
  children,
}: {
  variant: 'green' | 'amber' | 'red' | 'primary';
  icon?: ReactNode;
  children: ReactNode;
}) {
  const colours = {
    green:   'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
    amber:   'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
    red:     'bg-destructive/10 border-destructive/30 text-destructive',
    primary: 'bg-primary/10 border-primary/30 text-primary',
  };
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${colours[variant]}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="text-sm font-semibold">{children}</span>
    </div>
  );
}

/* ─── Info / Muted Note Box ──────────────────────────────── */

export function InfoBox({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground space-y-1 ${className ?? ''}`}>
      {children}
    </div>
  );
}

/* ─── Divider with optional label ────────────────────────── */

export function SectionDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-border" />
      {label && (
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/* ─── useScrollToRef helper hook ─────────────────────────── */

/**
 * Returns a ref + a `scrollTo()` function.
 * Call scrollTo() to smoothly scroll the attached element into view.
 */
export function useScrollRef<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);
  const scrollTo = () =>
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return { ref, scrollTo };
}
