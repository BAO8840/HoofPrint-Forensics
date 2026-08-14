/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#2b3a67",
          dark: "#1f2a4d",
          light: "#4a5a8c",
        },
        gold: {
          DEFAULT: "#b08d3f",
          light: "#e6d3a3",
        },
        parchment: {
          DEFAULT: "#f7f5ef",
          border: "#ddd6c5",
          notice: "#fbf3e3",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
