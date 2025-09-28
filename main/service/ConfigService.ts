import type { ConfigKeys, IConfig } from '@common/types';
import { app, BrowserWindow, ipcMain } from 'electron';
import { CONFIG_KEYS, IPC_EVENTS } from '@common/constants';
import { debounce, simpleCloneDeep } from '@common/utils';
import * as fs from 'fs';
import * as path from 'path';
import logManager from './LogService';


const DEFAULT_CONFIG: IConfig = {
  [CONFIG_KEYS.THEME_MODE]: 'system',
  [CONFIG_KEYS.PRIMARY_COLOR]: '#BB5BE7',
  [CONFIG_KEYS.LANGUAGE]: 'zh',
  [CONFIG_KEYS.FONT_SIZE]: 14,
  [CONFIG_KEYS.MINIMIZE_TO_TRAY]: false,
  [CONFIG_KEYS.PROVIDER]: '',
  [CONFIG_KEYS.DEFAULT_MODEL]: null,
}

/**
 * 配置服务类，用于管理应用配置的加载、保存和修改
 * 采用单例模式确保全局只有一个配置服务实例
 */
export class ConfigService {
  private static _instance: ConfigService;
  private _config: IConfig;
  private _configPath: string;
  private _defaultConfig: IConfig = DEFAULT_CONFIG;
  private _listeners: Array<(config: IConfig) => void> = [];

  /**
   * 私有构造函数，初始化配置服务
   * 加载现有配置或使用默认配置
   */
  private constructor() {
    // 获取配置文件路径
    this._configPath = path.join(app.getPath('userData'), 'config.json');
    // 加载配置
    this._config = this._loadConfig();
    this._setupIpcEvents()
  }

  /**
   * 配置服务的Ipc事件处理
   */
  private _setupIpcEvents() {
    const duration = 200;
    const handleSet = debounce((key, val) => this.set(key, val), duration);
    const handleUpdate = debounce((val) => this.update(val), duration);
    ipcMain.handle(IPC_EVENTS.GET_CONFIG, (_, key) => this.get(key));
    ipcMain.on(IPC_EVENTS.SET_CONFIG, (_, key, value) => handleSet(key, value));
    ipcMain.on(IPC_EVENTS.UPDATE_CONFIG, (_, value) => handleUpdate(value));
  }

  /**
   * 获取配置服务的单例实例
   * @returns ConfigService 实例
   */
  public static getInstance(): ConfigService {
    if (!this._instance)
      this._instance = new ConfigService();

    return this._instance;
  }

  /**
   * 加载配置文件
   * 如果文件不存在或解析失败，返回默认配置
   * @returns 配置对象
   */
  private _loadConfig(): IConfig {
    try {
      // 检查配置文件是否存在
      if (fs.existsSync(this._configPath)) {
        // 读取配置文件内容
        const configContent = fs.readFileSync(this._configPath, 'utf-8');
        // 解析JSON并合并默认配置
        const config = { ...this._defaultConfig, ...JSON.parse(configContent) };
        logManager.info('Configuration loaded successfully from:', this._configPath);
        return config;
      }
      logManager.info('Configuration file not found, using default configuration');
    } catch (error) {
      logManager.error('Failed to load config:', error);
    }
    // 返回默认配置
    return { ...this._defaultConfig };
  }

  /**
   * 保存配置到文件
   */
  private _saveConfig(): void {
    try {
      // 确保目录存在
      fs.mkdirSync(path.dirname(this._configPath), { recursive: true });
      // 写入配置文件，格式化JSON便于阅读
      fs.writeFileSync(this._configPath, JSON.stringify(this._config, null, 2), 'utf-8');
      // 通知所有监听器配置已更改
      this._notifyListeners();
      logManager.info('Configuration saved successfully to:', this._configPath);
    } catch (error) {
      logManager.error('Failed to save config:', error);
    }
  }

  /**
   * 通知所有监听器配置已更改
   */
  private _notifyListeners(): void {
    BrowserWindow.getAllWindows().forEach(win => win.webContents.send(IPC_EVENTS.CONFIG_CHANGE, this._config))
    this._listeners.forEach(listener => listener({ ...this._config }));
  }

  /**
   * 获取完整配置对象
   * @returns 当前配置对象的深拷贝
   */
  public getConfig(): IConfig {
    return simpleCloneDeep(this._config);
  }

  /**
   * 获取指定配置项的值
   * @param key 配置项键名
   * @returns 配置项的值
   */
  public get<T = any>(key: ConfigKeys): T {
    return this._config[key] as T;
  }

  /**
   * 设置配置项的值
   * @param key 配置项键名
   * @param value 配置项值
   * @param autoSave 是否自动保存（默认true）
   */
  public set(key: ConfigKeys, value: unknown, autoSave: boolean = true): void {
    if (!(key in this._config)) return;
    const oldValue = this._config[key];
    if (oldValue === value) return;
    this._config[key] = value as never;
    logManager.debug(`Configuration updated: ${key} from ${JSON.stringify(oldValue)} to ${JSON.stringify(value)}`);
    autoSave && this._saveConfig();
  }

  /**
   * 批量更新配置
   * @param updates 要更新的配置键值对
   * @param autoSave 是否自动保存（默认true）
   */
  public update(updates: Partial<IConfig>, autoSave: boolean = true): void {
    this._config = { ...this._config, ...updates };
    autoSave && this._saveConfig();
  }

  /**
   * 重置配置为默认值
   */
  public resetToDefault(): void {
    this._config = { ...this._defaultConfig };
    logManager.info('Configuration reset to default values');
    this._saveConfig();
  }

  /**
   * 添加配置变化监听器
   * @param listener 监听器函数
   * @returns 用于移除监听器的函数
   */
  public onConfigChange(listener: (config: IConfig) => void): () => void {
    this._listeners.push(listener);
    // 返回移除监听器的函数
    return () => this._listeners = this._listeners.filter(l => l !== listener);
  }
}

/**
 * 配置服务实例，供全局使用
 */
export const configManager = ConfigService.getInstance();
export default configManager;
