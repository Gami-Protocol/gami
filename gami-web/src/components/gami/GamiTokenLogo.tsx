import { GamiBrandLogo } from '@/components/gami/GamiBrandLogo';

/** Circular token / raise mark for sale and token surfaces. */
export function GamiTokenLogo({
  className = 'w-10 h-10',
  size,
}: {
  className?: string;
  size?: number;
}) {
  if (size) {
    return (
      <GamiBrandLogo
        variant="token"
        className={className}
      />
    );
  }

  return <GamiBrandLogo variant="token" className={className} />;
}
