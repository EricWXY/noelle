import { setPrimaryColor } from '@renderer/utils/theme';
import { useConfig } from './useConfig';
import { CONFIG_KEYS } from '@common/constants';

interface PrimaryColors {
  DEFAULT: string;
  light: string;
  dark: string;
  hover: string;
  active: string;
  subtle: string;
}
export function usePrimaryColor() {
  const primaryColor = ref<string | void>();
  const primaryColors = ref<PrimaryColors | null>(null);
  const first = ref(true);
  const config = useConfig();

  const update = () => {
    const _setPrimaryColor = (color: string) => {
      const colors = setPrimaryColor(color);
      primaryColor.value = colors.DEFAULT;
      primaryColors.value = colors;
      return colors;
    }
    if (first.value) {
      first.value = false;
      _setPrimaryColor(config[CONFIG_KEYS.PRIMARY_COLOR]);
      return;
    }
    const stop = window.api.onConfigChange((config) => {
      if (config[CONFIG_KEYS.PRIMARY_COLOR] !== primaryColor.value) {
        _setPrimaryColor(config[CONFIG_KEYS.PRIMARY_COLOR]);
        stop?.();
      }
    });
  }

  watch(
    () => config[CONFIG_KEYS.PRIMARY_COLOR],
    (color) => (color !== primaryColor.value) && update()
  );
  update();

  return {
    setPrimaryColor: (color: string) => {
      if (color === primaryColor.value) return;
      config[CONFIG_KEYS.PRIMARY_COLOR] = color;
    },
    primaryColors,
  }
}

export default usePrimaryColor;
