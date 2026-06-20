/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F6F3',
        ink: '#111111',
        'ink-2': '#3F3A33',
        'ink-3': '#6B6258',
        border: '#E4DFD5',
        teal: '#2DD4BF',
        'teal-2': '#0EA5B0',
        red: '#D95F5F',
        green: '#5FD98A',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Outfit', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
