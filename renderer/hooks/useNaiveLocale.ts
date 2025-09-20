import { zhCN, enUS, dateZhCN, dateEnUS } from 'naive-ui';
import i18n from '../i18n'

export function useNaiveLocale() {
  const locale = ref(zhCN);
  const dateLocale = ref(dateZhCN);

  watch(() => i18n.global.locale, (lang) => {
    if (lang === 'zh') {
      locale.value = zhCN;
      dateLocale.value = dateZhCN;
    } else {
      locale.value = enUS;
      dateLocale.value = dateEnUS;
    }
  })

  return {
    locale,
    dateLocale
  }
}
