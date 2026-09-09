/**
 * Shipped vs roadmap must be distinguishable at a glance, not by reading the
 * sentence around it. Solid green border = available today. Dashed grey =
 * not available, may change, may not ship.
 */
export type CapabilityState = 'shipped' | 'roadmap' | 'dependent';

const STYLES: Record<CapabilityState, { className: string; label: string }> = {
  shipped: {
    className:
      'border-2 border-green-400 bg-green-400/10 text-green-400',
    label: 'Shipped',
  },
  roadmap: {
    className: 'border-2 border-dashed border-gray-500 text-gray-500',
    label: 'Roadmap',
  },
  dependent: {
    className: 'border-2 border-dashed border-amber-400/70 text-amber-300',
    label: 'Needs authorisation',
  },
};

export function StateBadge({ state }: { state: CapabilityState }) {
  const { className, label } = STYLES[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${className}`}
    >
      {state === 'shipped' ? <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> : null}
      {label}
    </span>
  );
}
