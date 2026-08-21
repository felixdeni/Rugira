import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/icons/rugira-512.png"
      alt="RUGIRA logo"
      className={cn(
        "size-12 rounded-2xl object-cover shadow-lg shadow-primary/30 ring-1 ring-glass-border",
        className,
      )}
      loading="eager"
      decoding="async"
    />
  );
}

export function Wordmark({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Logo />
      <div className="leading-tight">
        <p className="font-display text-2xl font-extrabold brand-text">RUGIRA</p>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-foreground">Refresh</p>
        {subtitle ? <p className="text-xs text-muted-foreground">Developed by Chanel</p> : null}
      </div>
    </div>
  );
}
