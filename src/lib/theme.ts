const THEME_STORAGE_KEY = 'theme';

function safeReadStoredTheme(): 'dark' | 'light' | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Storage access can fail in some private browser modes
  }
  return null;
}

export function getInitialDarkMode(): boolean {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return true;
  }

  const savedTheme = safeReadStoredTheme();
  if (savedTheme) return savedTheme === 'dark';

  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

export function applyThemeMode(isDark: boolean) {
  if (typeof document === 'undefined') return;

  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage write errors on restricted browsers
    }
  }
}

export const themeStorageKey = THEME_STORAGE_KEY;