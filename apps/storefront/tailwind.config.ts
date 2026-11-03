import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        sonom: {
          primary: '#1F3B34',
          secondary: '#2F5D50',
          accent: '#C9A227',
          bg: '#F7F5F0',
          surface: '#FFFFFF',
          text: '#1A1A1A',
          muted: '#5A5A5A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 30px rgba(31, 59, 52, 0.08)',
        card: '0 4px 16px rgba(31, 59, 52, 0.06)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [require('tailwindcss-radix')()],
}

export default config