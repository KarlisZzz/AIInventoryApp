import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Constitutional color palette (Principle VII)
        slate: {
          900: '#0F172A', // Main app background (deep grey-blue)
          800: '#1E293B', // Backgrounds, sidebars, elevated surfaces
          500: '#64748B', // Secondary text, disabled states
          400: '#94A3B8', // Body text, labels, secondary borders
        },
        blue: {
          500: '#3B82F6', // Primary actions, links, interactive elements
        },
        green: {
          500: '#10B981', // Success states, Available status
        },
        yellow: {
          500: '#F59E0B', // Warning states, Maintenance status
        },
        red: {
          500: '#EF4444', // Error states, Lent status
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
