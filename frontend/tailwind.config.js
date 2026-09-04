/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#0B0E14',
        'card-dark': '#151E2A',
        'gold': '#F5C34B',
        'neon-green': '#39FF14',
      }
    },
  },
  plugins: [],
}