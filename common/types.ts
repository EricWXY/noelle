import { IPC_EVENTS, WINDOW_NAMES, CONFIG_KEYS } from './constants';

export type IpcEvents = `${IPC_EVENTS}`;
export type WindowNames = `${WINDOW_NAMES}`;
export type ConfigKeys = `${CONFIG_KEYS}`;

export interface IConfig {
  // 主题模式配置
  [CONFIG_KEYS.THEME_MODE]: ThemeMode;
  // 高亮色
  [CONFIG_KEYS.PRIMARY_COLOR]: string;
  // 语言
  [CONFIG_KEYS.LANGUAGE]: 'zh' | 'en';
  // 字体大小
  [CONFIG_KEYS.FONT_SIZE]: number;
  // 关闭时最小化到托盘
  [CONFIG_KEYS.MINIMIZE_TO_TRAY]: boolean;
  // provider 配置 JSON
  [CONFIG_KEYS.PROVIDER]?: string;
}

interface OpenAiProviderConfig {
  baseUrl?: string;
  apiKey?: string;
}

interface QianfanProviderConfig {
  accessKey?: string;
  secretKey?: string;
}

export interface IProviderConfig {
  dahscope?: OpenAiProviderConfig;
  deepseek?: OpenAiProviderConfig;
  qianfan?: QianfanProviderConfig;
  [key: string]: any;
}
