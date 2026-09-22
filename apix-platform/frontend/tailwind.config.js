/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apix: {
          bg: "#FAFAFA",
          surface: "#FFFFFF",
          surfaceHover: "#F4F4F5",
          card: "#FFFFFF",
          cardBorder: "#E4E4E7",
          border: "#E4E4E7",
          borderDark: "#18181B",
          text: "#09090B",
          primary: "#000000",
          secondary: "#52525B",
          muted: "#71717A",
          accent: "#000000",
          lightGray: "#F4F4F5",
        },
      },
      animation: {
        'fadeIn': 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulseSlow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar': 'radarSweep 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
