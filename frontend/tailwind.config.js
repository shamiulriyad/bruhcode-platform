/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dibi: {
          50: '#F1F8E9',
          100: '#DCEDC8',
          200: '#C5E1A5',
          300: '#AED581',
          400: '#9CCC65',
          500: '#7CB342',
          600: '#558B2F',
          700: '#33691E',
          800: '#1B5E20',
          900: '#1A3A0F',
        },
        accent: '#F9A825',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        xl: '14px',
      },
    },
  },
  plugins: [],
};