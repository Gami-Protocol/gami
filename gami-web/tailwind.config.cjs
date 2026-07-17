/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
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
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        brutal: '8px 8px 0px 0px #000000',
        'brutal-purple': '8px 8px 0px 0px #6E3CFB',
        'brutal-white': '8px 8px 0px 0px #FFFFFF',
        glow: '0 0 20px rgba(110, 60, 251, 0.4)',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
      },
    },
  },
  plugins: [],
};
