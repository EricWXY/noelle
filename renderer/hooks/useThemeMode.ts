import { useConfig } from './useConfig';
import { CONFIG_KEYS } from '@common/constants';

const iconMap = new Map([
  ['system', 'material-symbols:auto-awesome-outline'],
  ['light', 'material-symbols:light-mode-outline'],
  ['dark', 'material-symbols:dark-mode-outline'],
])

const tooltipMap = new Map([
  ['system', 'settings.theme.system'],
  ['light', 'settings.theme.light'],
  ['dark', 'settings.theme.dark'],
])

export function useThemeMode() {
  const themeMode = ref<ThemeMode>('system');
  const isDark = ref<boolean>(false);
  const { t } = useI18n();

  const themeTooltip = computed(() => t(tooltipMap.get(themeMode.value) || 'settings.theme.system'));
  const themeIcon = computed(() => iconMap.get(themeMode.value) || 'material-symbols:auto-awesome-outline');
  const themeChangeCallbacks: Array<(mode: ThemeMode) => void> = [];
  const config = useConfig();

  function setThemeMode(mode: ThemeMode) {
    themeMode.value = mode;
    window.api.setThemeMode(mode);
  }

  function getThemeMode() {
    return themeMode.value;
  }

  function onThemeChange(callback: (mode: ThemeMode) => void) {
    themeChangeCallbacks.push(callback);
  }

  watch(() => config[CONFIG_KEYS.THEME_MODE], (mode) =>
    (themeMode.value !== mode) && setThemeMode(mode)
  )

  onMounted(async () => {
    window.api.isDarkTheme().then(res => {
      isDark.value = res;
    })
    window.api.onSystemThemeChange((_isDark) => window.api.getThemeMode().then(res => {
      isDark.value = _isDark;
      if (themeMode.value !== res) themeMode.value = res;
      themeChangeCallbacks.forEach(callback => callback(res));
    }));
    themeMode.value = await window.api.getThemeMode();
  });

  return {
    themeTooltip,
    themeIcon,
    isDark,
    setThemeMode,
    getThemeMode,
    onThemeChange,
  }
}

export default useThemeMode;
