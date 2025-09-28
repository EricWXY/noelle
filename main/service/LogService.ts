import { promisify } from 'util';
import { app } from 'electron';
import log from 'electron-log';
import * as path from 'path';
import * as fs from 'fs';

// 转换为Promise形式的fs方法
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);
const unlinkAsync = promisify(fs.unlink);
// const mkdirAsync = promisify(fs.mkdir);

/**
 * 日志服务类，用于管理应用程序的日志记录功能
 * 采用单例模式确保全局只有一个日志服务实例
 */
export class LogService {
  private static _instance: LogService;

  // 日志保留天数，默认7天
  private LOG_RETENTION_DAYS = 7;

  // 清理间隔，默认24小时（毫秒）
  private readonly CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

  /**
   * 私有构造函数，初始化日志服务
   * 配置日志的存储位置、格式和级别
   */
  private constructor() {
    // 配置日志文件的存储路径
    const logPath = path.join(app.getPath('userData'), 'logs');

    // 确保日志目录存在
    try {
      if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }

    // 配置electron-log
    log.transports.file.resolvePathFn = () => {
      // 使用当前日期作为日志文件名，格式为 YYYY-MM-DD.log
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      return path.join(logPath, `${formattedDate}.log`);
    };

    // 配置日志格式
    log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

    // 配置日志文件大小限制，默认10MB
    log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB

    // 配置控制台日志级别，开发环境可以设置为debug，生产环境可以设置为info
    log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

    // 配置文件日志级别
    log.transports.file.level = 'debug';

    // 初始化成功日志
    this.info('LogService initialized successfully');

    // 立即执行一次日志清理
    this._cleanupOldLogs();

    // 设置定期清理任务
    setInterval(() => {
      this._cleanupOldLogs();
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * 清理过期的日志文件
   * @private
   */
  private async _cleanupOldLogs(): Promise<void> {
    try {
      const logPath = path.join(app.getPath('userData'), 'logs');

      // 检查日志目录是否存在
      if (!fs.existsSync(logPath)) {
        return;
      }

      // 计算过期时间（当前时间减去保留天数）
      const now = new Date();
      const expirationDate = new Date(now.getTime() - this.LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);

      // 读取日志目录下的所有文件
      const files = await readdirAsync(logPath);

      let deletedCount = 0;

      // 遍历文件并删除过期的日志文件
      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(logPath, file);

          try {
            const stats = await statAsync(filePath);

            // 如果文件修改时间早于过期时间，则删除
            if (stats.mtime < expirationDate) {
              await unlinkAsync(filePath);
              deletedCount++;
            }
          } catch (error) {
            console.error(`Failed to process log file ${file}:`, error);
          }
        }
      }

      if (deletedCount > 0) {
        this.info(`Cleaned up ${deletedCount} old log files`);
      }
    } catch (error) {
      this.error('Error during log cleanup:', error);
    }
  }

  /**
   * 设置日志保留天数
   * @param {number} days - 保留天数
   */
  public setLogRetentionDays(days: number): void {
    if (days > 0) {
      this.LOG_RETENTION_DAYS = days;
      this.info(`Log retention period set to ${days} days`);
    }
  }

  /**
   * 获取当前日志保留天数
   * @returns {number} 保留天数
   */
  public getLogRetentionDays(): number {
    return this.LOG_RETENTION_DAYS;
  }

  /**
   * 获取日志服务的单例实例
   * @returns {LogService} 日志服务实例
   */
  public static getInstance(): LogService {
    if (!LogService._instance) {
      LogService._instance = new LogService();
    }
    return LogService._instance;
  }

  /**
   * 记录调试信息
   * @param {string} message - 日志消息
   * @param {any[]} meta - 附加的元数据
   */
  public debug(message: string, ...meta: any[]): void {
    log.debug(message, ...meta);
  }

  /**
   * 记录一般信息
   * @param {string} message - 日志消息
   * @param {any[]} meta - 附加的元数据
   */
  public info(message: string, ...meta: any[]): void {
    log.info(message, ...meta);
  }

  /**
   * 记录警告信息
   * @param {string} message - 日志消息
   * @param {any[]} meta - 附加的元数据
   */
  public warn(message: string, ...meta: any[]): void {
    log.warn(message, ...meta);
  }

  /**
   * 记录错误信息
   * @param {string} message - 日志消息
   * @param {any[]} meta - 附加的元数据，通常是错误对象
   */
  public error(message: string, ...meta: any[]): void {
    log.error(message, ...meta);
  }

  /**
   * 记录致命错误信息
   * @param {string} message - 日志消息
   * @param {any[]} meta - 附加的元数据，通常是错误对象
   */
  public fatal(message: string, ...meta: any[]): void {
    log.error('[FATAL] ' + message, ...meta);
  }

  /**
   * 记录API请求日志
   * @param {string} endpoint - API端点
   * @param {any} data - 请求数据
   * @param {string} method - HTTP方法
   */
  public logApiRequest(endpoint: string, data: any = {}, method: string = 'GET'): void {
    this.debug(`API Request [${method}]: ${endpoint}`, JSON.stringify(data));
  }

  /**
   * 记录API响应日志
   * @param {string} endpoint - API端点
   * @param {any} response - 响应数据
   * @param {number} statusCode - HTTP状态码
   * @param {number} responseTime - 响应时间（毫秒）
   */
  public logApiResponse(endpoint: string, response: any = {}, statusCode: number = 200, responseTime: number = 0): void {
    if (statusCode >= 400) {
      this.error(`API Response [${statusCode}]: ${endpoint} (${responseTime}ms)`, JSON.stringify(response));
    } else {
      this.debug(`API Response [${statusCode}]: ${endpoint} (${responseTime}ms)`, JSON.stringify(response));
    }
  }

  /**
   * 记录用户操作日志
   * @param {string} operation - 操作名称
   * @param {string} userId - 用户ID（可选）
   * @param {any} details - 操作详情（可选）
   */
  public logUserOperation(operation: string, userId: string = 'unknown', details: any = {}): void {
    this.info(`User Operation: ${operation} by ${userId}`, JSON.stringify(details));
  }

  /**
   * 获取日志文件的存储路径
   * @returns {string} 日志文件路径
   */
  public getLogPath(): string {
    return log.transports.file.getFile().path;
  }
}

// 导出日志服务的单例实例
export const logManager = LogService.getInstance();
export default logManager;
