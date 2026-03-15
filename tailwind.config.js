export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        airbnb: {
          red:    '#FF385C',
          dark:   '#E31C5F',
          text:   '#222222',
          muted:  '#717171',
          border: '#DDDDDD',
          bg:     '#F7F7F7',
        },
      },
    },
  },
  plugins: [],
};
