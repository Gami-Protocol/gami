import { cn } from '@/lib/utils';

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-[#6C3BFF]/40 bg-[#6C3BFF]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cbbdff]',
        className,
      )}
      {...props}
    />
  );
}
