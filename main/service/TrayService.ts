import { Tray, Menu, ipcMain, type BrowserWindow, } from 'electron';
import { createTranslator, createLogo } from '../utils';
import { MAIN_WIN_SIZE, IPC_EVENTS, WINDOW_NAMES, CONFIG_KEYS } from '@common/constants';
import logManager from './LogService';
import shortcutManager from './ShortcutService';
import windowManager from './WindowService';
import configManager from './ConfigService';

let t: ReturnType<typeof createTranslator> = createTranslator();

export class TrayService {
  private static _instance: TrayService;
  private _tray: Tray | null = null;
  private _window: BrowserWindow;
  private _removeLanguageListener?: () => void;

  private constructor(window: BrowserWindow) {
    this._window = window;
    this._setupLanguageChangeListener();
    logManager.info('Tray service initialized');
  }

  /**
   * 创建或获取TrayService实例
   */
  public static getInstance(window: BrowserWindow) {
    if (!this._instance && window)
      this._instance = new TrayService(window);
    return this._instance;
  }

  /**
   * 创建系统托盘
   */
  public create() {
    if (this._tray) return;

    this._updateTray();
    this._window.on('closed', () => this.destroy());
  }

  /**
   * 更新托盘菜单和提示文本
   */
  private _updateTray() {
    if (!this._tray) {
      this._tray = new Tray(createLogo());
    }

    const showWindow = () => {
      if (this._window?.isVisible()) {
        this._window.focus();
        return
      }
      windowManager.create(WINDOW_NAMES.MAIN, MAIN_WIN_SIZE);
    };

    this._tray.setToolTip(t('tray.tooltip') ?? 'Noelle Application');

    shortcutManager.register('CmdOrCtrl+N', 'tray.showWindow', showWindow);

    this._tray.setContextMenu(Menu.buildFromTemplate([
      { label: t('tray.showWindow'), accelerator: 'CmdOrCtrl+N', click: showWindow },
      { type: 'separator' },
      { label: t('settings.title'), click: () => ipcMain.emit(`${IPC_EVENTS.OPEN_WINDOW}:${WINDOW_NAMES.SETTING}`) },
      { role: 'quit', label: t('tray.exit') }
    ]));

    // 移除旧的点击监听器，避免重复添加导致内存泄漏警告
    this._tray.removeAllListeners('click');
    this._tray.on('click', showWindow)
  }

  /**
   * 设置语言变化监听器
   * 当语言配置改变时，重新创建托盘菜单
   */
  private _setupLanguageChangeListener() {
    this._removeLanguageListener = configManager.onConfigChange((config) => {
      // 检查是否是语言变化
      if (!config[CONFIG_KEYS.LANGUAGE]) return;

      // 更新翻译函数
      t = createTranslator();

      // 重新创建托盘菜单
      if (this._tray) {
        this._updateTray();
      }
    });
  }

  /**
   * 销毁托盘
   */
  public destroy() {
    this._tray?.destroy();
    this._tray = null;

    shortcutManager.unregister('tray.showWindow');

    // 移除语言变化监听器
    if (this._removeLanguageListener) {
      this._removeLanguageListener();
      this._removeLanguageListener = undefined;
    }
  }
}
