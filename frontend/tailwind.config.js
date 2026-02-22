/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ["Inter", "Geist", "ui-sans-serif", "system-ui"],
    },
    colors: {
      carbon: "#0A0A0A",
      graphite: "#232323",
      tobacco: "#4B3F35",
      sage: "#2D4F3E",
      white: "#FFFFFF",
      transparent: "transparent",
      // Tailwind default colors
      ...require('tailwindcss/colors'),
    },
    extend: {
      borderColor: {
        'white/10': 'rgba(255,255,255,0.10)',
      },
      backdropBlur: {
        md: '12px',
      },
      typography: {
        DEFAULT: {
          css: {
            fontFamily: 'Inter, Geist, ui-sans-serif, system-ui',
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};