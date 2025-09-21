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
 * 判断两个日期是否在同一日历周
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 是否在同一周
 */
function isSameCalendarWeek(date1: Date, date2: Date): boolean {
  // 获取两个日期所在周的第一天（周一为一周的第一天）
  const getStartOfWeek = (date: Date): Date => {
    const start = new Date(date);
    const day = start.getDay(); // 0 = 周日, 1 = 周一, ..., 6 = 周六
    
    // 如果是周日，减去6天回到上周的周一
    // 否则减去(day - 1)天回到本周的周一
    const diff = start.getDate() - (day === 0 ? 6 : day - 1);
    return new Date(start.setDate(diff));
  };
  
  const startOfWeek1 = getStartOfWeek(date1);
  const startOfWeek2 = getStartOfWeek(date2);
  
  // 比较两个周的起始日期是否相同
  return startOfWeek1.toDateString() === startOfWeek2.toDateString();
}

/**
 * 格式化仅时间部分（HH:MM）
 * @param date 日期对象
 * @returns 格式化后的时间字符串
 */
function formatTimeOnly(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 格式化月日部分
 * @param date 日期对象
 * @param locale 当前语言环境
 * @returns 格式化后的月日字符串
 */
function formatMonthDay(date: Date, locale: string): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (locale === 'en') {
    // 英文格式: MM/DD
    return `${month}/${day}`;
  } else {
    // 中文格式: MM月DD日
    return `${month}月${day}日`;
  }
}

/**
 * 格式化完整日期时间
 * @param date 日期对象
 * @param locale 当前语言环境
 * @returns 格式化后的完整日期时间字符串
 */
function formatFullDateTime(date: Date, locale: string): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  if (locale === 'en') {
    // 英文格式: MM/DD/YYYY HH:MM
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  } else {
    // 中文格式: YYYY年MM月DD日 HH:MM
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  }
}

/**
 * 获取星期几
 * @param date 日期对象
 * @param t i18n翻译函数
 * @returns 星期几的文本
 */
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

/**
 * 核心时间格式化逻辑
 * @param targetDate 目标日期
 * @param nowDate 当前日期
 * @param t i18n翻译函数
 * @param locale 当前语言环境
 * @returns 格式化后的时间字符串
 */
function formatTimeAgoCore(
  targetDate: Date,
  nowDate: Date,
  t: any,
  locale: string
): string {
  const diff = nowDate.getTime() - targetDate.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  // 检查是否是同一天（不考虑具体时间）
  const isSameDay = targetDate.toDateString() === nowDate.toDateString();
  
  // 检查是否是同一周
  const isSameWeek = isSameCalendarWeek(targetDate, nowDate);
  
  // 检查是否是同一年
  const isSameYear = targetDate.getFullYear() === nowDate.getFullYear();

  // 1. 一小时以内
  if (hours < 1) {
    if (minutes < 5) {
      return t('timeAgo.justNow');
    } else {
      return t('timeAgo.minutes', { count: minutes });
    }
  }
  // 2. 一小时到一天内且是同一天
  else if (isSameDay) {
    return formatTimeOnly(targetDate);
  }
  // 3. 一天以上一周以内且是同一周
  else if (!isSameDay && isSameWeek) {
    return `${getWeekDay(targetDate, t)} ${formatTimeOnly(targetDate)}`;
  }
  // 4. 一周以上一年以内且是同一年
  else if (!isSameWeek && isSameYear) {
    return `${formatMonthDay(targetDate, locale)} ${formatTimeOnly(targetDate)}`;
  }
  // 5. 一年以上
  else {
    return formatFullDateTime(targetDate, locale);
  }
}

/**
 * 时间格式化钩子，适配项目国际化
 * 根据时间差显示不同格式的时间
 * @param timestamp 时间戳或Date对象
 * @param options 配置选项
 * @returns 格式化后的时间字符串及相关方法
 */
export function useTimeAgo(timestamp: number | Date, options: TimeAgoOptions = {}) {
  const { t, locale } = useI18n();
  const now = options.now || (() => new Date());
  const updateInterval = options.updateInterval ?? 60000;
  const isRelative = options.relative ?? true;
  const useNow = options.useNow ?? true;

  const nowDate = ref(now());
  const targetDate = ref(timestamp instanceof Date ? timestamp : new Date(timestamp));

  // 根据时间差返回不同格式的时间
  const timeAgo = computed(() => {
    if (!isRelative) {
      return formatFullDateTime(targetDate.value, locale.value);
    }
    
    return formatTimeAgoCore(targetDate.value, nowDate.value, t, locale.value);
  });

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
    return formatTimeAgoCore(targetDate, now.value, t, locale.value);
  };

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
