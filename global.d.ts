interface CreateDialogProps {
  winId?: string;
  title?: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  isModal?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

type DialogueMessageRole = 'user' | 'assistant'

interface DialogueMessageProps {
  role: DialogueMessageRole;
  content: string;
}

interface CreateDialogueProps {
  messages: DialogueMessageProps[];
  providerName: string;
  selectedModel: string;
  messageId: number;
  conversationId: number;
}

interface UniversalChunk {
  isEnd: boolean;
  result: string;
}

interface DialogueBackStream {
  messageId: number;
  data: UniversalChunk & { isError?: boolean };
}


type WindowNames = 'main' | 'setting' | 'dialog'
type ThemeMode = 'light' | 'dark' | 'system'


interface WindowApi {
  createDialog: (params: CreateDialogProps) => Promise<string>;
  openWindow: (name: WindowNames) => void;
  closeWindow: () => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  onWindowMaximized: (callback: (isMaximized: boolean) => void) => void;
  isWindowMaximized: () => Promise<boolean>;
  setThemeMode: (mode: ThemeMode) => Promise<boolean>;
  getThemeMode: () => Promise<ThemeMode>;
  isDarkTheme: () => Promise<boolean>;
  onSystemThemeChange: (callback: (isDark: boolean) => void) => void;
  platform: () => string;
  isMac: () => boolean;
  isWin: () => boolean;
  viewIsReady: () => void
  getConfig: (key: string) => Promise<any>
  setConfig: (key: string, value: any) => void
  updateConfig: (value: any) => void

  showContextMenu: (menuId: string, dynamicLabels?: string) => Promise<any>;
  removeContextMenuListener: (menuId: string) => void;
  contextMenuItemClick: (menuId: string, cb: (id: string) => void) => void;

  onConfigChange: (cb: (config: any) => void) => () => void
  removeConfigChangeListener: (cb: (config: any) => void) => void

  _dialogFeedback: (val: 'cancel' | 'confirm', winId: number) => void;
  _dialogGetParams: () => Promise<any>


  startADialogue: (params: CreateDialogueProps) => void;
  onDialogueBack: (cb: (data: DialogueBackStream) => void, messageId: number) => () => void;

  onShortcutCalled: (key: string, cb: () => void) => () => void;

  logger: {
    debug: (message: string, ...meta?: any[]) => void;
    info: (message: string, ...meta?: any[]) => void;
    warn: (message: string, ...meta?: any[]) => void;
    error: (message: string, ...meta?: any[]) => void;
    fatal: (message: string, ...meta?: any[]) => void;
    // warn: (message: string, meta?: any[]) => void;
    // error: (message: string, meta?: any[]) => void;
    // fatal: (message: string, meta?: any[]) => void;
  }
}

declare interface Window {
  api: WindowApi;
}

interface ImportMetaEnv {
  readonly VITE_BIGMODEL_API_KEY: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
