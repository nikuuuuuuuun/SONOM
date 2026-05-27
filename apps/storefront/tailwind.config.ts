import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        sonom: {
          primary: '#8B4513',
          secondary: '#D2691E',
          accent: '#FFD700',
          bg: '#FFF8F0',
          text: '#2C1810',
          muted: '#6B4C3B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [require('tailwindcss-radix')()],
}

export default config
