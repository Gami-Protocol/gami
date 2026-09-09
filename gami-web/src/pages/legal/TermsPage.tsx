export function TermsPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Terms of Use</h1>
      <div className="prose prose-invert mt-6 space-y-4 text-muted">
        <p>
          These terms govern your use of gamiprotocol.io and the Gami Protocol developer
          tools, wallet, and documentation. By using the site you agree to them.
        </p>
        <p>
          <strong>No offer.</strong> Nothing on this site is an offer to sell, or a
          solicitation of an offer to buy, any security, token, or other financial
          instrument. Gami Protocol is not conducting a public sale and is not accepting
          contributions. The developer waitlist is a product waitlist: joining it confers
          no entitlement, allocation, or right of any kind.
        </p>
        <p>
          <strong>XP.</strong> XP is a non-transferable record of progression within the
          protocol. It cannot be bought, sold, transferred, or redeemed, it is not a
          financial instrument, and it carries no monetary value.
        </p>
        <p>
          <strong>Rewards and settlement.</strong> Where an app operator funds a reward,
          settlement uses third-party stablecoins on Base. Gami Protocol does not issue a
          stablecoin, does not hold client money, and is not a payment institution or an
          electronic money institution.
        </p>
        <p>
          <strong>Availability.</strong> Features described on this site are at differing
          stages of development. Anything marked as roadmap is not available and may change
          or not ship at all. Nothing here is a commitment to deliver on a timeline.
        </p>
        <p>
          <strong>No advice.</strong> Nothing on this site is financial, legal, or tax advice.
        </p>
        <p>
          Questions about these terms:{' '}
          <a href="mailto:hello@gamiprotocol.io" className="text-white underline">
            hello@gamiprotocol.io
          </a>
          .
        </p>
        <p className="text-sm">
          This document is a working draft pending review by counsel. Last updated 9 September 2026.
        </p>
      </div>
    </>
  );
}
