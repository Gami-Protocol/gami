import Image from 'next/image';

import { cn } from '@/lib/utils';

export function GamiMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/mark.svg"
      alt="Gami"
      width={40}
      height={40}
      className={cn('h-10 w-10', className)}
      priority
    />
  );
}

export function GamiWordmark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <GamiMark className="h-9 w-9" />
      <div className="leading-none">
        <p className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
          GAMI
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-white/45">Protocol Raise</p>
      </div>
    </div>
  );
}
