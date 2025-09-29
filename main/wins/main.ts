import { ipcMain, type BrowserWindow } from 'electron';
import { WINDOW_NAMES, MAIN_WIN_SIZE, MENU_IDS, IPC_EVENTS, CONFIG_KEYS, CONVERSATION_ITEM_MENU_IDS, CONVERSATION_LIST_MENU_IDS, MESSAGE_ITEM_MENU_IDS, SHORTCUT_KEYS } from '@common/constants';
import { createProvider } from '../providers';
import { TrayService } from '../service/TrayService';
import windowManager from '../service/WindowService';
import configManager from '../service/ConfigService';
import menuManager from '../service/MenuService';
import shortcutManager from '../service/ShortcutService';
import logManager from '@main/service/LogService';

const handleTray = (minimizeToTray: boolean, mainWindow: BrowserWindow) => {
  if (minimizeToTray) {
    TrayService.getInstance(mainWindow)?.create()
    return
  }
  TrayService.getInstance(mainWindow)?.destroy()
}

const registerMenus = (window: BrowserWindow) => {

  const conversationItemMenuItemClick = (id: string) => {
    logManager.logUserOperation(`${IPC_EVENTS.SHOW_CONTEXT_MENU}:${MENU_IDS.CONVERSATION_ITEM}-${id}`)
    window.webContents.send(`${IPC_EVENTS.SHOW_CONTEXT_MENU}:${MENU_IDS.CONVERSATION_ITEM}`, id);
  }

  menuManager.register(MENU_IDS.CONVERSATION_ITEM, [
    {
      id: CONVERSATION_ITEM_MENU_IDS.PIN,
      label: 'menu.conversation.pinConversation',
      click: () => conversationItemMenuItemClick(CONVERSATION_ITEM_MENU_IDS.PIN)
    },
    {
      id: CONVERSATION_ITEM_MENU_IDS.RENAME,
      label: 'menu.conversation.renameConversation',
      click: () => conversationItemMenuItemClick(CONVERSATION_ITEM_MENU_IDS.RENAME)
    },
    {
      id: CONVERSATION_ITEM_MENU_IDS.DEL,
      label: 'menu.conversation.delConversation',
      click: () => conversationItemMenuItemClick(CONVERSATION_ITEM_MENU_IDS.DEL)
    },
  ])

  const conversationListMenuItemClick = (id: string) => {
    logManager.logUserOperation(`${IPC_EVENTS.SHOW_CONTEXT_MENU}:${MENU_IDS.CONVERSATION_LIST}-${id}`)
    window.webContents.send(`${IPC_EVENTS.SHOW_CONTEXT_MENU}:${MENU_IDS.CONVERSATION_LIST}`, id);
  }

  menuManager.register(MENU_IDS.CONVERSATION_LIST, [
    {
      id: CONVERSATION_LIST_MENU_IDS.NEW_CONVERSATION,
      label: 'menu.conversation.newConversation',
      click: () => conversationListMenuItemClick(CONVERSATION_LIST_MENU_IDS.NEW_CONVERSATION)
    },
    { type: 'separator' },
    {
      id: CONVERSATION_LIST_MENU_IDS.SORT_BY, label: 'menu.conversation.sortBy', submenu: [
        { id: CONVERSATION_LIST_MENU_IDS.SORT_BY_CREATE_TIME, label: 'menu.conversation.sortByCreateTime', type: 'radio', checked: false, click: () => conversationListMenuItemClick(CONVERSATION_LIST_MENU_IDS.SORT_BY_CREATE_TIME) },
        { id: CONVERSATION_LIST_MENU_IDS.SORT_BY_UPDATE_TIME, label: 'menu.conversation.sortByUpdateTime', type: 'radio', checked: false, click: () => conversationListMenuItemClick(CONVERSATION_LIST_MENU_IDS.SORT_BY_UPDATE_TIME) },
        { id: CONVERSATION_LIST_MENU_IDS.SORT_BY_NAME, label: 'menu.conversation.sortByName', type: 'radio', checked: false, click: () => conversationListMenuItemClick(CONVERSATION_LIST_MENU_IDS.SORT_BY_NAME) },
        { id: CONVERSATION_LIST_MENU_IDS.SORT_BY_MODEL, label: 'menu.conversation.sortByModel', type: 'radio', checked: false, click: () => conversationListMenuItemClick(CONVERSATION_LIST_MENU_IDS.SORT_BY_MODEL) },
        { type: 'separator' },
        { id: CONVERSATION_LIST_MENU_IDS.SORT_ASCENDING, label: 'menu.conversation.sortAscending', type: 'radio', checked: false, click: () => conversationListMenuItemClick(CONVERSATION_LIST_MENU_IDS.SORT_ASCENDING) },
        { id: CONVERSATION_LIST_MENU_IDS.SORT_DESCENDING, label: 'menu.conversation.sortDescending', type: 'radio', checked: false, click: () => conversationListMenuItemClick(CONVERSATION_LIST_MENU_IDS.SORT_DESCENDING) },
      ]
    },
    {
      id: CONVERSATION_LIST_MENU_IDS.BATCH_OPERATIONS,
      label: 'menu.conversation.batchOperations',
      click: () => conversationListMenuItemClick(CONVERSATION_LIST_MENU_IDS.BATCH_OPERATIONS)
    }
  ])

  const messageItemMenuItemClick = (id: string) => {
    logManager.logUserOperation(`${IPC_EVENTS.SHOW_CONTEXT_MENU}:${MENU_IDS.MSSAGE_ITEM}-${id}`)
    window.webContents.send(`${IPC_EVENTS.SHOW_CONTEXT_MENU}:${MENU_IDS.MSSAGE_ITEM}`, id);
  }

  menuManager.register(MENU_IDS.MSSAGE_ITEM, [
    {
      id: MESSAGE_ITEM_MENU_IDS.COPY,
      label: 'menu.message.copyMessage',
      click: () => messageItemMenuItemClick(MESSAGE_ITEM_MENU_IDS.COPY)
    },
    {
      id: MESSAGE_ITEM_MENU_IDS.SELECT,
      label: 'menu.message.selectMessage',
      click: () => messageItemMenuItemClick(MESSAGE_ITEM_MENU_IDS.SELECT)
    },
    { type: 'separator' },
    {
      id: MESSAGE_ITEM_MENU_IDS.DELETE,
      label: 'menu.message.deleteMessage',
      click: () => messageItemMenuItemClick(MESSAGE_ITEM_MENU_IDS.DELETE)
    },
  ])
}

