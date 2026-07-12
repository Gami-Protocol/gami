const TOKEN_PURPLE = '#6324A5';

export function GamiTokenLogo({
  className = 'w-10 h-10',
  size,
}: {
  className?: string;
  size?: number;
}) {
  const sizeProps = size ? { width: size, height: size } : {};

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={true}
      {...sizeProps}
    >
      <circle cx="50" cy="50" r="50" fill={TOKEN_PURPLE} />
      <path
        d="M50 6 L86 26 L86 74 L50 94 L14 74 L14 26 Z"
        stroke="white"
        strokeWidth={9}
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M66 36 C61 31 56 30 50 30 C39 30 31 38 31 50 C31 62 39 70 50 70 C60 70 67 63 67 54 L67 50 L50 50"
        stroke="white"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
