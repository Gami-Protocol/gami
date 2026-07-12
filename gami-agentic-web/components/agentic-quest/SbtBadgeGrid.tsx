'use client';

import { motion } from 'framer-motion';
import {
  Dumbbell,
  Flame,
  Gem,
  GraduationCap,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react';

import { badgeById } from '@/lib/quest-catalog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  dumbbell: Dumbbell,
  'shopping-bag': ShoppingBag,
  flame: Flame,
  gem: Gem,
  'shield-check': ShieldCheck,
  star: Star,
  'graduation-cap': GraduationCap,
};

interface SbtBadgeGridProps {
  unlockedIds: string[];
}

export function SbtBadgeGrid({ unlockedIds }: SbtBadgeGridProps) {
  const badges = unlockedIds
    .map((id) => badgeById(id))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  if (badges.length === 0) {
    return <p className="text-xs text-infinity-ink-mute">No soulbound badges yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, i) => {
        const Icon = ICON_MAP[badge.icon] ?? Sparkles;
        return (
          <motion.div
            key={badge.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Badge
              variant="default"
              className={cn('gap-1.5 py-1 pl-2 pr-2.5')}
            >
              <Icon className="h-3 w-3" />
              {badge.label}
            </Badge>
          </motion.div>
        );
      })}
    </div>
  );
}
