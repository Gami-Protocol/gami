export function GamiLogo({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-white ${className}`} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm6 14.1L12 19.7l-6-3.6V7.9l6-3.6 6 3.6v8.2zM12 7l-4 2.4v5.2l4 2.4 4-2.4V9.4L12 7z" />
    </svg>
  );
}
