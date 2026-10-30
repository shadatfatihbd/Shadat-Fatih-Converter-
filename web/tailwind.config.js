/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          // Light Mode Tokens
          bg: '#F5F5F7',
          surface: '#FFFFFF',
          secondary: '#F2F2F7',
          border: '#D2D2D7',
          text: '#1D1D1F',
          subtext: '#86868B',
          accent: '#0071E3',
          hover: '#0077ED',
          fill: '#E5E5EA',

          // Dark Mode Tokens
          darkBg: '#000000',
          darkSurface: '#1C1C1E',
          darkSecondary: '#2C2C2E',
          darkElevated: '#3A3A3C',
          darkBorder: '#38383A',
          darkText: '#F5F5F7',
          darkSubtext: '#98989D',
          darkAccent: '#0A84FF',
          darkFill: '#2C2C2E',

          // System Accents
          blue: '#0071E3',
          indigo: '#5856D6',
          purple: '#AF52DE',
          pink: '#FF2D55',
          orange: '#FF9500',
          green: '#34C759',
          teal: '#30B0C7',
          gray: '#8E8E93',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          'ui-monospace',
          '"SF Mono"',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ],
        bengali: [
          '"Hind Siliguri"',
          '"Noto Sans Bengali"',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif'
        ]
      },
      borderRadius: {
        'apple': '20px',
        'apple-sm': '12px',
        'apple-lg': '24px',
        'apple-pill': '9999px',
      },
      boxShadow: {
        'apple-sm': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'apple-card': '0 2px 8px rgba(0, 0, 0, 0.04), 0 0 1px rgba(0, 0, 0, 0.06)',
        'apple-card-hover': '0 8px 24px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.1)',
        'apple-window': '0 24px 60px rgba(0, 0, 0, 0.25), 0 0 1px rgba(0, 0, 0, 0.2)',
        'apple-dark-window': '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
      }
    },
  },
  plugins: [],
}
