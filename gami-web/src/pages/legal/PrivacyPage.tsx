export function PrivacyPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Privacy Policy</h1>
      <div className="prose prose-invert mt-6 space-y-4 text-muted">
        <p>
          Gami Protocol collects email addresses, wallet addresses, and KYC verification data to operate the token sale
          and comply with anti-money-laundering obligations. Data is stored in Supabase and processed by our identity
          verification provider.
        </p>
        <p>
          We use cookies for session management and analytics on gami-web. You may request deletion of marketing data by
          contacting support. On-chain transactions are public and cannot be deleted.
        </p>
        <p>This policy is designed to align with GDPR and CCPA requirements. Legal review required.</p>
      </div>
    </>
  );
}
