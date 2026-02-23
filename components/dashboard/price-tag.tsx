"use client";

export function PriceTag({ value, reformValue, suffix }: { value?: number; reformValue?: number; suffix?: string }) {
  const hasNew = value != null && value > 0;
  const hasReform = reformValue != null && reformValue > 0;
  if (!hasNew && !hasReform) return null;

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Show both values side by side if both exist
  if (hasNew && hasReform) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1">
        <span className="inline-flex items-center rounded bg-muted/60 px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
          R$&nbsp;{fmt(value)}{suffix && <span className="ml-0.5 opacity-70">{suffix}</span>}
        </span>
        <span className="inline-flex items-center rounded bg-sky-500/15 px-1.5 py-0.5 text-xs tabular-nums text-sky-400">
          <span className="font-mono mr-0.5">R</span>R$&nbsp;{fmt(reformValue)}{suffix && <span className="ml-0.5 opacity-70">{suffix}</span>}
        </span>
      </span>
    );
  }

  // Single value (new or reform)
  const displayValue = hasNew ? value : reformValue!;
  const isReform = !hasNew && hasReform;
  return (
    <span className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-xs tabular-nums ${isReform ? "bg-sky-500/15 text-sky-400" : "bg-muted/60 text-muted-foreground"}`}>
      {isReform && <span className="font-mono mr-0.5">R</span>}
      R$&nbsp;{fmt(displayValue)}
      {suffix && <span className="ml-0.5 opacity-70">{suffix}</span>}
    </span>
  );
}
