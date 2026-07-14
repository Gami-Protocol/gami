export const GAMI_BRAND = {
  purple: '#702FE5',
  purpleDeep: '#4B1AA8',
  landing: '/brand/gami-logo-landing.png',
  raise: '/brand/gami-logo-raise.png',
  universal: '/brand/gami-logo-universal.png',
  token: '/brand/gami-logo-raise.png',
} as const;

export type GamiBrandVariant = 'landing' | 'raise' | 'token' | 'universal';

const VARIANT_SRC: Record<GamiBrandVariant, string> = {
  landing: GAMI_BRAND.landing,
  raise: GAMI_BRAND.raise,
  token: GAMI_BRAND.token,
  universal: GAMI_BRAND.universal,
};

type GamiBrandLogoProps = {
  variant?: GamiBrandVariant;
  className?: string;
  alt?: string;
  decorative?: boolean;
};

export function GamiBrandLogo({
  variant = 'universal',
  className = 'h-10 w-10',
  alt = 'Gami',
  decorative = true,
}: GamiBrandLogoProps) {
  return (
    <img
      src={VARIANT_SRC[variant]}
      alt={decorative ? '' : alt}
      aria-hidden={decorative || undefined}
      draggable={false}
      className={`object-contain ${className}`}
    />
  );
}
