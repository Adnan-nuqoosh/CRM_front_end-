/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          // Primary (Deep Navy Blue)
          DEFAULT: "#0B3C5D",
          50: "#E6EEF2",
          100: "#CCDDE6",
          200: "#99BBCC",
          300: "#6699B3",
          400: "#337799",
          500: "#0B3C5D", // main
          600: "#09324E",
          700: "#07283E",
          800: "#051E2F",
          900: "#03141F",
        },

        accent: {
          // Gold Accent
          DEFAULT: "#C9A45C",
          50: "#F8F3E7",
          100: "#F1E7CF",
          200: "#E3CF9F",
          300: "#D5B76F",
          400: "#C9A45C", // main
          500: "#B8934A",
          600: "#9A7A3D",
          700: "#7B6030",
          800: "#5C4724",
          900: "#3D2F17",
        },

        neutral: {
          // Backgrounds & text
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2933",
          900: "#111827",
        },
      },
    },
  },
  plugins: [],
};

