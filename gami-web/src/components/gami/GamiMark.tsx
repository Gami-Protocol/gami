/** Crisp hex-G mark matching the Gami brand geometry. */
export function GamiMark({
  className = 'h-12 w-12',
  title = 'Gami',
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gamiMarkGrad" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5B2FE0" />
          <stop offset="0.55" stopColor="#7B4EE4" />
          <stop offset="1" stopColor="#9B7CFF" />
        </linearGradient>
        <linearGradient id="gamiMarkSheen" x1="12" y1="10" x2="48" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Outer hex G stroke */}
      <path
        d="M32 6 L52.5 17.5 V40.5 L32 52 L11.5 40.5 V23.5 L20 18.5 V36.5 L32 43.5 L44.5 36.5 V21.5 L32 14.5 L23 19.5"
        stroke="url(#gamiMarkGrad)"
        strokeWidth="7.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner G bar */}
      <path
        d="M33 32 H47.5"
        stroke="url(#gamiMarkGrad)"
        strokeWidth="7.2"
        strokeLinecap="round"
      />
      {/* Light edge sheen */}
      <path
        d="M32 10.5 L48.5 19.5 V28"
        stroke="url(#gamiMarkSheen)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

export function GamiWordmark({
  className = '',
  foundation = false,
}: {
  className?: string;
  foundation?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <GamiMark className="h-10 w-10 md:h-12 md:w-12" />
      <div className="leading-none">
        <p className="font-display text-2xl font-semibold tracking-[0.14em] text-[#5B2FE0] md:text-3xl">
          GAMI
        </p>
        {foundation ? (
          <p className="mt-1 font-display text-[10px] font-medium uppercase tracking-[0.34em] text-[#6B6685]">
            Foundation
          </p>
        ) : null}
      </div>
    </div>
  );
}
