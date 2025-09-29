import { IPC_EVENTS, WINDOW_NAMES } from '@common/constants';
import { ipcMain } from 'electron';
import { windowManager } from '../service/WindowService';
import { shortcutManager } from '../service/ShortcutService';


export function setupSettingWindow() {
  ipcMain.on(`${IPC_EVENTS.OPEN_WINDOW}:${WINDOW_NAMES.SETTING}`, () => {

    const settingWindow = windowManager.get(WINDOW_NAMES.SETTING);
    if (settingWindow && !settingWindow.isDestroyed())
      return windowManager.focus(settingWindow);

    const _win = windowManager.create(WINDOW_NAMES.SETTING, { width: 800, height: 600, minHeight: 600, minWidth: 800 });

    const onClose = () => {
      windowManager.close(_win, false);
      return true;
    }
    shortcutManager.registerForWindow(_win, (input) => {
      if (input.code === 'KeyW' && input.modifiers.includes('control'))
        return onClose();
    });
  });
}

export default setupSettingWindow;
