/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f4efe6',
        foreground: '#1b1b18',
        muted: '#f8f4eb',
        border: '#d8d0c4',
        card: '#fffdf8',
        accent: '#1f6f5f',
        accentForeground: '#f7f3ec',
        ink: '#22313f',
        warning: '#cb7c2c',
        danger: '#b74f3b',
      },
      fontFamily: {
        sans: ['"Fraunces Variable"', '"Segoe UI Variable"', 'serif'],
        body: ['"Inter Variable"', '"Segoe UI Variable"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 24px 60px rgba(40, 31, 17, 0.12)',
      },
    },
  },
  plugins: [],
}

