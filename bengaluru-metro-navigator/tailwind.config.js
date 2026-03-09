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
        'metro-purple': {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#e879f9',
          400: '#c026d3',
          500: '#8B008B',
          600: '#7B0080',
          700: '#6B0070',
          800: '#5B0060',
          900: '#4B0050',
          DEFAULT: '#8B008B'
        },
        'metro-green': {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#00A86B',
          600: '#00965F',
          700: '#008453',
          800: '#007247',
          900: '#00603B',
          DEFAULT: '#00A86B'
        },
        'metro-yellow': {
          DEFAULT: '#FFD700',
          500: '#FFD700',
          600: '#E6C200'
        },
        'metro-pink': {
          DEFAULT: '#FF69B4',
          500: '#FF69B4',
          600: '#E659A0'
        },
        'metro-blue': {
          DEFAULT: '#1E90FF',
          500: '#1E90FF',
          600: '#1A7FE6'
        },
        'accent-orange': {
          DEFAULT: '#FF6B35',
          500: '#FF6B35',
          600: '#E65F2F',
          hover: '#E65F2F'
        }
      },
      fontFamily: {
        'heading': ['Poppins', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['Roboto Mono', 'monospace']
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'train-move': 'trainMove 3s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 0.5s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        },
        trainMove: {
          '0%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(10px)' },
          '100%': { transform: 'translateX(0)' }
        },
        bounceGentle: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' }
        }
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'dropdown': '0 4px 16px rgba(0, 0, 0, 0.15)'
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px'
      }
    },
  },
  plugins: [],
}