const registerShortcuts = (window: BrowserWindow) => {
  const onClose = () => {
    const isReallyClose = configManager.get(CONFIG_KEYS.MINIMIZE_TO_TRAY) === false;
    windowManager.close(window, isReallyClose);
    return true; // e.preventDefault()
  }
  shortcutManager.registerForWindow(window, (input) => {
    if ((input.key === 'F4' && input.alt) && (process.platform !== 'darwin'))
      return onClose();

    if (input.code === 'KeyW' && input.modifiers.includes('control'))
      return onClose();

    if (input.code === 'Enter' && input.modifiers.includes('control'))
      window.webContents.send(IPC_EVENTS.SHORTCUT_CALLED + SHORTCUT_KEYS.SEND_MESSAGE);
  });
}

export async function setupMainWindow() {
  const mainWindow = windowManager.create(WINDOW_NAMES.MAIN, MAIN_WIN_SIZE);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  let minimizeToTray = configManager.get(CONFIG_KEYS.MINIMIZE_TO_TRAY);
  configManager.onConfigChange((config) => {
    if (minimizeToTray === config[CONFIG_KEYS.MINIMIZE_TO_TRAY]) return;
    minimizeToTray = config[CONFIG_KEYS.MINIMIZE_TO_TRAY];
    handleTray(minimizeToTray, mainWindow);
  });
  handleTray(minimizeToTray, mainWindow);

  registerMenus(mainWindow);
  registerShortcuts(mainWindow);

  ipcMain.on(IPC_EVENTS.START_A_DIALOGUE, async (_event, props: CreateDialogueProps) => {
    const { providerName, messages, messageId, selectedModel } = props
    try {
      const provider = createProvider(providerName);
      const chunks = await provider?.chat(messages, selectedModel);
      if (!chunks) {
        throw new Error('stream not found');
      };
      for await (const data of chunks) {
        mainWindow.webContents.send(IPC_EVENTS.DIALOGUE_BACK + messageId, {
          messageId,
          data
        })
      }
    } catch (err) {
      const errorContent = {
        messageId,
        data: {
          isEnd: true,
          isError: true,
          result: err instanceof Error ? err.message : String(err),
        }
      }
      mainWindow.webContents.send(IPC_EVENTS.DIALOGUE_BACK + messageId, errorContent);
    }
  })
}

export default setupMainWindow;
