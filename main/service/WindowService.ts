import { BrowserWindow, screen, type BrowserWindowConstructorOptions, type IpcMainEvent, WebContentsView, ipcMain, BaseWindow, IpcMainInvokeEvent, app } from 'electron';
import type { WindowNames } from '@common/types';
import { WINDOW_NAMES, IPC_EVENTS, CONFIG_KEYS } from '@common/constants';
import { debounce } from '@common/utils';
import { createLogo } from '../utils';
import { EasingFunctions, createAnimator, AnimtorService } from './AnimtorService';
import configManager from './ConfigService';
import themeManager from './ThemeService';
import path from 'node:path';
import logManager from './LogService';

/**
 * 定义窗口尺寸配置接口，包含窗口的基本尺寸以及可选的最大、最小尺寸。
 */
interface SizeOptions {
  width: number; // 窗口宽度
  height: number; // 窗口高度
  maxWidth?: number; // 窗口最大宽度，可选
  maxHeight?: number; // 窗口最大高度，可选
  minWidth?: number; // 窗口最小宽度，可选
  minHeight?: number; // 窗口最小高度，可选
}

/**
 * 定义共享的窗口配置选项，这些选项将应用于所有创建的窗口。
 */
const SHARE_WINDOW_OPTS = {
  titleBarStyle: 'hidden', // 隐藏窗口标题栏
  opacity: 0, // 窗口初始透明度为 0
  show: false,
  icon: createLogo(), // 设置窗口图标
  title: 'Noelle',
  darkTheme: themeManager.isDark,
  backgroundColor: themeManager.isDark ? '#2C2C2C' : '#FFFFFF',
  webPreferences: {
    nodeIntegration: false, // 禁用 Node.js 集成，提高安全性
    contextIsolation: true, // 启用上下文隔离，防止渲染进程访问主进程 API
    sandbox: true, // 启用沙箱模式，进一步增强安全性
    backgroundThrottling: false,
    preload: path.join(__dirname, 'preload.js'), // 指定预加载脚本的路径
  },
} as BrowserWindowConstructorOptions;

interface WindowState {
  instance: BrowserWindow | void;
  isHidden: boolean;
  status?: string
}

/**
 * WindowService 类用于管理应用程序中的所有窗口，采用单例模式确保全局只有一个实例。
 */
class WindowService {
  /**
   * 静态属性，存储 WindowService 类的单例实例。
   */
  private static _instance: WindowService;

  /**
   * 存储所有窗口实例的对象，键为窗口名称，值为对应的 BrowserWindow 实例或 undefined。
   */
  private _winStates: Record<WindowNames | string, WindowState> = {
    main: { instance: void 0, isHidden: false },
    setting: { instance: void 0, isHidden: false },
    dialog: { instance: void 0, isHidden: false },
  };

