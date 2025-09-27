import { writable } from "svelte/store";

const defaultSettings = {
  theme: "auto", // 'light', 'dark', 'auto'
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
    reminders: true,
  },
  accessibility: {
    fontSize: "medium", // 'small', 'medium', 'large'
    highContrast: false,
    reduceMotion: false,
  },
  privacy: {
    analytics: true,
    crashReports: true,
  },
  general: {
    language: "en",
    autoSave: true,
    confirmDelete: true,
  },
};

function createSettingsStore() {
  const stored = localStorage.getItem("aethermind-settings");
  const initial = stored
    ? { ...defaultSettings, ...JSON.parse(stored) }
    : defaultSettings;

  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    updateSetting: (category, key, value) =>
      update((settings) => {
        const newSettings = {
          ...settings,
          [category]: {
            ...settings[category],
            [key]: value,
          },
        };
        localStorage.setItem(
          "aethermind-settings",
          JSON.stringify(newSettings)
        );
        return newSettings;
      }),
    reset: () => {
      localStorage.removeItem("aethermind-settings");
      set(defaultSettings);
    },
  };
}

export const settings = createSettingsStore();
