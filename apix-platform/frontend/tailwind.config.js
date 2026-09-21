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
          blue: "#E8EEF7",
          lavender: "#EDE7F6",
          peach: "#FCE4D6",
          text: "#26364A",
          secondary: "#526174",
          surface: "#FFFFFF",
          bg: "#F8FAFD",
          accent: "#2563EB",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
