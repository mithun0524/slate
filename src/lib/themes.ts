// Theme presets — each overrides a subset of the CSS custom properties defined
// in styles.css (:root holds the Dark Modern defaults). applyTheme writes the
// overrides onto the document root and persists the choice.

export type ThemeId = "dark-modern" | "dark-plus" | "midnight" | "light";

export interface Theme {
  id: ThemeId;
  label: string;
  vars: Record<string, string>;
}

export const THEMES: Theme[] = [
  {
    id: "dark-modern",
    label: "Dark Modern",
    vars: {
      "--bg": "#1a1a1a",
      "--bg-1": "#1e1e1e",
      "--bg-2": "#181818",
      "--bg-3": "#262626",
      "--bg-hover": "#2a2a2a",
      "--border": "#2b2b2b",
      "--border-soft": "#242424",
      "--fg": "#cccccc",
      "--fg-mut": "#9d9d9d",
      "--fg-dim": "#6e6e6e",
      "--accent": "#e2b23c",
      "--accent-soft": "rgba(226,178,60,0.13)",
      "--term-bg": "#1e1e1e",
    },
  },
  {
    id: "dark-plus",
    label: "Dark+",
    vars: {
      "--bg": "#252526",
      "--bg-1": "#1e1e1e",
      "--bg-2": "#252526",
      "--bg-3": "#2d2d2d",
      "--bg-hover": "#2a2d2e",
      "--border": "#333333",
      "--border-soft": "#2a2a2a",
      "--fg": "#d4d4d4",
      "--fg-mut": "#9d9d9d",
      "--fg-dim": "#6a6a6a",
      "--accent": "#4fc1ff",
      "--accent-soft": "rgba(79,193,255,0.14)",
      "--term-bg": "#1e1e1e",
    },
  },
  {
    id: "midnight",
    label: "Midnight Blue",
    vars: {
      "--bg": "#0a0c12",
      "--bg-1": "#0d1017",
      "--bg-2": "#11151d",
      "--bg-3": "#161b25",
      "--bg-hover": "#1a2130",
      "--border": "#1e2530",
      "--border-soft": "#171d27",
      "--fg": "#d6dde6",
      "--fg-mut": "#8a94a3",
      "--fg-dim": "#5c6675",
      "--accent": "#e2b23c",
      "--accent-soft": "rgba(226,178,60,0.14)",
      "--term-bg": "#0b0e14",
    },
  },
  {
    id: "light",
    label: "Light",
    vars: {
      "--bg": "#f3f3f3",
      "--bg-1": "#ffffff",
      "--bg-2": "#f8f8f8",
      "--bg-3": "#ececec",
      "--bg-hover": "#e8e8e8",
      "--border": "#d4d4d4",
      "--border-soft": "#e4e4e4",
      "--fg": "#1f1f1f",
      "--fg-mut": "#616161",
      "--fg-dim": "#8a8a8a",
      "--accent": "#b8860b",
      "--accent-soft": "rgba(184,134,11,0.12)",
      "--term-bg": "#ffffff",
    },
  },
];

const KEY = "vellum.theme";

export function applyTheme(id: ThemeId) {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0];
  const root = document.documentElement;
  for (const [k, v] of Object.entries(t.vars)) root.style.setProperty(k, v);
  root.dataset.theme = t.id;
  localStorage.setItem(KEY, t.id);
}

export function loadTheme(): ThemeId {
  const saved = localStorage.getItem(KEY) as ThemeId | null;
  return saved && THEMES.some((t) => t.id === saved) ? saved : "dark-modern";
}
