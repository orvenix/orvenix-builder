import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        blue: { 500:'#3b82f6', 600:'#2563eb', 700:'#1d4ed8' },
        red: { 400:'#f87171', 500:'#ef4444', 600:'#dc2626' },
        yellow: { 400:'#facc15', 500:'#eab308' },
        green: { 500:'#22c55e', 600:'#16a34a' },
        purple: { 500:'#a855f7', 600:'#9333ea' },
        brand: { 50:'#eff6ff', 100:'#dbeafe', 500:'#3b82f6', 600:'#2563eb', 700:'#1d4ed8' },
        dark: '#0f172a',
      },
      fontFamily: {
        fun: ['"Nunito"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
