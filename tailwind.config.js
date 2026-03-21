/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{tsx,ts,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          dark: '#1e1e2e',
          secondary: '#f5f5f5',
          'secondary-dark': '#2a2a3c',
          hover: '#ebebeb',
          'hover-dark': '#35354a'
        },
        border: {
          DEFAULT: '#e0e0e0',
          dark: '#3a3a4c'
        },
        'text-primary': {
          DEFAULT: '#1a1a2e',
          dark: '#e0e0e0'
        },
        'text-secondary': {
          DEFAULT: '#6b7280',
          dark: '#9ca3af'
        },
        accent: {
          DEFAULT: '#3b82f6',
          dark: '#60a5fa'
        },
        danger: {
          DEFAULT: '#ef4444',
          dark: '#f87171'
        },
        warning: {
          DEFAULT: '#f59e0b',
          dark: '#fbbf24'
        },
        success: {
          DEFAULT: '#10b981',
          dark: '#34d399'
        },
        'prio-hoch': '#ef4444',
        'prio-mittel': '#f59e0b',
        'prio-normal': '#6b7280'
      },
      width: {
        sidebar: '240px',
        detail: '380px'
      },
      minWidth: {
        app: '960px'
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translate(-50%, 100%)', opacity: '0' },
          '100%': { transform: 'translate(-50%, 0)', opacity: '1' }
        }
      },
      animation: {
        'slide-up': 'slide-up 0.2s ease-out'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
