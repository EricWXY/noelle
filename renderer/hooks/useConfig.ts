import type { Reactive } from 'vue';
import type { IConfig } from '@common/types';
import { CONFIG_KEYS } from '@common/constants';
import { debounce } from '@common/utils';

import { setLanguage, getLanguage } from '@renderer/i18n';

export function useConfig() {
  const config: Reactive<IConfig> = reactive({
    [CONFIG_KEYS.THEME_MODE]: 'system',
    [CONFIG_KEYS.PRIMARY_COLOR]: '#BB5BE7',
    [CONFIG_KEYS.LANGUAGE]: 'zh',
    [CONFIG_KEYS.FONT_SIZE]: 14,
    [CONFIG_KEYS.MINIMIZE_TO_TRAY]: false,
    [CONFIG_KEYS.PROVIDER]: '',
    [CONFIG_KEYS.DEFAULT_MODEL]: '',
  });

  const configKeys = [
    CONFIG_KEYS.THEME_MODE,
    CONFIG_KEYS.PRIMARY_COLOR,
    CONFIG_KEYS.LANGUAGE,
    CONFIG_KEYS.FONT_SIZE,
    CONFIG_KEYS.MINIMIZE_TO_TRAY,
    CONFIG_KEYS.PROVIDER,
    CONFIG_KEYS.DEFAULT_MODEL
  ];

  const setReactiveConf = (key: CONFIG_KEYS, value: IConfig[typeof key]) => config[key] = value as never;

  configKeys.forEach(key =>
    window.api.getConfig(key).then(val => setReactiveConf(key, val))
  );

  window.api.onConfigChange((_config: IConfig) => {
    configKeys.forEach(key => {
      if (key === CONFIG_KEYS.LANGUAGE) {
        const lang = getLanguage();
        (lang !== config[key]) && setLanguage(config[key]);
      }
      if (_config[key] === config[key]) return;
      setReactiveConf(key, _config[key]);
    })
  });

  const onReactiveChange = debounce(() => {
    configKeys.forEach(async (key) => {
      if (config[key] === await window.api.getConfig(key)) return;
      window.api.setConfig(key, config[key]);
    });
  }, 200);

  watch(() => config, () => onReactiveChange(), { deep: true });

  onUnmounted(() => window.api.removeConfigChangeListener(onReactiveChange));

  return config;
}

export default useConfig;
