/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#DB4444',
          dark: '#A33232',
          light: '#FFDADA',
        },
        secondary: {
          DEFAULT: '#00FF66',
        },
        dark: '#1D2128',
        gray: {
          light: '#F5F5F5',
          medium: '#7D8184',
          dark: '#3D4148',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
        },
      },
    },
  },
  plugins: [],
}
