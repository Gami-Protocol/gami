export function PrivacyPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Privacy Policy</h1>
      <div className="prose prose-invert mt-6 space-y-4 text-muted">
        <p>
          Gami Protocol collects the email address you give us when you join the developer
          waitlist, and — if you choose to link one — a wallet address. We use them to
          contact you about developer access and to operate your account.
        </p>
        <p>
          We do not collect identity verification documents. Waitlist and account data is
          stored in Supabase. Wallet infrastructure is provided by Privy, which holds the
          authentication material for wallets created through the site.
        </p>
        <p>
          We use cookies for session management and analytics. You can ask us to delete your
          marketing data at any time by contacting support. Onchain transactions are public
          and permanent and cannot be deleted.
        </p>
        <p>
          Requests and questions:{' '}
          <a href="mailto:hello@gamiprotocol.io" className="text-white underline">
            hello@gamiprotocol.io
          </a>
          .
        </p>
        <p className="text-sm">
          This policy is drafted to align with UK GDPR and CCPA requirements and is a working
          draft pending review by counsel. Last updated 9 September 2026.
        </p>
      </div>
    </>
  );
}
