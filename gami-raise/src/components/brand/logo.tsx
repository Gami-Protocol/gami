import Image from 'next/image';

import { cn } from '@/lib/utils';

export type GamiBrandVariant = 'landing' | 'raise' | 'token' | 'universal';

const VARIANT_SRC: Record<GamiBrandVariant, string> = {
  landing: '/brand/gami-logo-landing.png',
  raise: '/brand/gami-logo-raise.png',
  token: '/brand/gami-logo-raise.png',
  universal: '/brand/gami-logo-universal.png',
};

export function GamiBrandLogo({
  variant = 'universal',
  className,
  alt = 'Gami',
  priority = false,
}: {
  variant?: GamiBrandVariant;
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={VARIANT_SRC[variant]}
      alt={alt}
      width={160}
      height={160}
      priority={priority}
      className={cn('h-10 w-10 object-contain', className)}
    />
  );
}

/** Universal square mark for nav / footer / chrome. */
export function GamiMark({ className }: { className?: string }) {
  return <GamiBrandLogo variant="universal" className={className} priority />;
}

export function GamiWordmark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <GamiMark className="h-9 w-9 rounded-xl" />
      <div className="leading-none">
        <p className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
          GAMI
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-white/45">Protocol Raise</p>
      </div>
    </div>
  );
}
