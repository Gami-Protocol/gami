import type { Metadata } from 'next';

import WaitlistClient from './WaitlistClient';

export const metadata: Metadata = {
  title: 'GAMI Token Launchpad — Power the Future of Gamified Engagement',
  description:
    'Join the GAMI token launch and help build the universal rewards economy. Early waitlist members get exclusive multipliers.',
};

export default function WaitlistPage() {
  return <WaitlistClient />;
}
