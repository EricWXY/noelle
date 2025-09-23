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
  const config = useConfig();

  const update = async () => {
    const stop = window.api.onConfigChange((config) => {
      if (config[CONFIG_KEYS.PRIMARY_COLOR] !== primaryColor.value) {
        const colors = setPrimaryColor(config[CONFIG_KEYS.PRIMARY_COLOR]);
        primaryColor.value = colors.DEFAULT;
        primaryColors.value = colors;
        stop?.();
      }
    });
  }

  watch(() => config[CONFIG_KEYS.PRIMARY_COLOR],
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
