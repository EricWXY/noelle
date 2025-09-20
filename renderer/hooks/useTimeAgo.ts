import { ref, computed, watch, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

interface TimeAgoOptions {
  /** 间隔更新时间（毫秒），默认60000ms (1分钟) */
  updateInterval?: number;
  /** 是否显示相对时间，默认true */
  relative?: boolean;
  /** 是否使用现在时间作为基准，默认true */
  useNow?: boolean;
  /** 自定义现在时间（用于测试） */
  now?: () => Date;
}

/**
 * 时间格式化钩子，适配项目国际化
 * 根据时间差显示不同格式的时间
 * @param timestamp 时间戳或Date对象
 * @param options 配置选项
 * @returns 格式化后的时间字符串
 */
export function useTimeAgo(timestamp: number | Date, options: TimeAgoOptions = {}) {
  const { t, locale } = useI18n();
  const now = options.now || (() => new Date());
  const updateInterval = options.updateInterval ?? 60000;
  const isRelative = options.relative ?? true;
  const useNow = options.useNow ?? true;

  const nowDate = ref(now());
  const targetDate = ref(timestamp instanceof Date ? timestamp : new Date(timestamp));

  // 计算时间差
  const diffInMs = computed(() => {
    if (!useNow) return 0;
    return nowDate.value.getTime() - targetDate.value.getTime();
  });

  // 根据时间差返回不同格式的时间
  const timeAgo = computed(() => {
    if (!isRelative) {
      return formatFullDateTime(targetDate.value);
    }

    const diff = diffInMs.value;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const years = Math.floor(days / 365);

    // 1. 一小时以内
    if (hours < 1) {
      if (minutes < 5) {
        return t('timeAgo.justNow');
      } else {
        return t('timeAgo.minutes', { count: minutes });
      }
    }
    // 2. 一小时到一天内
    else if (days < 1) {
      return formatTimeOnly(targetDate.value);
    }
    // 3. 一天以上一周以内
    else if (weeks < 1) {
      return `${getWeekDay(targetDate.value, t)} ${formatTimeOnly(targetDate.value)}`;
    }
    // 4. 一周以上一年以内
    else if (years < 1) {
      return `${formatMonthDay(targetDate.value)} ${formatTimeOnly(targetDate.value)}`;
    }
    // 5. 一年以上
    else {
      return formatFullDateTime(targetDate.value);
    }
  });

  // 格式化仅时间部分（HH:MM）
  function formatTimeOnly(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // 格式化月日部分
  function formatMonthDay(date: Date): string {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if (locale.value === 'en') {
      // 英文格式: MM/DD
      return `${month}/${day}`;
    } else {
      // 中文格式: MM月DD日
      return `${month}月${day}日`;
    }
  }

  // 格式化完整日期时间
  function formatFullDateTime(date: Date): string {
    // const locale = getCurrentLocale();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    if (locale.value === 'en') {
      // 英文格式: MM/DD/YYYY HH:MM
      return `${month}/${day}/${year} ${hours}:${minutes}`;
    } else {
      // 中文格式: YYYY年MM月DD日 HH:MM
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    }
  }

  // 获取星期几
  function getWeekDay(date: Date, t: any): string {
    const weekDays = [
      t('timeAgo.weekday.sun'),
      t('timeAgo.weekday.mon'),
      t('timeAgo.weekday.tue'),
      t('timeAgo.weekday.wed'),
      t('timeAgo.weekday.thu'),
      t('timeAgo.weekday.fri'),
      t('timeAgo.weekday.sat')
    ];
    return weekDays[date.getDay()];
  }

  // 定期更新时间
  let timer: number | null = null;

  const updateNow = () => {
    nowDate.value = now();
  };

  // 设置定时器
  const setupTimer = () => {
    if (useNow && isRelative && !timer) {
      updateNow();
      timer = window.setInterval(updateNow, updateInterval);
    }
  };

  // 清理定时器
  const clearTimer = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  // 监听配置变化
  watch(() => [useNow, isRelative], () => {
    clearTimer();
    setupTimer();
  }, { immediate: true });

  // 组件卸载时清理定时器
  onUnmounted(() => {
    clearTimer();
  });

  return {
    timeAgo,
    updateNow,
    clearTimer
  };
}

/**
 * 批量时间格式化工具函数
 * 用于在列表中高效格式化多个时间戳，按照用户要求的逻辑进行显示
 * @returns 包含格式化函数的对象
 */
export function useBatchTimeAgo() {
  const { t, locale } = useI18n();
  const now = ref(new Date());
  const timer = ref<number | null>(null);
  const updateInterval = 60000; // 每分钟更新一次

  // 定期更新当前时间
  const setupTimer = () => {
    if (!timer.value) {
      timer.value = window.setInterval(() => {
        now.value = new Date();
      }, updateInterval);
    }
  };

  // 清理定时器
  const clearTimer = () => {
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }
  };

  // 格式化单个时间戳
  const formatTimeAgo = (timestamp: number | Date): string => {
    const targetDate = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const diff = now.value.getTime() - targetDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const years = Math.floor(days / 365);

    // 1. 一小时以内
    if (hours < 1) {
      if (minutes < 5) {
        return t('timeAgo.justNow');
      } else {
        return t('timeAgo.minutes', { count: minutes });
      }
    }
    // 2. 一小时到一天内
    else if (days < 1) {
      return formatTimeOnly(targetDate);
    }
    // 3. 一天以上一周以内
    else if (weeks < 1) {
      return `${getWeekDay(targetDate)} ${formatTimeOnly(targetDate)}`;
    }
    // 4. 一周以上一年以内
    else if (years < 1) {
      return `${formatMonthDay(targetDate)} ${formatTimeOnly(targetDate)}`;
    }
    // 5. 一年以上
    else {
      return formatFullDateTime(targetDate);
    }
  };

  // 格式化仅时间部分（HH:MM）
  function formatTimeOnly(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // 格式化月日部分
  function formatMonthDay(date: Date): string {
    // const locale = getCurrentLocale();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if (locale.value === 'en') {
      // 英文格式: MM/DD
      return `${month}/${day}`;
    } else {
      // 中文格式: MM月DD日
      return `${month}月${day}日`;
    }
  }

  // 格式化完整日期时间
  function formatFullDateTime(date: Date): string {
    // const locale = getCurrentLocale();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (locale.value === 'en') {
      // 英文格式: MM/DD/YYYY HH:MM
      return `${month}/${day}/${year} ${hours}:${minutes}`;
    } else {
      // 中文格式: YYYY年MM月DD日 HH:MM
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    }
  }

  // 获取星期几
  function getWeekDay(date: Date): string {
    const weekDays = [
      t('timeAgo.weekday.sun'),
      t('timeAgo.weekday.mon'),
      t('timeAgo.weekday.tue'),
      t('timeAgo.weekday.wed'),
      t('timeAgo.weekday.thu'),
      t('timeAgo.weekday.fri'),
      t('timeAgo.weekday.sat')
    ];
    return weekDays[date.getDay()];
  }

  // 启动定时器
  setupTimer();

  // 组件卸载时清理
  onUnmounted(() => {
    clearTimer();
  });

  return {
    formatTimeAgo,
    clearTimer
  };
}
