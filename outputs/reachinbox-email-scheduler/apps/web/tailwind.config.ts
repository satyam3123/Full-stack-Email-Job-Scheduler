import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        panel: '0 1px 2px rgba(16,24,40,.05), 0 10px 24px rgba(16,24,40,.06)'
      },
      colors: {
        ink: '#17212b',
        mint: '#e8f9f1',
        brand: '#147d56'
      }
    }
  },
  plugins: []
} satisfies Config;
