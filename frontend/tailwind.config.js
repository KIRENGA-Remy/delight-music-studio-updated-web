/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold:   { 400:'#F5C842', 500:'#E8B800', 600:'#C9A000' },
        purple: { 400:'#A855F7', 500:'#9333EA', 600:'#7C3AED', 700:'#6D28D9', 800:'#5B21B6', 900:'#2E1065' },
        dark:   { 50:'#F8F7FF', 100:'#EDE9FE', 800:'#1E1036', 900:'#130A24', 950:'#0A0514' },
      },
      fontFamily: {
        display: ["'Inter'", 'system-ui', 'sans-serif'],
        body:    ["'DM Sans'", 'system-ui', 'sans-serif'],
        sans:    ["'Inter'", 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'music-gradient':  'linear-gradient(135deg, #130A24 0%, #2E1065 50%, #1E1036 100%)',
        'gold-gradient':   'linear-gradient(135deg, #F5C842, #E8B800)',
        'purple-gradient': 'linear-gradient(135deg, #9333EA, #6D28D9)',
      },
      boxShadow: {
        gold:   '0 0 20px rgba(245,200,66,0.3)',
        purple: '0 0 20px rgba(147,51,234,0.4)',
        glow:   '0 0 40px rgba(147,51,234,0.3)',
      },
    },
  },
  plugins: [],
};
