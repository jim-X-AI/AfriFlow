/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#0f172a",
        panel: "#1e293b",
        border: "#334155",
        brand: {
          500: "#3b82f6",
          600: "#2563eb",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
};