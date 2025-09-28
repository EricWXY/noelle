import { BrowserWindow, ipcMain, nativeTheme } from 'electron';
import { configManager } from './ConfigService';
import { logManager } from './LogService';
import { IPC_EVENTS, CONFIG_KEYS } from '@common/constants';

class ThemeService {
  private static _instance: ThemeService;
  private _isDark: boolean = nativeTheme.shouldUseDarkColors;

  private constructor() {
    const themeMode = configManager.get(CONFIG_KEYS.THEME_MODE)
    if (themeMode) {
      nativeTheme.themeSource = themeMode;
      this._isDark = nativeTheme.shouldUseDarkColors;
    }
    this._setupEvents();
    logManager.info('Theme service initialized');
  }
  private _setupEvents() {
    ipcMain.handle(IPC_EVENTS.SET_THEME_MODE, (_, mode: ThemeMode) => {

      nativeTheme.themeSource = mode;
      configManager.set(CONFIG_KEYS.THEME_MODE, mode)
      return nativeTheme.shouldUseDarkColors;
    });
    ipcMain.handle(IPC_EVENTS.GET_THEME_MODE, () => {
      return nativeTheme.themeSource;
    })

    ipcMain.handle(IPC_EVENTS.IS_DARK_THEME, () => {
      return nativeTheme.shouldUseDarkColors;
    })

    nativeTheme.on('updated', () => {
      this._isDark = nativeTheme.shouldUseDarkColors;
      BrowserWindow.getAllWindows().forEach(win =>
        win.webContents.send(IPC_EVENTS.SYSTEM_THEME_CHANGED, this._isDark));
    });
  }

  static getInstance() {
    if (!this._instance)
      this._instance = new ThemeService();
    return this._instance;
  }

  public get isDark() {
    return this._isDark;
  }

  public get themeMode() {
    return nativeTheme.themeSource;
  }
}

export const themeManager = ThemeService.getInstance();
export default themeManager;
