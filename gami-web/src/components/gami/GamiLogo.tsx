import { GamiBrandLogo } from '@/components/gami/GamiBrandLogo';

/** Primary mark for landing / marketing hero surfaces. */
export function GamiLogo({ className = 'w-6 h-6' }: { className?: string }) {
  return <GamiBrandLogo variant="landing" className={className} />;
}
