/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'ibm-blue': '#0f62fe',
        'ibm-cyan': '#1192e8',
      },
    },
  },
  plugins: [],
}