import type { BrowserWindow, Rectangle } from 'electron';

/**
 * 包含各种缓动函数的工具类，用于实现不同的动画缓动效果。
 */
export class EasingFunctions {
  /**
   * 专门优化初期平缓度的缓动函数。
   * 使用分段处理来精确控制动画初期的曲线，让动画有更自然的起始效果。
   * @param t 动画进度，取值范围 0 到 1，0 表示动画开始，1 表示动画结束。
   * @returns 经过缓动计算后的动画进度值。
   */
  static superSoftEase(t: number): number {
    // 使用分段处理更精确控制初期曲线
    if (t < 0.2) {
      // 前 20% 时间：极平缓开始（四次方）
      return 0.5 * Math.pow(t / 0.2, 4);
    } else if (t < 0.5) {
      // 20% - 50%：从平缓过渡到线性
      const progress = (t - 0.2) / 0.3;
      return 0.5 + 0.35 * progress;
    } else {
      // 50% - 100%：自然结束（立方缓出）
      const progress = (t - 0.5) / 0.5;
      return 0.85 + 0.15 * (1 - Math.pow(1 - progress, 3));
    }
  }

  /**
   * 自定义贝塞尔曲线缓动函数。
   * 根据给定的控制点计算贝塞尔曲线的值，实现自定义的动画缓动效果。
   * @param t 动画进度，取值范围 0 到 1，0 表示动画开始，1 表示动画结束。
   * @returns 经过贝塞尔曲线计算后的动画进度值。
   */
  static customBezier(t: number): number {
    // 控制点：(0.1, 0.0), (0.22, 0.02), (0.3, 1.0)
    const t2 = t * t; // t 的平方
    const t3 = t2 * t; // t 的立方
    const mt = 1 - t; // 1 减去 t
    const mt2 = mt * mt; // (1 - t) 的平方
    const mt3 = mt2 * mt; // (1 - t) 的立方

    return (
      0.0 * mt3 +
      3 * 0.02 * mt2 * t +
      3 * 0.1 * mt * t2 +
      1.0 * t3
    );
  }

  /**
   * 物理弹簧模拟缓动函数（无过冲），用于实现类似弹簧效果的动画过渡。
   * 该函数基于指数衰减和余弦函数模拟弹簧运动，随着时间推移，弹簧运动逐渐停止。
   * @param t 动画进度，取值范围 0 到 1，0 表示动画开始，1 表示动画结束。
   * @returns 经过弹簧缓动计算后的动画进度值。
   */
  static springEase(t: number): number {
    // 阻尼系数，控制弹簧运动衰减的速度。值越大，弹簧运动衰减越快，动画结束得越快。
    const damping = 0.8;
    // 计算带阻尼的弹簧位置。
    // Math.exp(-6 * t) 是指数衰减部分，随着时间 t 增加，值趋近于 0，模拟弹簧运动的能量损耗。
    // Math.cos(Math.PI * t / damping) 是余弦函数部分，模拟弹簧的周期性振荡。
    // 1 减去两者乘积，得到从 0 到 1 的动画进度值。
    return 1 - Math.exp(-6 * t) * Math.cos(Math.PI * t / damping);
  }
}

/**
 * AnimtorService 类是一个高性能动画控制器，用于管理 Electron 窗口的动画效果。
 * 它可以根据指定的起始和目标边界、透明度以及持续时间，实现窗口的平滑动画过渡。
 * 支持自定义缓动函数，通过线性插值计算中间值，并使用定时器实现动画循环。
 */
export class AnimtorService {
  // 存储动画定时器的 ID，用于停止动画时清除定时器，初始值为 null
  private _animationId: NodeJS.Timeout | null = null;

  /**
   * 构造函数，初始化动画所需的参数
   * @param window 要进行动画操作的 Electron 窗口实例
   * @param startBounds 动画开始时窗口的边界信息
   * @param startOpacity 动画开始时窗口的透明度
   * @param targetBounds 动画结束时窗口的边界信息
   * @param targetOpacity 动画结束时窗口的透明度
   * @param duration 动画持续的时间，单位为毫秒
   */
  constructor(
    private window: BrowserWindow,
    private startBounds: Rectangle,
    private startOpacity: number,
    private targetBounds: Rectangle,
    private targetOpacity: number,
    private duration: number
  ) { }

