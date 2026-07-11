export default function RiskPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Risk Factors Disclosure</h1>
      <div className="prose prose-invert mt-6 space-y-4 text-muted">
        <ul className="list-disc space-y-2 pl-5">
          <li>Smart contract risk including bugs, exploits, and irreversible transactions</li>
          <li>Regulatory risk — token classification may change by jurisdiction</li>
          <li>Market risk — no assurance of secondary market liquidity or price appreciation</li>
          <li>Technology risk — dependency on Base network, RPC providers, and wallet software</li>
          <li>Vesting risk — tokens may remain locked until cliff and schedule conditions are met</li>
          <li>Operational risk — KYC delays or geo-restrictions may prevent participation or claims</li>
        </ul>
        <p>
          Do not contribute funds you cannot afford to lose. Read the whitepaper and consult
          independent advisors before participating.
        </p>
      </div>
    </>
  );
}
