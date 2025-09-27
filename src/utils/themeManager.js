import { settings } from "../stores/settingsStore.js";

class ThemeManager {
  constructor() {
    this.currentTheme = "light";
    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    settings.subscribe((settingsValue) => {
      this.applyTheme(settingsValue.theme || "auto");
    });

    this.mediaQuery.addEventListener("change", () => {
      settings.subscribe((settingsValue) => {
        if (settingsValue.theme === "auto") {
          this.applyTheme("auto");
        }
      })();
    });
  }

  applyTheme(theme) {
    const root = document.documentElement;

    let actualTheme = theme;
    if (theme === "auto") {
      actualTheme = this.mediaQuery.matches ? "dark" : "light";
    }

    if (actualTheme === "dark") {
      root.style.setProperty("--bg-color", "#1a1a1a");
      root.style.setProperty("--surface-color", "#2d2d2d");
      root.style.setProperty("--text-color", "#ffffff");
      root.style.setProperty("--border-color", "#404040");
      root.style.setProperty("--hover-color", "#404040");
      root.style.setProperty("--accent-color", "#007acc");
    } else {
      root.style.setProperty("--bg-color", "#ffffff");
      root.style.setProperty("--surface-color", "#f8f9fa");
      root.style.setProperty("--text-color", "#333333");
      root.style.setProperty("--border-color", "#dee2e6");
      root.style.setProperty("--hover-color", "#e9ecef");
      root.style.setProperty("--accent-color", "#007acc");
    }

    this.currentTheme = actualTheme;
    document.body.classList.toggle("dark-theme", actualTheme === "dark");
  }
}

export const themeManager = new ThemeManager();
