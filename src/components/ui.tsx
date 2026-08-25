import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("glass-card p-5", className)}>{children}</div>;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "sky" | "yellow" | "ghost" | "outline" | "danger";
  size?: "md" | "lg" | "sm";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-4 text-base",
        variant === "primary" && "brand-gradient text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-105",
        variant === "sky" && "bg-secondary text-secondary-foreground hover:brightness-105",
        variant === "yellow" && "bg-accent text-accent-foreground hover:brightness-105",
        variant === "outline" && "border border-border bg-card/60 text-foreground hover:bg-muted",
        variant === "ghost" && "text-muted-foreground hover:bg-muted hover:text-foreground",
        variant === "danger" && "bg-destructive text-destructive-foreground hover:brightness-105",
        className,
      )}
      {...props}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const controlClasses =
  "w-full rounded-2xl border border-input bg-card/70 px-4 py-3 text-base text-foreground outline-none transition focus:border-secondary focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClasses, "min-h-[120px] resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClasses, "appearance-none", className)} {...props}>
      {children}
    </select>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "green",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone?: "green" | "sky" | "yellow";
}) {
  return (
    <Card className="flex items-start gap-4">
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-2xl",
          tone === "green" && "bg-primary/15 text-primary",
          tone === "sky" && "bg-secondary/20 text-secondary",
          tone === "yellow" && "bg-accent/25 text-accent-foreground",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="truncate text-xl font-bold text-foreground">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </Card>
  );
}