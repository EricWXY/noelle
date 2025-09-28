import { createI18n, type I18nOptions, type I18n } from 'vue-i18n';
import { logger } from './utils/logger';
import { CONFIG_KEYS } from '@common/constants';

const languages = ['zh', 'en'] as const;
type LanguageType = (typeof languages)[number];

/**
 * 初始化i18n实例
 * @returns 配置好的i18n实例
 */
async function createI18nInstance() {
  // 默认语言配置
  const options: I18nOptions = {
    legacy: false,
    locale: 'zh',
    fallbackLocale: 'zh',
    messages: {
      zh: await import('@locales/zh.json').then(m => m.default),
      en: await import('@locales/en.json').then(m => m.default),
    },
  };
  const result = createI18n(options);
  await handleConfigManager(result);

  return result;
}

async function handleConfigManager(i18n: I18n) {
  try {
    const savedLang: LanguageType = await window.api.getConfig(CONFIG_KEYS.LANGUAGE);
    savedLang && languages.includes(savedLang) && setLanguage(savedLang, i18n);
  } catch (error) {
    logger.warn('Failed to load language config:', error);
  }
}

export const i18n = await createI18nInstance();

export async function setLanguage(lang: LanguageType, _i18n?: I18n) {
  const __i18n = _i18n ?? i18n;

  window.api.setConfig(CONFIG_KEYS.LANGUAGE, lang)
  if (__i18n.mode === 'legacy') {
    __i18n.global.locale = lang;
    return;
  }
  (__i18n.global.locale as unknown as Ref<LanguageType>).value = lang;
}

export function getLanguage() {
  if (i18n.mode === 'legacy') {
    return i18n.global.locale;
  }
  return (i18n.global.locale as unknown as Ref<LanguageType>).value;
}

export default i18n;
