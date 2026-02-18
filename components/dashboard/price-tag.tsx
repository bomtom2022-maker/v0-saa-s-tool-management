"use client";

export function PriceTag({ value, suffix }: { value?: number; suffix?: string }) {
  if (value == null || value <= 0) return null;
  return (
    <span className="inline-flex shrink-0 items-center rounded bg-muted/60 px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
      R$&nbsp;{value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      {suffix && <span className="ml-0.5 opacity-70">{suffix}</span>}
    </span>
  );
}
