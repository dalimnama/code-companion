import { useEffect } from 'react';
import { useSiteSettings } from './use-site-settings';

const colorMap: Record<string, string[]> = {
  color_primary: ['--primary', '--ring', '--sidebar-primary', '--sidebar-ring', '--success'],
  color_accent: ['--accent', '--warning', '--sidebar-accent'],
  color_sale: ['--sale', '--destructive'],
  color_background: ['--background', '--sidebar-background'],
  color_foreground: ['--foreground', '--card-foreground', '--popover-foreground', '--sidebar-foreground'],
  color_card: ['--card', '--popover'],
};

// Lighten/darken HSL value for dark mode adjustments
function adjustForDark(hslValue: string, cssVar: string): string {
  // Parse HSL: "160 84% 39%" or similar
  const parts = hslValue.trim().split(/\s+/);
  if (parts.length < 3) return hslValue;

  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]);
  const l = parseFloat(parts[2]);

  // Background should be very dark
  if (cssVar === '--background' || cssVar === '--sidebar-background') {
    return `${h} ${Math.min(s, 20)}% 7%`;
  }
  // Card/popover slightly lighter than background
  if (cssVar === '--card' || cssVar === '--popover') {
    return `${h} ${Math.min(s, 20)}% 10%`;
  }
  // Foreground should be very light
  if (cssVar === '--foreground' || cssVar === '--card-foreground' || cssVar === '--popover-foreground') {
    return `${h} 0% 95%`;
  }
  // Primary/accent colors: bump lightness slightly for visibility on dark bg
  if (l < 50) {
    return `${h} ${s}% ${Math.min(l + 6, 55)}%`;
  }
  return hslValue;
}

export function useDynamicColors() {
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (!settings) return;

    // Build CSS rules for both light and dark modes
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

    // Inject a <style> tag so both :root and .dark selectors work properly
    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-theme-colors';
    styleEl.textContent = `
      :root { ${lightRules} }
      :root.dark { ${darkRules} }
    `;

    // Remove old one if exists
    document.getElementById('dynamic-theme-colors')?.remove();
    document.head.appendChild(styleEl);

    return () => {
      document.getElementById('dynamic-theme-colors')?.remove();
    };
  }, [settings]);
}
