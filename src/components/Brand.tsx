import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-12 items-center justify-center rounded-2xl bg-secondary font-display text-2xl font-extrabold text-accent shadow-lg shadow-secondary/30",
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
