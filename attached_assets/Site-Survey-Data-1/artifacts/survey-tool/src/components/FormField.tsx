import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BaseProps {
  label: string;
  required?: boolean;
  className?: string;
  hint?: string;
}

interface InputFieldProps extends BaseProps {
  type: "input";
  value: string;
  onChange: (val: string) => void;
  inputType?: string;
  placeholder?: string;
  unit?: string;
}

interface TextareaFieldProps extends BaseProps {
  type: "textarea";
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}

interface SelectFieldProps extends BaseProps {
  type: "select";
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}

type FormFieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

export function FormField(props: FormFieldProps) {
  const { label, required, className, hint } = props;
  const id = `field-${label.replace(/\W+/g, "-").toLowerCase()}-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {props.type === "input" && (
        <div className="relative">
          <Input
            id={id}
            type={props.inputType || "text"}
            value={props.value}
            onChange={e => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            className={cn("h-9 text-sm", props.unit && "pr-14")}
          />
          {props.unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold pointer-events-none select-none">
              {props.unit}
            </span>
          )}
        </div>
      )}
      {props.type === "textarea" && (
        <Textarea
          id={id}
          value={props.value}
          onChange={e => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          rows={props.rows || 3}
          className="text-sm resize-none"
        />
      )}
      {props.type === "select" && (
        <Select value={props.value || "__none__"} onValueChange={v => props.onChange(v === "__none__" ? "" : v)}>
          <SelectTrigger id={id} className="h-9 text-sm">
            <SelectValue placeholder={props.placeholder || `Select...`} />
          </SelectTrigger>
          <SelectContent>
            {!required && <SelectItem value="__none__">— Select —</SelectItem>}
            {props.options.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {hint && <p className="text-xs text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

export function FormSection({ title, children, cols = 3 }: { title: string; children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  const gridClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[cols];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-bold text-primary uppercase tracking-widest px-2 whitespace-nowrap">{title}</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className={cn("grid gap-4", gridClass)}>
        {children}
      </div>
    </div>
  );
}
