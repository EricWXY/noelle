import { app, BrowserWindow } from 'electron';
import { setupWindows as setupWins } from './wins';
import configManager from './service/ConfigService';
import started from 'electron-squirrel-startup';
import logManager from './service/LogService';
import { CONFIG_KEYS } from '@common/constants';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const setupWindows = () => {
  // Create the browser window.
  setupWins();
};

process.on('uncaughtException', (error) => {
  logManager.error('uncaughtException:', error);
  // 退出应用/重启应用
  // app.relaunch();
  // app.exit(1);
});

process.on('unhandledRejection', (reason, promise) =>
  logManager.error('unhandledRejection:', reason, promise)
);


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  logManager.info('Application started');
  setupWindows();
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      setupWindows();
    };
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !configManager.get(CONFIG_KEYS.MINIMIZE_TO_TRAY)) {
    logManager.info('Application closing due to all windows being closed');
    app.quit();
  };
});

// Log application exit
app.on('will-quit', () => {
  logManager.info('Application is quitting');
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
// app.commandLine.appendSwitch('disable-gpu-driver-bug-workarounds');
