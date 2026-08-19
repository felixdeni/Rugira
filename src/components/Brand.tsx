import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "brand-gradient flex size-12 items-center justify-center rounded-2xl font-display text-2xl font-extrabold text-primary-foreground shadow-lg shadow-primary/30",
        className,
      )}
      aria-hidden="true"
    >
      R
    </span>
  );
}

export function Wordmark({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Logo />
      <div className="leading-tight">
        <p className="font-display text-2xl font-extrabold brand-text">Rwema</p>
        {subtitle ? <p className="text-xs text-muted-foreground">Developed by Chanel</p> : null}
      </div>
    </div>
  );
}
