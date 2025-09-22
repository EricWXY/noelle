// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_EVENTS, WINDOW_NAMES } from '@common/constants'

const api: WindowApi = {
  openWindow: (name: WindowNames) => ipcRenderer.send(`${IPC_EVENTS.OPEN_WINDOW}:${name}`),
  closeWindow: () => ipcRenderer.send(IPC_EVENTS.CLOSE_WINDOW),
  minimizeWindow: () => ipcRenderer.send(IPC_EVENTS.MINIMIZE_WINDOW),
  maximizeWindow: () => ipcRenderer.send(IPC_EVENTS.MAXIMIZE_WINDOW),
  isWindowMaximized: () => ipcRenderer.invoke(IPC_EVENTS.IS_WINDOW_MAXIMIZED),
  platform: () => process.platform,
  isMac: () => process.platform === 'darwin',
  isWin: () => process.platform === 'win32',
  onWindowMaximized: (callback: (isMaximized: boolean) => void) =>
    ipcRenderer.on(IPC_EVENTS.WINDOW_MAXIMIZED, (_event, isMaximized) => callback(isMaximized)),
  setThemeMode: (mode: ThemeMode) => ipcRenderer.invoke(IPC_EVENTS.SET_THEME_MODE, mode),
  getThemeMode: () => ipcRenderer.invoke(IPC_EVENTS.GET_THEME_MODE),
  isDarkTheme: () => ipcRenderer.invoke(IPC_EVENTS.IS_DARK_THEME),
  onSystemThemeChange: (callback: (isDark: boolean) => void) => ipcRenderer.on(IPC_EVENTS.SYSTEM_THEME_CHANGED, (_, isDark) => callback(isDark)),
  viewIsReady: () => ipcRenderer.send(IPC_EVENTS.RENDERER_IS_READY),

  getConfig: (key: string) => ipcRenderer.invoke(IPC_EVENTS.GET_CONFIG, key),
  setConfig: (key: string, value: any) => ipcRenderer.send(IPC_EVENTS.SET_CONFIG, key, value),
  updateConfig: (value: any) => ipcRenderer.send(IPC_EVENTS.UPDATE_CONFIG, value),
  onConfigChange: (callback: (config: any) => void) => ipcRenderer.on(IPC_EVENTS.CONFIG_CHANGE, (_, config) => callback(config)),
  removeConfigChangeListener: (callback: (config: any) => void) => ipcRenderer.removeListener(IPC_EVENTS.CONFIG_CHANGE, callback),

  _dialogFeedback: (val: 'cancel' | 'confirm', winId: number) => ipcRenderer.send(WINDOW_NAMES.DIALOG + val, winId),
  _dialogGetParams: () => ipcRenderer.invoke(WINDOW_NAMES.DIALOG + 'get-params'),

  createDialog: (params: CreateDialogProps) => new Promise(async (resolve) => {
    const feedback = await ipcRenderer.invoke(`${IPC_EVENTS.OPEN_WINDOW}:${WINDOW_NAMES.DIALOG}`, {
      title: params.title ?? '',
      content: params.content,
      confirmText: params.confirmText,
      cancelText: params.cancelText,
    })

    if (feedback === 'confirm') params.onConfirm?.();
    if (feedback === 'cancel') params.onCancel?.();
    resolve(feedback);
  }),

  showContextMenu: (menuId: string, dynamicLabels?: string) => ipcRenderer.invoke(IPC_EVENTS.SHOW_CONTEXT_MENU, menuId, dynamicLabels),
  removeContextMenuListener: (menuId: string) => ipcRenderer.removeAllListeners(`${IPC_EVENTS.SHOW_CONTEXT_MENU}:${menuId}`),
  contextMenuItemClick: (menuId: string, cb: (id: string) => void) => ipcRenderer.once(`${IPC_EVENTS.SHOW_CONTEXT_MENU}:${menuId}`, (_event, id) => cb(id)),

  startADialogue: (params: CreateDialogueProps) => ipcRenderer.send(IPC_EVENTS.START_A_DIALOGUE, params),
  onDialogueBack: (cb: (data: DialogueBackStream) => void, messageId: number) => {
    const callback = (_event: Electron.IpcRendererEvent, data: DialogueBackStream) => cb(data);
    // const msgId = (data)
    ipcRenderer.on(IPC_EVENTS.DIALOGUE_BACK + messageId, callback);
    return () => ipcRenderer.removeListener(IPC_EVENTS.DIALOGUE_BACK + messageId, callback);
  }
}

contextBridge.exposeInMainWorld('api', api);
