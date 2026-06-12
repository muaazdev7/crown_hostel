// Centralized role-based theme configuration.
//
// The actual UI coloring is driven by CSS variables (see index.css) that are
// switched via the `themeClass` wrapper applied on each role's layout root.
// This module is the single source of truth for the role → color mapping and
// exposes a small helper for any component that needs the raw hex value.

export const ROLE_THEMES = {
  staff:   { color: '#0D9488', name: 'teal',   themeClass: 'theme-staff' },
  student: { color: '#4F46E5', name: 'indigo', themeClass: 'theme-student' },
};

// Admin keeps the default palette (indigo primary + teal accent).
const DEFAULT_THEME = { color: '#4F46E5', name: 'default', themeClass: '' };

export const getTheme = (role) => ROLE_THEMES[role] || DEFAULT_THEME;

// e.g. getThemeColor('staff') === '#0D9488'
export const getThemeColor = (role) => getTheme(role).color;

// e.g. getThemeClass('student') === 'theme-student'
export const getThemeClass = (role) => getTheme(role).themeClass;

export default ROLE_THEMES;
