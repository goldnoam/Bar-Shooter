
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        rye: ['Rye', 'cursive'],
        varela: ['Varela Round', 'sans-serif'],
      },
      // Fix: Added missing keyframes for game visual effects.
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translate(-5px, -5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translate(5px, 5px)' },
        },
        explosion: {
          '0%': { transform: 'translate(-50%, -50%) scale(0.1)', opacity: '1' },
          '100%': { transform: 'translate(-50%, -50%) scale(1.5)', opacity: '0' },
        },
        shockwave: {
          '0%': { transform: 'translate(-50%, -50%) scale(0.1)', opacity: '0.8' },
          '100%': { transform: 'translate(-50%, -50%) scale(2)', opacity: '0' },
        },
        smoke: {
          '0%': { transform: 'translate(-50%, -50%) scale(0.5) translateY(0)', opacity: '0.6' },
          '100%': { transform: 'translate(-50%, -50%) scale(1.5) translateY(-50px)', opacity: '0' },
        },
        fire: {
          '0%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '0.8' },
          '50%': { transform: 'translate(-50%, -60%) scale(1.2)', opacity: '0.4' },
          '100%': { transform: 'translate(-50%, -70%) scale(1)', opacity: '0' },
        },
        'float-up': {
          '0%': { transform: 'translate(-50%, 0)', opacity: '1' },
          '100%': { transform: 'translate(-50%, -50px)', opacity: '0' },
        },
        flash: {
          '0%': { opacity: '0.8' },
          '100%': { opacity: '0' },
        },
      },
      // Fix: Mapped animations to keyframes.
      animation: {
        shake: 'shake 0.5s ease-in-out',
        explosion: 'explosion 0.8s ease-out forwards',
        shockwave: 'shockwave 1s ease-out forwards',
        smoke: 'smoke 2s ease-out forwards',
        fire: 'fire 1.5s ease-out forwards',
        'float-up': 'float-up 1s ease-out forwards',
        flash: 'flash 0.1s ease-out forwards',
      },
    },
  },
  plugins: [],
}
