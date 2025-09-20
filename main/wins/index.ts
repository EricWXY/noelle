import { setupMainWindow } from './main'
import { setupSettingWindow } from './setting'
import { setupDialogWindow } from './dialog'

export function setupWindows() {
  setupMainWindow()
  setupSettingWindow()
  setupDialogWindow()
}

export {
  setupMainWindow,
  setupSettingWindow,
  setupDialogWindow
}

