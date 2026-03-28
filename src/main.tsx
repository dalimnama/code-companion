import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyThemeMode, getInitialDarkMode } from "./lib/theme";

// Warm up critical API calls before React renders & store promises for cache seeding
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

declare global {
  interface Window {
    __prefetchCache?: Record<string, Promise<any>>;
    __prefetchResolved?: Record<string, any>;
  }
}

// ── Apply dynamic colors before React renders to prevent FOUC ──
const colorMap: Record<string, string[]> = {
  color_primary: ['--primary', '--ring', '--sidebar-primary', '--sidebar-ring', '--success'],
  color_accent: ['--accent', '--warning', '--sidebar-accent'],
  color_sale: ['--sale', '--destructive'],
  color_background: ['--background', '--sidebar-background'],
  color_foreground: ['--foreground', '--card-foreground', '--popover-foreground', '--sidebar-foreground'],
  color_card: ['--card', '--popover'],
};

function adjustForDark(hslValue: string, cssVar: string): string {
  const parts = hslValue.trim().split(/\s+/);
  if (parts.length < 3) return hslValue;
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]);
  const l = parseFloat(parts[2]);
  if (cssVar === '--background' || cssVar === '--sidebar-background') return `${h} ${Math.min(s, 20)}% 7%`;
  if (cssVar === '--card' || cssVar === '--popover') return `${h} ${Math.min(s, 20)}% 10%`;
  if (cssVar === '--foreground' || cssVar === '--card-foreground' || cssVar === '--popover-foreground') return `${h} 0% 95%`;
  if (l < 50) return `${h} ${s}% ${Math.min(l + 6, 55)}%`;
  return hslValue;
}

function applyColorsFromSettings(settings: Record<string, string>) {
  let lightRules = '';
  let darkRules = '';
  for (const [settingKey, cssVars] of Object.entries(colorMap)) {
    const value = settings[settingKey];
    if (value) {
      cssVars.forEach(cssVar => {
        lightRules += `${cssVar}: ${value};\n`;
        darkRules += `${cssVar}: ${adjustForDark(value, cssVar)};\n`;
      });
    }
  }
  if (!lightRules) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'dynamic-theme-colors';
  styleEl.textContent = `:root { ${lightRules} } :root.dark { ${darkRules} }`;
  document.head.appendChild(styleEl);
}

if (supabaseUrl && supabaseKey) {
  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
  const base = `${supabaseUrl}/rest/v1`;

  const fetchJson = (url: string) =>
    fetch(url, { headers }).then(r => r.ok ? r.json() : Promise.reject());

  window.__prefetchResolved = {};

  // Pre-fetch site settings and apply colors BEFORE React renders (prevents FOUC)
  const settingsPromise = fetchJson(`${base}/site_settings?select=*`).then((data: any[]) => {
    if (data && Array.isArray(data)) {
      const map: Record<string, string> = {};
      data.forEach((item: { key: string; value: string }) => { map[item.key] = item.value; });
      applyColorsFromSettings(map);
      window.__prefetchResolved!['site-settings'] = map;
    }
    return data;
  }).catch(() => null);

  const bannersPromise = fetchJson(`${base}/banners?select=*&is_active=eq.true&order=sort_order`)
    .then((data: any) => { window.__prefetchResolved!['banners'] = data; return data; })
    .catch(() => null);

  // Preload the first banner image as soon as data arrives (LCP optimization)
  bannersPromise.then((banners: any[] | null) => {
    if (banners?.[0]?.image) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = banners[0].image;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
    }
  });

  window.__prefetchCache = {
    'site-settings': settingsPromise,
    'banners': bannersPromise,
    'categories': fetchJson(`${base}/categories?select=*&is_active=eq.true&order=sort_order`).catch(() => null),
    'products-featured': fetchJson(`${base}/products?select=*&is_featured=eq.true&is_active=eq.true&order=rating_avg.desc&limit=8`).catch(() => null),
    'products-new': fetchJson(`${base}/products?select=*&is_new=eq.true&is_active=eq.true&order=created_at.desc&limit=8`).catch(() => null),
    'products-flash': fetchJson(`${base}/products?select=*&is_flash_sale=eq.true&is_active=eq.true&order=created_at.desc`).catch(() => null),
  };
}

applyThemeMode(getInitialDarkMode());

const APP_BOOT_TIMEOUT_MS = 1500;
const CHUNK_RELOAD_KEY = 'rk_chunk_reload_once';

function registerChunkLoadRecovery() {
  const reloadOnce = () => {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return;
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    } catch {
      // ignore storage errors
    }

    window.location.reload();
  };

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    reloadOnce();
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason ?? '');
    const isChunkError =
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Importing a module script failed') ||
      message.includes('error loading dynamically imported module');

    if (isChunkError) {
      event.preventDefault();
      reloadOnce();
    }
  });
}

// Wait briefly for settings, but never block app boot indefinitely
const reveal = () => {
  const root = document.getElementById('root');
  if (root) root.style.opacity = '1';
};

let mounted = false;
const mountApp = () => {
  if (mounted) return;
  mounted = true;

  createRoot(document.getElementById("root")!).render(<App />);
  requestAnimationFrame(() => requestAnimationFrame(reveal));

  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    // ignore storage errors
  }
};

registerChunkLoadRecovery();
const settingsReady = window.__prefetchCache?.['site-settings']?.catch(() => null) ?? Promise.resolve();
Promise.race([
  settingsReady,
  new Promise((resolve) => window.setTimeout(resolve, APP_BOOT_TIMEOUT_MS)),
]).finally(mountApp);