  /**
   * 私有构造函数，用于创建 WindowService 类的实例。
   * 由于构造函数是私有的，外部无法直接通过 new 关键字创建实例，这保证了单例模式的实现。
   * 在实例创建时，调用 setupEvents 方法设置窗口相关的 IPC 事件监听，
   * 使得主进程能够响应渲染进程发出的窗口操作请求。
   */
  private constructor() {
    this._setupEvents();
    logManager.info('Window service initialized');
  }
  /**
   * 判断窗口是否应该被关闭，根据窗口名称和配置进行判断。
   * @param winName 窗口名称
   * @returns 如果窗口应该被关闭，返回 true；否则返回 false。
   */
  private _isReallyClose(winName: WindowNames | void) {
    if (winName === WINDOW_NAMES.MAIN) return configManager.get(CONFIG_KEYS.MINIMIZE_TO_TRAY) === false;
    if (winName === WINDOW_NAMES.SETTING) return false;

    return true;
  }
  /**
   * 设置窗口相关的 IPC 事件监听器，用于处理来自渲染进程的窗口操作请求。
   * @private
   */
  private _setupEvents() {
    const handleCloseWindow = (e: IpcMainEvent) => {
      const target = BrowserWindow.fromWebContents(e.sender);
      const winName = this.getName(target);
      this.close(target, this._isReallyClose(winName));
    }
    const handleMinimizeWindow = (e: IpcMainEvent) => {
      BrowserWindow.fromWebContents(e.sender)?.minimize();
    }
    const handleMaximizeWindow = (e: IpcMainEvent) => {
      this.toggleMax(BrowserWindow.fromWebContents(e.sender));
    }
    const handleIsWindowMaximized = (e: IpcMainInvokeEvent) => {
      return BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false;
    }

    // 监听关闭窗口的 IPC 事件
    ipcMain.on(IPC_EVENTS.CLOSE_WINDOW, handleCloseWindow);
    // 监听最小化窗口的 IPC 事件
    ipcMain.on(IPC_EVENTS.MINIMIZE_WINDOW, handleMinimizeWindow);
    // 监听最大化窗口的 IPC 事件
    ipcMain.on(IPC_EVENTS.MAXIMIZE_WINDOW, handleMaximizeWindow);
    // 监听获取窗口是否已最大化的 IPC 事件
    ipcMain.handle(IPC_EVENTS.IS_WINDOW_MAXIMIZED, handleIsWindowMaximized);

  }

  /**
   * 获取 WindowManager 类的单例实例。
   * 若实例尚未创建，则调用私有构造函数创建一个新实例；
   * 若实例已存在，则直接返回该实例。
   * 此方法确保在整个应用程序生命周期中，WindowManager 类仅有一个实例。
   * 
   * @returns WindowService 类的单例实例
   */
  public static getInstance(): WindowService {
    if (!this._instance)
      this._instance = new WindowService();
    return this._instance;
  }

