/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B0E14',
          900: '#12172B',
          800: '#1B2140',
          700: '#293159',
          300: '#9CA5C9',
          200: '#C3C9E0',
          100: '#E4E6F1',
        },
        paper: {
          50: '#FAFAF8',
          100: '#F3F2EE',
          200: '#E6E4DC',
        },
        signal: {
          teal: '#0F766E',
          tealLight: '#CCFBF1',
          amber: '#B45309',
          amberLight: '#FEF3C7',
          rose: '#BE123C',
          roseLight: '#FFE4E6',
          violet: '#5B21B6',
          violetLight: '#EDE9FE',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
