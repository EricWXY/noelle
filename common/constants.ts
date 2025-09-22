export enum IPC_EVENTS {
  // rendder to main
  OPEN_WINDOW = 'open-window',
  CLOSE_WINDOW = 'close-window',
  MINIMIZE_WINDOW = 'minimize-window',
  MAXIMIZE_WINDOW = 'maximize-window',
  IS_WINDOW_MAXIMIZED = 'is-window-maximized',
  SET_THEME_MODE = 'set-theme-mode',
  GET_THEME_MODE = 'get-theme-mode',
  IS_DARK_THEME = 'is-dark-theme',
  RENDERER_IS_READY = 'renderer-is-ready',
  GET_CONFIG = 'get-config',
  SET_CONFIG = 'set-config',
  UPDATE_CONFIG = 'update-config',
  SHOW_CONTEXT_MENU = 'show-context-menu',

  START_A_DIALOGUE = 'start-a-dialogue',


  // main to renderer
  WINDOW_MAXIMIZED = 'window-maximized',
  SYSTEM_THEME_CHANGED = 'system-theme-changed',
  CONFIG_CHANGE = 'config-change',
  DIALOGUE_BACK = 'dialogue-back',
  SHORTCUT_CALLED = 'shortcut-called',
}

export enum SHORTCUT_KEYS {
  SEND_MESSAGE = 'CmdOrCtrl+Enter',
}

export enum WINDOW_NAMES {
  MAIN = 'main',
  SETTING = 'setting',
  DIALOG = 'dialog',
}

export enum MENU_IDS {
  CONVERSATION_ITEM = 'conversation-item',
  CONVERSATION_LIST = 'conversation-list',
  MSSAGE_ITEM = 'message-item',
}

export enum CONVERSATION_ITEM_MENU_IDS {
  DEL = 'del',
  RENAME = 'rename',
  PIN = 'pin',
}

export enum CONVERSATION_LIST_MENU_IDS {
  NEW_CONVERSATION = 'newConversation',
  SORT_BY = 'sortBy',
  SORT_BY_CREATE_TIME = 'sortByCreateTime',
  SORT_BY_UPDATE_TIME = 'sortByUpdateTime',
  SORT_BY_NAME = 'sortByName',
  SORT_BY_MODEL = 'sortByModel',
  SORT_ASCENDING = 'sortAscending',
  SORT_DESCENDING = 'sortDescending',
  BATCH_OPERATIONS = 'batchOperations',
}

export enum MESSAGE_ITEM_MENU_IDS {
  COPY = 'copy',
  DELETE = 'delete',
  SELECT = 'select',
}


export enum CONFIG_KEYS {
  THEME_MODE = 'themeMode',
  PRIMARY_COLOR = 'primaryColor',
  LANGUAGE = 'language',
  FONT_SIZE = 'fontSize',
  MINIMIZE_TO_TRAY = 'minimizeToTray',
  PROVIDER = 'provider',
  DEFAULT_MODEL = 'defaultModel',
}

export const MAIN_WIN_SIZE = {
  width: 1024,
  height: 800,
  minHeight: 800,
  minWidth: 1024
} as const