  /**
   * 加载窗口对应的 HTML 模板文件。
   * 根据当前是否处于开发环境，选择不同的加载方式。
   * 在开发环境下，从开发服务器加载模板；在生产环境下，从本地文件系统加载模板。
   * @param window 要加载模板的浏览器窗口实例
   * @param name 窗口的名称，用于确定加载哪个 HTML 模板
   * @private
   */
  private _loadWindowTemplate(window: BrowserWindow, name: WindowNames) {
    // 检查是否存在开发服务器 URL，若存在则表示处于开发环境
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      return window.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}${'/html/' + (name === 'main' ? '' : name)}`);
    }
    window.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/html/${name === 'main' ? 'index' : name}.html`));
  }

  /**
   * 生成窗口打开动画配置对象
   * 根据是否存在父窗口，计算窗口打开动画的起始和目标位置及透明度，
   * 最后调用 createAnimator 函数创建动画对象。
   * @param genOpts 包含窗口、父窗口、尺寸和动画时长的配置对象
   * @param genOpts.window 要执行打开动画的浏览器窗口实例
   * @param genOpts.parent 父窗口实例，可选
   * @param genOpts.size 窗口的尺寸配置
   * @param genOpts.duration 动画持续时间（毫秒）
   * @returns 包含动画配置的动画对象
   * @private
   */
  private _genOpenWinAnimate({ window, parent, size, duration }: {
    window: BrowserWindow;
    parent: BrowserWindow | BaseWindow | void;
    size: SizeOptions;
    duration: number;
  }) {
    let startBounds,
      targetBounds,
      startOpacity = 0,
      targetOpacity = 1;

    let centerX: number,
      centerY: number;

    // 如果存在父窗口，以父窗口中心为动画中心点
    if (parent) {
      const parentBounds = parent?.getBounds();
      centerX = parentBounds.x + parentBounds.width / 2;
      centerY = parentBounds.y + parentBounds.height / 2;
    } else {
      // 若不存在父窗口，以屏幕中心为动画中心点
      const screenCenter = this._getScreenCenter();
      centerX = screenCenter.x;
      centerY = screenCenter.y;
    }
    startBounds = {
      x: centerX - size.width / 8,
      y: centerY - size.height / 8,
      width: size.width / 4,
      height: size.height / 4,
    };
    targetBounds = {
      x: centerX - size.width / 2,
      y: centerY - size.height / 2,
      width: size.width,
      height: size.height,
    };

    return createAnimator({
      window,
      startBounds,
      startOpacity,
      targetBounds,
      targetOpacity,
      duration
    });
  }

  /**
   * 获取主显示屏的中心点坐标。
   * 该方法会先获取主显示屏的信息，然后根据显示屏的边界信息计算出中心点的坐标。
   * @returns 包含主显示屏中心点 x 和 y 坐标的对象。
   * @private
   */
  private _getScreenCenter() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height, x: _x, y: _y } = primaryDisplay.bounds;

    const x = _x + width / 2;
    const y = _y + height / 2;

    return { x, y };
  }

  /**
   * 为指定窗口添加加载视图，在窗口内容加载时显示加载界面。
   * 当窗口渲染器准备好后，移除加载视图。
   * @param window 要添加加载视图的浏览器窗口实例
   * @param size 窗口的尺寸配置，用于设置加载视图的大小
   * @returns 一个函数，接受一个回调函数作为参数，在加载视图的 DOM 准备好后执行该回调
   */
  private _addLoadingView(window: BrowserWindow, size: SizeOptions) {
    let loadingView: WebContentsView | void = new WebContentsView();
    let rendererIsReady = false;

    window.contentView.addChildView(loadingView);
    loadingView.setBounds({ x: 0, y: 0, width: size.width, height: size.height });
    loadingView.webContents.loadFile(path.join(__dirname, 'loading.html'));

    /**
     * 处理渲染器准备好的事件
     * @param e IPC 主进程事件对象
     */
    const onRendererIsReady = (e: IpcMainEvent) => {
      // 如果事件发送者不是当前窗口的 webContents 或者渲染器已经准备好，则直接返回
      if ((e.sender !== window?.webContents) || rendererIsReady) return
      rendererIsReady = true
      window.contentView.removeChildView(loadingView as WebContentsView)
      ipcMain.removeListener(IPC_EVENTS.RENDERER_IS_READY, onRendererIsReady);
      loadingView = void 0;
    }
    ipcMain.on(IPC_EVENTS.RENDERER_IS_READY, onRendererIsReady);

    return (cb: () => void) => loadingView?.webContents.once('dom-ready', () => {
      // 当加载视图的 DOM 准备好后，插入 CSS 样式，根据主题设置背景色和渐变颜色
      loadingView?.webContents.insertCSS(`body { 
          background-color: ${themeManager.isDark ? '#2C2C2C' : '#FFFFFF'} !important; 
          --stop-color-start: ${themeManager.isDark ? '#A0A0A0' : '#7F7F7F'} !important;
          --stop-color-end: ${themeManager.isDark ? '#A0A0A0' : '#7F7F7F'} !important;
        }`);
      cb();
    });
  }

  /**
   * 创建窗口
   * @param name 窗口名称
   * @param size 窗口尺寸配置
   * @param moreOpts 窗口构造器额外选项
   * @returns 创建的窗口实例
   */
  public create(name: WindowNames, size: SizeOptions, moreOpts?: BrowserWindowConstructorOptions) {
    const isHiddenWin = this._isHiddenWin(name);
    let win = this._createWinInstance(name, moreOpts);

    !isHiddenWin && this
      ._setupWinLifecycle(win, name)
      ._loadWindowTemplate(win, name);

    const duration = name === WINDOW_NAMES.MAIN ? 800 : 600;

    const animate = this._genOpenWinAnimate({
      window: win,
      parent: moreOpts?.parent ?? this._winStates.main.instance,
      size: size,
      duration
    });

    this._listenWinReady({
      win,
      isHiddenWin,
      duration,
      animate,
      size
    });

    if (!isHiddenWin) {
      this._winStates[name].instance = win;
      logManager.info(`Window created: ${name}, size: ${size.width}x${size.height}`);
    }

    if (isHiddenWin) {
      this._winStates[name].isHidden = false;
      logManager.info(`Hidden window shown: ${name}`);
    }

    // 禁用打开开发者工具快捷键(ctrl+shift+I)
    if (app.isPackaged) {
      win.webContents.on('before-input-event', (e, input) => {
        if (!win.isFocused()) return;
        if (
          input.type === 'keyDown' &&
          input.code === 'KeyI' &&
          input.modifiers.includes('control') &&
          input.modifiers.includes('shift')
        ) e.preventDefault();
      })
    }

    return win;
  }

  /**
   * 判断指定窗口是否为隐藏窗口
   * @param name 窗口名称
   * @returns 是否为隐藏窗口
   * @private
   */
  private _isHiddenWin(name: WindowNames): boolean {
    return this._winStates[name] && this._winStates[name].isHidden;
  }

  /**
   * 初始化窗口实例
   * @param name 窗口名称
   * @param opts 窗口构造器选项
   * @returns 窗口实例
   * @private
   */
  private _createWinInstance(name: WindowNames, opts?: BrowserWindowConstructorOptions) {
    return this._isHiddenWin(name)
      ? this._winStates[name].instance as BrowserWindow
      : new BrowserWindow({
        ...SHARE_WINDOW_OPTS,
        ...opts,
      });
  }

  /**
   * 设置窗口生命周期事件
   * @param win 窗口实例
   * @param name 窗口名称
   * @private
   */
  private _setupWinLifecycle(win: BrowserWindow, name: WindowNames) {
    const updateWinStatus = debounce(() => !win?.isDestroyed()
      && win?.webContents?.send(IPC_EVENTS.WINDOW_MAXIMIZED, win?.isMaximized()), 80);
    win.once('closed', () => {
      win?.destroy();
      win?.removeListener('resize', updateWinStatus);
      this._winStates[name].instance = void 0;
      this._winStates[name].isHidden = false;
      this._checkAndCloseAllWindows();
      logManager.info(`Window closed: ${name}`);
    });
    win.on('resize', updateWinStatus);
    return this;
  }

  /**
   * 监听窗口就绪事件
   * @param params 
   * @private
   */
  private _listenWinReady(params: {
    win: BrowserWindow,
    isHiddenWin: boolean,
    duration: number,
    animate: AnimtorService,
    size: SizeOptions
  }) {
    const onReady = () => {
      params.win?.once('show', () => setTimeout(() =>
        this._applySizeConstraints(params.win, params.size), params.duration + 2));

      params.win?.show();
      params.animate.start(EasingFunctions.springEase);
    };

    if (!params.isHiddenWin) {
      const loadingHandler = this._addLoadingView(params.win, params.size);
      loadingHandler?.(onReady);
    } else {
      onReady();
    }
  }

  /**
   * 应用尺寸约束
   * @param win 窗口实例
   * @param size 尺寸配置
   * @private
   */
  private _applySizeConstraints(win: BrowserWindow, size: SizeOptions) {
    if (size.maxHeight && size.maxWidth) {
      win?.setMaximumSize(size.maxWidth, size.maxHeight);
    }
    if (size.minHeight && size.minWidth) {
      win?.setMinimumSize(size.minWidth, size.minHeight);
    }
  }

  /**
   * 聚焦窗口
   * @param target 目标窗口实例
   */
  public focus(target: BrowserWindow | void | null) {
    if (!target) return;
    const name = this.getName(target);
    if (target?.isMinimized()) {
      target?.restore();
      logManager.debug(`Window restored and focused: ${name}`);
    } else {
      logManager.debug(`Window focused: ${name}`);
    }

    target.focus();
  }

  /**
   * 关闭或隐藏指定窗口
   * @param target 目标窗口实例
   * @param really 是否真实关闭
   */
  public close(target: BrowserWindow | void | null, really: boolean = true) {
    if (!target) return;
    const name = this.getName(target);
    logManager.info(`Closing window: ${name}, really: ${really}`);
    this._prepareForCloseAnimation(target);
    this._executeCloseAnimation(target);
    this._handleCloseWindowState(target, really);
  }

  /**
   * 准备窗口动画环境
   * @param target 目标窗口实例
   * @private
   */
  private _prepareForCloseAnimation(target: BrowserWindow) {
    target.setMinimumSize(0, 0);
    target.setMaximumSize(0, 0);
  }

  /**
   * 执行窗口关闭动画
   * @param target 目标窗口实例
   * @private
   */
  private _executeCloseAnimation(target: BrowserWindow) {
    const bounds = target.getBounds();
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const closedHeight = bounds.height * 4 / 5;
    const closedWidth = bounds.width * 4 / 5;

    createAnimator({
      window: target,
      startBounds: bounds,
      startOpacity: target.getOpacity(),
      targetBounds: {
        x: centerX - closedWidth / 2,
        y: centerY - closedHeight / 2,
        width: closedWidth,
        height: closedHeight,
      },
      targetOpacity: 0,
      duration: 200,
    }).start(EasingFunctions.customBezier);
  }

  /**
   * 处理窗口状态变更
   * @param target 目标窗口实例
   * @param really 是否真实关闭
   * @private
   */
  private _handleCloseWindowState(target: BrowserWindow, really: boolean) {
    const name = this.getName(target) as WindowNames;


    if (name) {
      if (!really) this._winStates[name].isHidden = true;
      else this._winStates[name].instance = void 0;
    }

    setTimeout(() => {
      target[really ? 'close' : 'hide']?.();
      this._checkAndCloseAllWindows();
    }, 210);
  }

  /**
   * 检查并关闭所有窗口（当主窗口不存在时）
   * @private
   */
  private _checkAndCloseAllWindows() {
    if (!this._winStates[WINDOW_NAMES.MAIN].instance || this._winStates[WINDOW_NAMES.MAIN].instance?.isDestroyed())
      return Object.values(this._winStates).forEach(win => win?.instance?.close());

    const minimizeToTray = configManager.get(CONFIG_KEYS.MINIMIZE_TO_TRAY);
    if (!minimizeToTray && !this.get(WINDOW_NAMES.MAIN)?.isVisible())
      return Object.values(this._winStates).forEach(win => !win?.instance?.isVisible() && win?.instance?.close());
  }

  /**
   * 切换窗口最大化状态
   * @param target 目标窗口实例
   */
  public toggleMax(target: BrowserWindow | void | null) {
    if (!target) return;
    const name = this.getName(target);
    if (target?.isMaximized()) {
      target.restore();
      logManager.debug(`Window restored: ${name}`);
      return;
    }
    target?.maximize();
    logManager.debug(`Window maximized: ${name}`);
  }

  /**
   * 根据窗口名称获取对应的窗口实例。
   * 该方法会从内部维护的窗口记录对象中查找指定名称的窗口实例。
   * 如果存在对应的窗口实例，则返回该实例；若不存在，则返回 undefined。
   * @param name 要获取的窗口的名称，使用预定义的窗口名称枚举。
   * @returns 对应名称的窗口实例，如果不存在则返回 undefined。
   */
  public get(name: WindowNames) {
    if (this._winStates[name].isHidden) return void 0;
    return this._winStates[name].instance;
  }

  /**
   * 根据窗口实例获取对应的窗口名称。
   * 该方法会遍历内部维护的窗口记录对象，查找与传入窗口实例匹配的窗口名称。
   * 如果找到匹配的窗口实例，则返回对应的窗口名称；若未找到或传入参数为 null/undefined，则返回 undefined。
   * @param target 要查找名称的窗口实例，可为 null 或 undefined。
   * @returns 对应窗口的名称，使用预定义的窗口名称枚举；若未找到匹配项则返回 undefined。
   */
  public getName(target: BrowserWindow | null | void): WindowNames | void {
    if (!target) return
    for (const [name, win] of Object.entries(this._winStates) as [WindowNames, { instance: BrowserWindow | void } | void][]) {
      if (win?.instance === target) return name;
    }
  }
}

export const windowManager = WindowService.getInstance();

export default windowManager;
