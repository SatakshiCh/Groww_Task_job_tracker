/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#09090b',
          900: '#111113',
          850: '#161618',
          800: '#1c1c1f',
          700: '#27272a',
          600: '#3a3a40',
        },
        brand: {
          300: '#b4b9f8',
          400: '#8f97f0',
          500: '#5e6ad2',
          600: '#4f59c0',
        },
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 1px 2px rgba(0,0,0,0.4)',
        lift: '0 12px 28px -6px rgba(0,0,0,0.6), 0 4px 10px rgba(0,0,0,0.35)',
      },
      keyframes: {
        'slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': { from: { opacity: '0', transform: 'translateY(6px) scale(.98)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        'slide-in': 'slide-in 220ms cubic-bezier(.2,.8,.2,1)',
        'fade-in': 'fade-in 150ms ease-out',
        'pop-in': 'pop-in 160ms ease-out',
      },
    },
  },
  plugins: [],
}
