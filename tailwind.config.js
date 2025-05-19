// tailwind.config.js
const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
      },
      // --- AÑADIR KEYFRAMES Y ANIMACIÓN ---
      keyframes: {
        'pulse-opacity': {
          '0%, 100%': { opacity: '0.15' }, // Opacidad base (puedes ajustarla)
          '50%': { opacity: '1' },    // Opacidad máxima (o la que desees en el pico)
        },
        // Podrías añadir otras animaciones aquí si quieres
      },
      animation: {
        'pulse-opacity-slow': 'pulse-opacity 6s ease-in-out infinite', // Duración de 6s, suave, infinita
        // Puedes crear variantes:
        // 'pulse-opacity-fast': 'pulse-opacity 3s ease-in-out infinite',
      },
      // --- FIN AÑADIR KEYFRAMES Y ANIMACIÓN ---
    },
  },
  plugins: [
    require('@tailwindcss/typography'), 
    // require('tailwind-scrollbar'), // Si los usas, descomenta
    // require('@tailwindcss/line-clamp'),
  ],
};