/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A1F44',
        accent: '#3B82F6',
        textMain: '#111827',
        textSec: '#6B7280',
        bgMain: '#FFFFFF',
        bgSec: '#F5F6F8',
        borderLight: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        moodle: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
