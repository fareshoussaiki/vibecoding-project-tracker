/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#025a9e',
          accent: '#003b6f',
        },
        surface: {
          page: '#f4f6f8',
          card: '#ffffff',
        },
        text: {
          primary: '#121212',
          muted: '#4a5568',
        },
        type: {
          feature: '#e6fcf5',
          'feature-border': '#0ca678',
          bug: '#fff5f5',
          'bug-border': '#e03131',
        },
        due: {
          safe: '#1864ab',
          warning: '#f59f00',
          overdue: '#e03131',
          neutral: '#595959',
        },
      },
    },
  },
  plugins: [],
};