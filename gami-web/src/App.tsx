import { Route, Routes } from 'react-router-dom';

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

export default function App() {
  return (
    <Providers>
      <div className="hexagon-bg min-h-screen font-sans text-white selection:bg-gami-accent selection:text-white">
        <GamiNav />
        <main>
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
    </Providers>
  );
}
