import { app, globalShortcut, type BrowserWindow } from 'electron';
// import { IPC_EVENTS } from '@common/constants';

/**
 * 快捷键服务类，用于管理应用的全局快捷键
 * 采用单例模式确保全局只有一个快捷键服务实例
 */
export class ShortcutService {
  private static _instance: ShortcutService;
  private _registeredShortcuts: Map<string, Electron.Accelerator> = new Map();

  /**
   * 私有构造函数，初始化快捷键服务
   * 注册必要的默认快捷键
   */
  private constructor() {
    this._registerDefaultShortcuts();
    this._setupAppEvents();
  }

  /**
   * 获取快捷键服务的单例实例
   * @returns ShortcutService 实例
   */
  public static getInstance(): ShortcutService {
    if (!this._instance) {
      this._instance = new ShortcutService();
    }
    return this._instance;
  }

  /**
   * 设置应用事件监听
   * 确保在应用退出前注销所有快捷键
   */
  private _setupAppEvents() {
    app.on('will-quit', () => {
      this.unregisterAll();
    });

    app.on('browser-window-blur', () => {
      // 可以选择在窗口失去焦点时注销部分快捷键
    });

    app.on('browser-window-focus', () => {
      // 可以选择在窗口获得焦点时重新注册快捷键
    });
  }

  /**
   * 注册默认快捷键
   */
  private _registerDefaultShortcuts() {
    // 示例：注册一些默认快捷键
    // this.register('CommandOrControl+N', 'new-window', () => {
    //   // 创建新窗口的逻辑
    // });
  }

  /**
   * 注册快捷键
   * @param accelerator 快捷键组合
   * @param id 快捷键唯一标识
   * @param callback 快捷键触发时的回调函数
   * @returns 是否注册成功
   */
  public register(accelerator: Electron.Accelerator, id: string, callback: () => void): boolean {
    try {
      // 先注销已存在的相同id的快捷键
      if (this._registeredShortcuts.has(id)) {
        this.unregister(id);
      }

      // 注册新的快捷键
      const success = globalShortcut.register(accelerator, callback);

      if (success) {
        this._registeredShortcuts.set(id, accelerator);
        console.log(`Shortcut registered: ${accelerator} (id: ${id})`);
      } else {
        console.error(`Failed to register shortcut: ${accelerator} (id: ${id})`);
      }

      return success;
    } catch (error) {
      console.error(`Error registering shortcut: ${accelerator} (id: ${id})`, error);
      return false;
    }
  }

  /**
   * 根据id注销快捷键
   * @param id 快捷键唯一标识
   * @returns 是否注销成功
   */
  public unregister(id: string): boolean {
    try {
      const accelerator = this._registeredShortcuts.get(id);

      if (accelerator) {
        globalShortcut.unregister(accelerator);
        this._registeredShortcuts.delete(id);
        console.log(`Shortcut unregistered: ${accelerator} (id: ${id})`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error unregistering shortcut with id: ${id}`, error);
      return false;
    }
  }

  /**
   * 注销所有已注册的快捷键
   */
  public unregisterAll(): void {
    try {
      globalShortcut.unregisterAll();
      this._registeredShortcuts.clear();
      console.log('All shortcuts unregistered');
    } catch (error) {
      console.error('Error unregistering all shortcuts', error);
    }
  }

  /**
   * 检查快捷键是否已注册
   * @param accelerator 快捷键组合
   * @returns 是否已注册
   */
  public isRegistered(accelerator: Electron.Accelerator): boolean {
    try {
      return globalShortcut.isRegistered(accelerator);
    } catch (error) {
      console.error(`Error checking if shortcut is registered: ${accelerator}`, error);
      return false;
    }
  }

  /**
   * 获取所有已注册的快捷键
   * @returns 已注册的快捷键映射
   */
  public getRegisteredShortcuts(): Map<string, Electron.Accelerator> {
    return new Map(this._registeredShortcuts);
  }

  /**
   * 为特定窗口注册快捷键
   * @param window 目标窗口
   * @param accelerator 快捷键组合
   * @param id 快捷键唯一标识
   * @param callback 快捷键触发时的回调函数
   * @returns 是否注册成功
   */
  public registerForWindow(
    window: BrowserWindow,
    accelerator: Electron.Accelerator,
    id: string,
    callback: () => void
  ): boolean {
    // 窗口快捷键可以通过webContents.on('before-input-event')实现
    // 这里只是一个示例实现，实际可能需要更复杂的逻辑
    try {
      const fullId = `window_${window.id}_${id}`;
      return this.register(accelerator, fullId, callback);
    } catch (error) {
      console.error(`Error registering shortcut for window: ${accelerator} (id: ${id})`, error);
      return false;
    }
  }

  /**
   * 为特定窗口注销所有快捷键
   * @param window 目标窗口
   */
  public unregisterForWindow(window: BrowserWindow): void {
    const windowPrefix = `window_${window.id}_`;
    const idsToRemove: string[] = [];

    this._registeredShortcuts.forEach((_, id) => {
      if (id.startsWith(windowPrefix)) {
        idsToRemove.push(id);
      }
    });

    idsToRemove.forEach(id => this.unregister(id));
  }
}

export const shortcutManager = ShortcutService.getInstance();

export default shortcutManager;
