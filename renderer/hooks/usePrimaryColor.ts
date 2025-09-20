import { setPrimaryColor, getPrimaryColor } from '@renderer/utils/theme';
import { useConfig } from './useConfig';
import { debounce } from '@common/utils';
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
    const savedColor = await getPrimaryColor();
    if (!savedColor) return;
    setPrimaryColor(savedColor.DEFAULT);
    primaryColor.value = savedColor.DEFAULT;
    primaryColors.value = savedColor;
  }
  const onCange = debounce(() => update(), 300);

  watch(() => config[CONFIG_KEYS.PRIMARY_COLOR],
    (color) => (color !== primaryColor.value) && onCange()
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
