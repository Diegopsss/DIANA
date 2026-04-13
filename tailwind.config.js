/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'diana-bg': '#F5F5DC',
        'diana-orange': '#FF8C42',
        'diana-cream': '#FFF8DC',
        'diana-earth': '#8B7355',
        'diana-soft': '#FDF6E3',
        'diana-warm': '#DEB887',
        'diana-text': '#5D4E37',
        'diana-text-light': '#8B7355',
        'diana-border': '#D2B48C',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'diana-soft': '0 4px 6px -1px rgba(139, 115, 85, 0.1), 0 2px 4px -1px rgba(139, 115, 85, 0.06)',
        'diana-medium': '0 10px 15px -3px rgba(139, 115, 85, 0.1), 0 4px 6px -2px rgba(139, 115, 85, 0.05)',
        'diana-large': '0 20px 25px -5px rgba(139, 115, 85, 0.1), 0 10px 10px -5px rgba(139, 115, 85, 0.04)',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
