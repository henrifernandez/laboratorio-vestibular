export function BarraProgresso({ valor, rotulo }: { valor: number; rotulo: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(valor * 100)))
  return (
    <div
      role="progressbar"
      aria-label={rotulo}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]"
      style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}
    >
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
    </div>
  )
}
