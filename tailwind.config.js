// tailwind.config.js
const path = require('path');

module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  plugins: [],
  
  // Combine all custom definitions into a single 'theme' object
  theme: {
    extend: {
      // 1. COLORS
      colors: {
        'stellar-dark': '#1A1324',        // Deep violet-black
        'stellar-accent': '#B000FF',      // Vibrant violet
        'stellar-glow': '#FF6B00',        // Bright orange accent
        'stellar-light': '#E2E2E2',       // Text light
        'stellar-dim': '#A0A0A0',         // Dim text
        'stellar-bg-glass': 'rgba(26,19,36,0.6)', // translucentbg
      },
      
      // 2. BOX SHADOWS
      boxShadow: { 
        'stellar-orange': '0 4px 20px rgba(255,107,0,0.15)',
        'stellar-violet': '0 0 15px rgba(176,0,255,0.25)',
      },
      
      // 3. KEYFRAMES
      keyframes: {
        'pop-in': {
          '0%': { 
            opacity: '0', 
            transform: 'scale(0.5)' // Start at 50% size and invisible
          },
          '100%': { 
            opacity: '1', 
            transform: 'scale(1)' // End at 100% size and fully visible
          },
        }
      },
      
      // 4. ANIMATION UTILITIES
      animation: {
        // Changed duration to 1.0s as per your second declaration
        'pop-in': 'pop-in 0.2s ease-out forwards', 
      },
    },
  },
};