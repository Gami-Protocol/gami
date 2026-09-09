import { FormEvent, useMemo, useState, type ReactNode } from 'react';
import { useSignMessage } from 'wagmi';

import { useGeoBlock } from '@/hooks/useGeoBlock';
import { useSaleAccount } from '@/hooks/useSaleAccount';
import {
  buildKycSignMessage,
  externalKycUrl,
  submitKycApplication,
  type KycDocumentType,
  type KycStatus,
} from '@/lib/kyc';

const COUNTRY_OPTIONS = [
  'AE', 'AR', 'AU', 'BR', 'CA', 'CH', 'DE', 'ES', 'FR', 'GB', 'HK', 'ID', 'IE', 'IN', 'IT', 'JP',
  'KR', 'MX', 'NG', 'NL', 'NZ', 'PH', 'PL', 'PT', 'SA', 'SE', 'SG', 'TH', 'TR', 'UA', 'VN', 'ZA',
];

const inputClass =
  'mt-1 w-full border-2 border-white/10 bg-surface p-3 font-mono text-sm outline-none focus:border-primary';

type Props = {
  initialEmail?: string;
  onVerified: (status: KycStatus) => void;
  onPending?: (status: KycStatus) => void;
};

export function KycVerificationPanel({ initialEmail = '', onVerified, onPending }: Props) {
  const { address, isConnected } = useSaleAccount();
  const { blocked, country, loading: geoLoading } = useGeoBlock();
  const { signMessageAsync, isPending: signing } = useSignMessage();

  const [email, setEmail] = useState(initialEmail);
  const [fullLegalName, setFullLegalName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [residenceCountry, setResidenceCountry] = useState('');
  const [documentType, setDocumentType] = useState<KycDocumentType>('passport');
  const [documentNumber, setDocumentNumber] = useState('');
  const [attestedNotRestricted, setAttestedNotRestricted] = useState(false);
  const [attestedTerms, setAttestedTerms] = useState(false);
  const [attestedAccuracy, setAttestedAccuracy] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const hostedUrl = useMemo(
    () => (address ? externalKycUrl(address) : null),
    [address],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isConnected || !address) {
      setStatus('error');
      setMessage('Connect your wallet before starting identity verification.');
      return;
    }
    if (blocked) {
      setStatus('error');
      setMessage(`Sale / KYC unavailable from ${country ?? 'your region'}.`);
      return;
    }

    setStatus('loading');
    setMessage('Sign the verification message in your wallet…');

    try {
      const signedMessage = buildKycSignMessage(address, email);
      const walletSignature = await signMessageAsync({ message: signedMessage });

      setMessage('Submitting identity application…');
      const result = await submitKycApplication({
        wallet_address: address,
        email,
        full_legal_name: fullLegalName,
        date_of_birth: dateOfBirth,
        nationality,
        residence_country: residenceCountry,
        document_type: documentType,
        document_number: documentNumber,
        ip_country: country,
        wallet_signature: walletSignature,
        signed_message: signedMessage,
        attested_not_restricted: attestedNotRestricted,
        attested_terms: attestedTerms,
        attested_accuracy: attestedAccuracy,
      });

      if (!result.ok) {
        setStatus('error');
        setMessage(result.error);
        return;
      }

      setStatus('done');
      if (result.kyc_status === 'approved') {
        setMessage('Identity verified. You can continue to eligibility.');
        onVerified(result.kyc_status);
      } else {
        setMessage('Application submitted for review. Check eligibility after approval.');
        onPending?.(result.kyc_status);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Verification failed');
    }
  }

  function openHostedProvider() {
    if (!address || !hostedUrl) return;
    window.open(hostedUrl, '_blank', 'noopener,noreferrer');
    setStatus('idle');
    setMessage('Complete verification with the hosted provider, then check eligibility.');
    onPending?.('pending');
  }

  if (geoLoading) {
    return <p className="text-sm text-muted">Checking region eligibility…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="border border-white/10 bg-black/40 p-4 text-sm text-muted">
        <p className="font-mono text-xs font-bold text-primary">IDENTITY VERIFICATION</p>
        <p className="mt-2">
          Complete KYC to unlock contributions. We collect identity details, require a wallet signature,
          and sync approval to your sale participant record.
        </p>
      </div>

      {hostedUrl ? (
        <button
          type="button"
          onClick={openHostedProvider}
          className="w-full border-2 border-white/20 py-3 font-display text-sm font-bold uppercase tracking-widest hover:border-primary hover:text-primary"
        >
          Open hosted KYC provider
        </button>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Legal full name">
          <input
            required
            value={fullLegalName}
            onChange={(e) => setFullLegalName(e.target.value)}
            className={inputClass}
            placeholder="Name as shown on government ID"
            autoComplete="name"
          />
        </Field>

        <Field label="Email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@email.com"
            autoComplete="email"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date of birth">
            <input
              required
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className={inputClass}
              max={new Date().toISOString().slice(0, 10)}
            />
          </Field>
          <Field label="Document type">
            <select
              required
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as KycDocumentType)}
              className={inputClass}
            >
              <option value="passport">Passport</option>
              <option value="national_id">National ID</option>
              <option value="drivers_license">Driver&apos;s license</option>
            </select>
          </Field>
        </div>

        <Field label="Document number">
          <input
            required
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            className={inputClass}
            placeholder="Stored as hash + last 4 only"
            autoComplete="off"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nationality">
            <CountrySelect value={nationality} onChange={setNationality} detected={country} />
          </Field>
          <Field label="Country of residence">
            <CountrySelect value={residenceCountry} onChange={setResidenceCountry} detected={country} />
          </Field>
        </div>

        <label className="flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            checked={attestedNotRestricted}
            onChange={(e) => setAttestedNotRestricted(e.target.checked)}
            className="mt-1"
            required
          />
          <span>
            I am not a resident of a restricted jurisdiction (including US / OFAC-sanctioned regions)
            and I am eligible to participate.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            checked={attestedTerms}
            onChange={(e) => setAttestedTerms(e.target.checked)}
            className="mt-1"
            required
          />
          <span>I agree to the sale Terms, Risk disclosure, and Privacy Policy.</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            checked={attestedAccuracy}
            onChange={(e) => setAttestedAccuracy(e.target.checked)}
            className="mt-1"
            required
          />
          <span>I confirm the information is accurate and submitted by the wallet owner.</span>
        </label>

        <button
          type="submit"
          disabled={status === 'loading' || signing || !isConnected || Boolean(blocked)}
          className="sticker-shadow w-full bg-primary py-4 font-display font-bold uppercase disabled:opacity-50"
        >
          {!isConnected
            ? 'Connect wallet to verify'
            : blocked
              ? 'Unavailable in your region'
              : status === 'loading' || signing
                ? 'Verifying…'
                : 'Sign & submit identity verification'}
        </button>
      </form>

      {message ? (
        <p className={`font-mono text-sm ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="font-mono text-xs text-muted">{label.toUpperCase()}</label>
      {children}
    </div>
  );
}

function CountrySelect({
  value,
  onChange,
  detected,
}: {
  value: string;
  onChange: (value: string) => void;
  detected: string | null;
}) {
  const options = useMemo(() => {
    const set = new Set(COUNTRY_OPTIONS);
    if (detected) set.add(detected.toUpperCase());
    if (value) set.add(value.toUpperCase());
    return [...set].sort();
  }, [detected, value]);

  return (
    <select
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    >
      <option value="">Select country</option>
      {options.map((code) => (
        <option key={code} value={code}>
          {code}
        </option>
      ))}
    </select>
  );
}
