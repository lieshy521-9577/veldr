import { computed, ref, watch } from 'vue';

const STORAGE_KEY = 'veldr_theme_settings';

const defaultSettings = {
  mode: 'light',
  accent: 'teal'
};

const settings = ref({ ...defaultSettings });
let isInitialized = false;

const applyTheme = () => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.dataset.theme = settings.value.mode;
  root.dataset.accent = settings.value.accent;
  root.style.colorScheme = settings.value.mode === 'dark' ? 'dark' : 'light';
};

const persistTheme = () => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value));
};

const initTheme = () => {
  if (isInitialized || typeof window === 'undefined') return;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      settings.value = { ...defaultSettings, ...JSON.parse(saved) };
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      settings.value = { ...defaultSettings, mode: 'dark' };
    }
  } catch (error) {
    settings.value = { ...defaultSettings };
  }

  applyTheme();
  isInitialized = true;
};

watch(settings, () => {
  applyTheme();
  persistTheme();
}, { deep: true });

export const useTheme = () => {
  initTheme();

  const mode = computed(() => settings.value.mode);
  const accent = computed(() => settings.value.accent);
  const isDark = computed(() => settings.value.mode === 'dark');

  const setAccent = (value) => {
    settings.value = { ...settings.value, accent: value };
  };

  const toggleMode = () => {
    settings.value = {
      ...settings.value,
      mode: settings.value.mode === 'dark' ? 'light' : 'dark'
    };
  };

  return {
    mode,
    accent,
    isDark,
    setAccent,
    toggleMode
  };
};
