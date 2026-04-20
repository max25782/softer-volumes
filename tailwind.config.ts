import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand tokens
        ink:      '#0a0906',
        paper:    '#f4efe5',
        warm:     '#faf7f0',
        gold: {
          DEFAULT: '#b8965a',
          light:   '#d4af75',
          dim:     '#b8965a33',
        },
        charcoal: '#1e1b16',
        mist:     '#9e9488',
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans:    ['var(--font-josefin)', 'system-ui', 'sans-serif'],
        korean:  ['var(--font-noto-kr)', 'serif'],
      },
      fontSize: {
        'display-xl': ['clamp(64px,9vw,130px)', { lineHeight: '0.92', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(44px,5.5vw,80px)', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        'display-md': ['clamp(32px,4vw,56px)',   { lineHeight: '1.1'  }],
        'eyebrow':    ['9px',  { lineHeight: '1', letterSpacing: '0.45em' }],
        'caption':    ['10px', { lineHeight: '1.8', letterSpacing: '0.08em' }],
      },
      spacing: {
        'section': '120px',
        'section-sm': '80px',
      },
      animation: {
        'fade-up':  'fadeUp 0.9s cubic-bezier(0.23,1,0.32,1) forwards',
        'marquee':  'marquee 25s linear infinite',
        'zoom-in':  'zoomIn 8s ease forwards',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(32px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        zoomIn: {
          from: { transform: 'scale(1.08)' },
          to:   { transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

export default config
