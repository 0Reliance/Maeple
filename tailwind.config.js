/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Primary Colors (Warm, Trustworthy, Calming)
        primary: {
          DEFAULT: '#2D4A5A',  // Deep slate-blue
          light: '#4A6B7D',
          dark: '#1E3240',
        },
        
        // Accent Colors (Purposeful, Not Decorative)
        accent: {
          positive: '#3B8B7E',  // Sage green - growth, balance
          attention: '#E8A538',  // Warm amber - energy, insight
          alert: '#D4756A',      // Muted rose - gentle warning
          action: '#5B8A9C',     // Soft teal-blue - action
        },
        
        // Neutral Scale (Warm Gray, Not Cold)
        bg: {
          primary: '#F8F6F3',      // Warm off-white
          secondary: '#EDEAE6',
          card: '#FFFFFF',
        },
        
        text: {
          primary: '#2D3436',
          secondary: '#636E72',
          tertiary: '#B2BEC3',
        },
        
        // Dark Mode Colors
        dark: {
          bg: {
            primary: '#1A1E23',
            secondary: '#242930',
            card: '#2D3436',
          },
          text: {
            primary: '#F8F6F3',
            secondary: '#B2BEC3',
          },
        },
        
        // Legacy slate colors (will phase out)
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      spacing: {
        // 8pt Grid System
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      fontSize: {
        // Display Type Scale
        'hero': ['48px', { lineHeight: '1.1', fontWeight: '700' }],
        'h1': ['36px', { lineHeight: '1.2', fontWeight: '600' }],
        'h2': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['22px', { lineHeight: '1.4', fontWeight: '500' }],
        'h4': ['18px', { lineHeight: '1.5', fontWeight: '500' }],
        
        // Body Type Scale
        'large': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'base': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'small': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
        
        // Label Type Scale (use sparingly)
        'label': ['12px', { lineHeight: '1.3', fontWeight: '600' }],
        'micro': ['11px', { lineHeight: '1.3', fontWeight: '600' }],
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.08)',
        'glow': '0 0 0 3px rgba(91, 138, 156, 0.1)',
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out forwards',
        'slideUp': 'slideUp 0.4s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
