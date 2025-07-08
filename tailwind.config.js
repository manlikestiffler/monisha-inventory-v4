/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        dark: {
          primary: '#000000',
          secondary: '#2a2a2a',
          accent: '#3a3a3a',
          text: '#f0f0f0',
          'text-secondary': '#a0a0a0',
        },
        danger: {
          light: '#f8d7da',
          DEFAULT: '#dc3545',
          dark: '#721c24',
        },
      },
    },
  },
  plugins: [],
};