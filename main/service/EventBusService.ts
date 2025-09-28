import { IPC_EVENTS } from '@common/constants';
import logManager from "./LogService";
import { ipcMain } from 'electron';


/**
 * 事件总线服务类，用于管理应用程序中的自定义事件通信
 * 采用单例模式确保全局只有一个事件总线实例
 */
export class EventBusService {
  // 静态属性，存储 EventBusService 类的单例实例
  private static _instance: EventBusService;

  // 存储所有事件监听器的映射表
  private _events: Map<string, Array<Function>> = new Map();

  /**
   * 私有构造函数，初始化事件总线服务
   * 由于构造函数是私有的，外部无法直接通过 new 关键字创建实例
   */
  private constructor() {
    this._setupIpcListeners();
    // 初始化事件总线
    logManager.info('Event bus service initialized');
  }

  private _setupIpcListeners() {
    ipcMain.on(IPC_EVENTS.EVENT_BUS_EMIT, (_event, eventName, ...args) => {
      this.emit(eventName, ...args);
    });
    ipcMain.on(IPC_EVENTS.EVENT_BUS_ON, (e, eventName, id) => {
      const cb = (...args: any[]) => {
        e.sender.send(IPC_EVENTS.EVENT_BUS_ON + 'back' + id, ...args);
      }
      this.on(eventName, cb);
      ipcMain.once(IPC_EVENTS.EVENT_BUS_ON + 'off' + id, () => this.off(eventName, cb))
    });

    ipcMain.on(IPC_EVENTS.EVENT_BUS_ONCE, (e, eventName, id) => {
      this.once(eventName, (...args: any[]) => {
        e.sender.send(IPC_EVENTS.EVENT_BUS_ONCE + 'back' + id, ...args);
      });
    });
  }

  /**
   * 获取 EventBusService 类的单例实例
   * @returns EventBusService 类的单例实例
   */
  public static getInstance(): EventBusService {
    if (!EventBusService._instance) {
      EventBusService._instance = new EventBusService();
    }
    return EventBusService._instance;
  }

  /**
   * 注册事件监听器
   * @param eventName 事件名称
   * @param listener 监听器函数
   * @returns 用于移除监听器的函数
   */
  public on(eventName: string, listener: Function): () => void {
    if (!this._events.has(eventName)) {
      this._events.set(eventName, []);
    }

    const listeners = this._events.get(eventName)!;
    listeners.push(listener);
    this.info(`Event '${eventName}' listener added`);
    // 返回移除监听器的函数
    return () => this.off(eventName, listener);
  }

  /**
   * 注册一次性事件监听器（触发一次后自动移除）
   * @param eventName 事件名称
   * @param listener 监听器函数
   * @returns 用于移除监听器的函数
   */
  public once(eventName: string, listener: Function): () => void {
    const onceListener = (...args: any[]) => {
      this.off(eventName, onceListener);
      listener.apply(this, args);
    };
    this.info(`Event '${eventName}' once listener added`);
    return this.on(eventName, onceListener);
  }

  /**
   * 触发事件
   * @param eventName 事件名称
   * @param args 传递给监听器的参数
   * @returns 是否成功触发了事件（是否有监听器）
   */
  public emit(eventName: string, ...args: any[]): boolean {
    const listeners = this._events.get(eventName);

    if (!listeners || listeners.length === 0) {
      return false;
    }

    // 复制监听器数组，避免在触发过程中添加/删除监听器导致的问题
    const listenersCopy = [...listeners];

    // 触发所有监听器
    for (const listener of listenersCopy) {
      try {
        listener.apply(this, args);
      } catch (error) {
        this.error(`Error in event listener for '${eventName}':`, error);
      }
    }
    this.info(`Event '${eventName}' emitted with ${args.length} arguments`);
    return true;
  }

  /**
   * 移除特定事件的特定监听器
   * @param eventName 事件名称
   * @param listener 要移除的监听器函数
   * @returns 是否成功移除了监听器
   */
  public off(eventName: string, listener: Function): boolean {
    const listeners = this._events.get(eventName);

    if (!listeners) {
      return false;
    }

    const index = listeners.indexOf(listener);
    if (index === -1) {
      return false;
    }

    listeners.splice(index, 1);

    // 如果没有监听器了，清理事件
    if (listeners.length === 0) {
      this._events.delete(eventName);
    }

    this.info(`Event '${eventName}' listener removed`);

    return true;
  }

  /**
   * 移除特定事件的所有监听器
   * @param eventName 事件名称
   * @returns 是否成功移除了监听器
   */
  public removeAllListeners(eventName?: string): boolean {
    if (eventName) {
      this._events.delete(eventName);
      this.info(`All listeners for event '${eventName}' removed`);
      return true
    } else {
      this._events.clear();
      this.info(`All listeners for all events removed`);
      return true;
    }
  }

  /**
   * 获取特定事件的监听器数量
   * @param eventName 事件名称
   * @returns 监听器数量
   */
  public getListenerCount(eventName: string): number {
    const listeners = this._events.get(eventName);
    return listeners ? listeners.length : 0;
  }

  /**
   * 获取所有注册的事件名称
   * @returns 事件名称数组
   */
  public getEventNames(): string[] {
    return Array.from(this._events.keys());
  }

  /**
   * 内部方法：记录信息日志
   * @param message 日志消息
   * @param meta 附加的元数据
   * @private
   */
  private info(message: string, ...meta: any[]): void {
    logManager.info(`[EventBus] ${message}`, ...meta);
  }

  /**
   * 内部方法：记录错误日志
   * @param message 日志消息
   * @param meta 附加的元数据
   * @private
   */
  private error(message: string, ...meta: any[]): void {
    // 在实际环境中，可以使用已有的日志服务
    logManager.error(`[EventBus] ${message}`, ...meta);
  }
}

// 导出事件总线服务的单例实例
export const eventBus = EventBusService.getInstance();
export default eventBus;
