/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6E3CFB',
        secondary: '#FF3D8B',
        background: '#0E0E12',
        surface: '#16161E',
        muted: '#6B6880',
        gami: {
          purple: '#6E3CFB',
          dark: '#4B24B8',
          accent: '#9C6CFF',
          bg: '#0E0E12',
        },
        nova: {
          glow: '#9C6CFF',
          xp: '#2FE6A6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        brutal: '8px 8px 0px 0px #000000',
        'brutal-purple': '8px 8px 0px 0px #6E3CFB',
        glow: '0 0 20px rgba(156, 108, 255, 0.5)',
      },
      keyframes: {
        'xp-pop': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.9)' },
          '20%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '80%': { opacity: '1', transform: 'translateY(-6px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-18px) scale(0.95)' },
        },
      },
      animation: {
        'xp-pop': 'xp-pop 1.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};
