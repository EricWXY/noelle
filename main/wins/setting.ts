import { IPC_EVENTS, WINDOW_NAMES, SHORTCUT_KEYS } from '@common/constants';
import { ipcMain } from 'electron';
import { windowManager } from '../service/WindowService';
import eventBus from '../service/EventBusService';


export function setupSettingWindow() {
  ipcMain.on(`${IPC_EVENTS.OPEN_WINDOW}:${WINDOW_NAMES.SETTING}`, () => {

    const settingWindow = windowManager.get(WINDOW_NAMES.SETTING);
    if (settingWindow && !settingWindow.isDestroyed())
      return windowManager.focus(settingWindow);

    const _win = windowManager.create(WINDOW_NAMES.SETTING, { width: 800, height: 600, minHeight: 600, minWidth: 800 });

    const onClose = () => {
      if (!_win?.isFocused?.()) return;
      windowManager.close(_win, false);
    }
    eventBus.on(SHORTCUT_KEYS.CLOSE_WINDOW, onClose);
    _win.on('closed', () => eventBus.off(SHORTCUT_KEYS.CLOSE_WINDOW, onClose))
  });
}

export default setupSettingWindow;
