import { Route, Routes, useLocation } from 'react-router-dom';

import { CookieConsent } from '@/components/CookieConsent';
import { GamiNav } from '@/components/gami/GamiNav';
import { Providers } from '@/components/Providers';
import { ClaimPage } from '@/pages/ClaimPage';
import { ContributePage } from '@/pages/ContributePage';
import { HomePage } from '@/pages/HomePage';
import { LegalLayout } from '@/pages/legal/LegalLayout';
import { PrivacyPage } from '@/pages/legal/PrivacyPage';
import { RiskPage } from '@/pages/legal/RiskPage';
import { TermsPage } from '@/pages/legal/TermsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SalePage } from '@/pages/SalePage';
import { TokenomicsPage } from '@/pages/TokenomicsPage';
import { WaitlistPage } from '@/pages/WaitlistPage';
import { WalletPage } from '@/pages/WalletPage';
import { WhitepaperPage } from '@/pages/WhitepaperPage';

function AppShell() {
  const { pathname } = useLocation();
  const isSaleRoute = pathname === '/sale' || pathname.startsWith('/sale/');

  return (
    <div
      className={
        isSaleRoute
          ? 'min-h-screen w-full max-w-[100vw] overflow-x-hidden font-sans'
          : 'hexagon-bg min-h-screen font-sans text-white selection:bg-gami-accent selection:text-white'
      }
    >
      {!isSaleRoute && <GamiNav />}
      <main className={isSaleRoute ? 'w-full max-w-[100vw] overflow-x-hidden' : undefined}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/waitlist" element={<WaitlistPage />} />
          <Route path="/sale" element={<SalePage />} />
          <Route path="/sale/contribute" element={<ContributePage />} />
          <Route path="/claim" element={<ClaimPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/tokenomics" element={<TokenomicsPage />} />
          <Route path="/whitepaper" element={<WhitepaperPage />} />
          <Route path="/legal" element={<LegalLayout />}>
            <Route path="terms" element={<TermsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="risk" element={<RiskPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <CookieConsent />
    </div>
  );
}

export default function App() {
  return (
    <Providers>
      <AppShell />
    </Providers>
  );
}
