/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FBFBFA',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F7F6F3',
          dark: '#111111',
        },
        charcoal: {
          DEFAULT: '#111111',
          soft: '#2F3437',
          muted: '#787774',
        },
        borderSubtle: '#EAEAEA',
        pastel: {
          green: '#EDF3EC',
          'green-text': '#346538',
          'green-border': '#D4E7D2',
          red: '#FDEBEC',
          'red-text': '#9F2F2D',
          'red-border': '#FAD1D3',
          blue: '#E1F3FE',
          'blue-text': '#1F6C9F',
          'blue-border': '#CCE7F8',
          yellow: '#FBF3DB',
          'yellow-text': '#956400',
          'yellow-border': '#F2E2B8',
        },
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Switzer', 'Helvetica Neue', 'sans-serif'],
        serif: ['Newsreader', 'Playfair Display', 'Instrument Serif', 'Georgia', 'serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'SF Mono', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(0, 0, 0, 0.02)',
        'lift': '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.02em',
      }
    },
  },
  plugins: [],
}
