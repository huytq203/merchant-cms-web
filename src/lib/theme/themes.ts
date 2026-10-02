// ─── Token Interfaces ─────────────────────────────────────────────────────────

export interface ThemeColors {
  // Surface
  background: string;
  foreground: string;
  // Brand
  primary: string;
  primaryForeground: string;
  // Secondary surface
  secondary: string;
  secondaryForeground: string;
  // Muted surface
  muted: string;
  mutedForeground: string;
  // Accent / hover surface
  accent: string;
  accentForeground: string;
  // Semantic states
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  danger: string;
  dangerForeground: string;
  // Form / input
  border: string;
  input: string;
  ring: string;
  // Popover / overlay
  popover: string;
  popoverForeground: string;
}

export interface Theme {
  name: string;
  label: string;
  colors: ThemeColors;
}

export type BuiltInThemeName = 'flexpay';

// ─── Built-in Themes ──────────────────────────────────────────────────────────

export const themes: Theme[] = [
  // ─── Flexpay Design System v2 (duy nhất) ──────────────────────────────────────
  {
    name: 'flexpay',
    label: 'Flexpay',
    colors: {
      background: '#ffffff',              // Surface — card, input, nội dung
      foreground: '#1c2120',              // Ink
      primary: '#008175',                 // Brand deep (đủ tương phản với chữ trắng)
      primaryForeground: '#ffffff',
      secondary: '#d9f0ee',               // Brand field
      secondaryForeground: '#005045',     // Brand ink
      muted: '#eaf6f4',                   // Brand tint
      mutedForeground: '#5f5f5f',         // Secondary text
      accent: '#eaf6f4',
      accentForeground: '#005045',
      success: '#1f9a5b',
      successForeground: '#ffffff',
      warning: '#8a6a00',
      warningForeground: '#ffffff',
      danger: '#dd1327',
      dangerForeground: '#ffffff',
      border: '#cee0e1',
      input: '#cee0e1',
      ring: '#02ccbb',                    // Brand
      popover: '#ffffff',
      popoverForeground: '#1c2120',
    },
  },
];

// ─── Apply Theme ──────────────────────────────────────────────────────────────

const THEME_STYLE_ID = 'basuicn-theme';

/**
 * Applies a theme by injecting a <style> tag at the START of <head>.
 *
 * Why <style> tag instead of element.style.setProperty():
 *   Inline styles have the highest CSS specificity and would override
 *   .dark { } class rules, breaking dark mode. A <style> tag injected
 *   before the app's CSS bundle has lower specificity than .dark { }
 *   rules defined later in the bundle — so dark mode always wins.
 */
export function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  if (!theme?.colors) return;
  const { colors: c } = theme;

  const css = `
:root:not(.dark) {
  --background: ${c.background};
  --foreground: ${c.foreground};
  --primary: ${c.primary};
  --primary-foreground: ${c.primaryForeground};
  --secondary: ${c.secondary};
  --secondary-foreground: ${c.secondaryForeground};
  --muted: ${c.muted};
  --muted-foreground: ${c.mutedForeground};
  --accent: ${c.accent};
  --accent-foreground: ${c.accentForeground};
  --success: ${c.success};
  --success-foreground: ${c.successForeground};
  --warning: ${c.warning};
  --warning-foreground: ${c.warningForeground};
  --danger: ${c.danger};
  --danger-foreground: ${c.dangerForeground};
  --destructive: ${c.danger};
  --destructive-foreground: ${c.dangerForeground};
  --border: ${c.border};
  --input: ${c.input};
  --ring: ${c.ring};
  --popover: ${c.popover};
  --popover-foreground: ${c.popoverForeground};
}`.trim();

  let styleEl = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = THEME_STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
}

// ─── CSS Variable Generator ───────────────────────────────────────────────────

/**
 * Converts a Theme's colors into a CSS `:root { }` block string.
 * Used by scripts to generate or sync CSS.
 */
export function toCssVars(theme: Theme): string {
  const { colors: c } = theme;
  const vars: [string, string][] = [
    ['--background', c.background],
    ['--foreground', c.foreground],
    ['--primary', c.primary],
    ['--primary-foreground', c.primaryForeground],
    ['--secondary', c.secondary],
    ['--secondary-foreground', c.secondaryForeground],
    ['--muted', c.muted],
    ['--muted-foreground', c.mutedForeground],
    ['--accent', c.accent],
    ['--accent-foreground', c.accentForeground],
    ['--success', c.success],
    ['--success-foreground', c.successForeground],
    ['--warning', c.warning],
    ['--warning-foreground', c.warningForeground],
    ['--danger', c.danger],
    ['--danger-foreground', c.dangerForeground],
    ['--destructive', c.danger],
    ['--destructive-foreground', c.dangerForeground],
    ['--border', c.border],
    ['--input', c.input],
    ['--ring', c.ring],
    ['--popover', c.popover],
    ['--popover-foreground', c.popoverForeground],
  ];
  const body = vars.map(([k, v]) => `        ${k}: ${v};`).join('\n');
  return `:root {\n${body}\n    }`;
}

// ─── Custom Theme Factory ─────────────────────────────────────────────────────

/**
 * Creates a custom theme by merging overrides with the default (Flexpay) theme.
 *
 * @example
 * const myTheme = createTheme('brand', 'My Brand', { primary: '#ff6b35' });
 */
export function createTheme(
  name: string,
  label: string,
  colors: Partial<ThemeColors>
): Theme {
  const base = themes[0]!; // Flexpay as default base
  return {
    name,
    label,
    colors: { ...base.colors, ...colors },
  };
}
