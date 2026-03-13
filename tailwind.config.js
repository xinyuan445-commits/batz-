/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dashboard-bg': '#0b1121', 
        'card-bg': 'rgba(21, 30, 50, 0.7)', // Made translucent for glassmorphism
        'accent-blue': '#00f0ff',
        'accent-green': '#00ff00',
        'accent-red': '#ff0000',
        'text-dim': '#94a3b8',
      },
      fontFamily: {
        sans: ['Rajdhani', 'Inter', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
      },
      backgroundImage: {
        'tech-pattern': "radial-gradient(circle at 50% 50%, rgba(16, 24, 45, 0) 0%, rgba(0, 0, 0, 0.4) 100%), repeating-linear-gradient(0deg, transparent 0, transparent 1px, rgba(0, 240, 255, 0.03) 1px, rgba(0, 240, 255, 0.03) 2px)",
        'card-gradient': "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
      },
      boxShadow: {
        'glow-blue': '0 0 10px rgba(0, 240, 255, 0.3), 0 0 20px rgba(0, 240, 255, 0.1)',
        'glow-green': '0 0 10px rgba(34, 197, 94, 0.3), 0 0 20px rgba(34, 197, 94, 0.1)',
        'glow-red': '0 0 10px rgba(239, 68, 68, 0.3), 0 0 20px rgba(239, 68, 68, 0.1)',
        'glass': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 4s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
}