  /**
   * 启动动画
   * @param progressHandler 缓动函数，用于处理动画进度，默认为 SmoothProgress.superSoftEase
   */
  public start(progressHandler: (progress: number) => number = EasingFunctions.superSoftEase) {
    // 记录动画开始的时间戳
    const startTime = Date.now();

    /**
     * 动画循环函数，用于更新窗口的状态
     */
    const animate = () => {
      // 计算从动画开始到现在经过的时间
      const elapsed = Date.now() - startTime;
      // 计算当前动画进度，取值范围为 0 到 1
      const progress = Math.min(elapsed / this.duration, 1);

      // 使用传入的缓动函数处理动画进度，使动画效果更自然
      const ease = progressHandler(progress);

      // 计算当前动画状态下窗口的边界和透明度值
      const currentValues = {
        // 使用线性插值计算当前 x 坐标
        x: this._lerp(this.startBounds.x, this.targetBounds.x, ease),
        // 使用线性插值计算当前 y 坐标
        y: this._lerp(this.startBounds.y, this.targetBounds.y, ease),
        // 使用线性插值计算当前宽度
        width: this._lerp(this.startBounds.width, this.targetBounds.width, ease),
        // 使用线性插值计算当前高度
        height: this._lerp(this.startBounds.height, this.targetBounds.height, ease),
        // 使用线性插值计算当前透明度
        opacity: this._lerp(this.startOpacity, this.targetOpacity, ease)
      };

      // 若窗口未被销毁，则更新窗口的边界和透明度
      if (!this.window.isDestroyed()) {
        this.window.setBounds({
          x: Math.round(currentValues.x),
          y: Math.round(currentValues.y),
          width: Math.round(currentValues.width),
          height: Math.round(currentValues.height)
        });
        this.window.setOpacity(currentValues.opacity);
      }

      // 若动画未完成，则继续下一帧动画；否则停止动画
      if (progress < 1) {
        // 根据动态帧率计算下一次动画更新的延迟时间
        this._animationId = setTimeout(animate, this._calculateNextFrameDelay());
      } else {
        this.stop();
      }
    };

    // 启动动画，使用微秒级定时器立即执行动画循环函数
    this._animationId = setTimeout(animate, 0);
  }

  /**
   * 停止动画，并清除定时器
   */
  public stop() {
    if (!this._animationId) return;
    clearTimeout(this._animationId);
    this._animationId = null;
  }

  /**
   * 线性插值函数，用于计算两个值之间的中间值
   * @param start 起始值
   * @param end 结束值
   * @param progress 进度值，取值范围为 0 到 1
   * @returns 计算得到的中间值
   */
  private _lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  /**
   * 动态帧率计算函数，保持动画帧率为 60 FPS
   * @returns 下一次动画更新的延迟时间，单位为毫秒
   */
  private _calculateNextFrameDelay(): number {
    return 1000 / 60; // 约 16.67ms/frame
  }
}

/**
 * 定义创建动画器所需的选项接口
 */
interface AnimatorOptions {
  // 要进行动画操作的 Electron 窗口实例
  window: BrowserWindow;
  // 动画开始时窗口的边界信息
  startBounds: Electron.Rectangle;
  // 动画开始时窗口的透明度
  startOpacity: number;
  // 动画结束时窗口的边界信息
  targetBounds: Electron.Rectangle;
  // 动画结束时窗口的透明度
  targetOpacity: number;
  // 动画持续的时间，单位为毫秒
  duration: number;
}

/**
 * 创建 AnimatorManager 实例的工厂函数
 * @param options 创建动画器所需的选项
 * @returns AnimatorManager 实例
 */
export function createAnimator(options: AnimatorOptions) {
  return new AnimtorService(
    options.window,
    options.startBounds,
    options.startOpacity,
    options.targetBounds,
    options.targetOpacity,
    options.duration,
  );
}

export default createAnimator
