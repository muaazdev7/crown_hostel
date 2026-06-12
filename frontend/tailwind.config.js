/** @type {import('tailwindcss').Config} */

// Role-based theming:
//   `primary` and `accent` resolve to CSS variables (space-separated RGB
//   channels) so the whole UI can be re-themed per role via a wrapper class
//   without touching components. Defaults live in index.css (:root) and are
//   overridden inside `.theme-staff` (teal) and `.theme-student` (indigo).
const themed = (name) =>
  Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => [
      shade,
      `rgb(var(--${name}-${shade}) / <alpha-value>)`,
    ])
  );

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: themed('primary'),
        accent: themed('accent'),
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
