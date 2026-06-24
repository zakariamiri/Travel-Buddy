import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design palette
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        tertiary: '#D4A843',
        neutral: '#2E2318',
      },
    },
  },
  plugins: [],
};

export default config;
