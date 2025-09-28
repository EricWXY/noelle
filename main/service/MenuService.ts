import { Menu, ipcMain, type MenuItemConstructorOptions } from "electron";
import { IPC_EVENTS, CONFIG_KEYS } from '@common/constants';
import { createTranslator } from '../utils';
import { cloneDeep } from '@common/utils';
import configManager from './ConfigService';
import logManager from "./LogService";

let t: ReturnType<typeof createTranslator> = createTranslator();

class MenuService {
  private static _instance: MenuService;
  private _menuTemplates: Map<string, MenuItemConstructorOptions[]> = new Map();
  private _currentMenu?: Menu = void 0;

  private constructor() {
    this._setupIpcListeners();
    this._setupLanguageChangeListener();
    logManager.info('Menu service initialized');
  }

  private _setupIpcListeners() {
    ipcMain.handle(IPC_EVENTS.SHOW_CONTEXT_MENU, (_, menuId, dynamicLabels?: string) =>
      new Promise((resolve) => this.showMenu(menuId, () => resolve(true), dynamicLabels))
    );
  }

  /**
   * 设置语言变化监听器
   * 当语言配置改变时，更新翻译函数
   */
  private _setupLanguageChangeListener() {
    configManager.onConfigChange((config) => {
      if (!config[CONFIG_KEYS.LANGUAGE]) return;

      // 更新翻译函数
      t = createTranslator();
    });
  }

  public static getInstance() {
    if (!this._instance)
      this._instance = new MenuService();
    return this._instance;
  }

  /**
   * 注册菜单模板
   * @param menuId 菜单ID
   * @param template 菜单模板
   * @returns 菜单ID
   */
  public register(menuId: string, template: MenuItemConstructorOptions[]) {
    // 只存储原始模板，不构建菜单
    this._menuTemplates.set(menuId, template);
    return menuId;
  }

  /**
   * 显示菜单
   * 在显示时构建菜单，并应用当前语言和动态参数
   * @param menuId 菜单ID
   * @param onClose 菜单关闭回调
   * @param dynamicOptions 动态参数配置，支持替换MenuItemConstructorOptions中的常用参数
   */
  public showMenu(menuId: string, onClose?: () => void, dynamicOptions?: string) {
    if (this._currentMenu) return;

    // 从模板构建菜单
    const template = cloneDeep(this._menuTemplates.get(menuId));
    if (!template) {
      logManager.warn(`Menu template ${menuId} not found`);
      onClose?.();
      return;
    }

    // 解析动态参数配置，支持字符串和对象两种格式
    let _dynamicOptions: Array<Partial<MenuItemConstructorOptions> & { id: string }> = [];
    try {
      _dynamicOptions = Array.isArray(dynamicOptions) ? dynamicOptions : JSON.parse(dynamicOptions ?? '[]');
    } catch (error) {
      logManager.error('Failed to parse dynamicOptions:', error);
    }

    const translationItem = (item: MenuItemConstructorOptions): MenuItemConstructorOptions => {
      if (item.submenu) {
        return {
          ...item,
          label: t(item?.label) ?? void 0,
          submenu: (item.submenu as MenuItemConstructorOptions[])?.map((item: MenuItemConstructorOptions) => translationItem(item)),
        }
      }
      return {
        ...item,
        label: t(item?.label) ?? void 0,
      }
    }

    // 应用当前语言构建菜单
    const localizedTemplate = template.map(item => {
      // 如果动态参数不是数组或为空，直接返回翻译后的原菜单项
      if (!Array.isArray(_dynamicOptions) || !_dynamicOptions.length) {
        return translationItem(item);
      }

      // 查找匹配的动态菜单项
      const dynamicItem = _dynamicOptions.find(_item => _item?.id === item?.id);

      if (dynamicItem) {
        const mergedItem = { ...item, ...dynamicItem };
        return translationItem(mergedItem);
      }

      // 如果菜单项有子菜单，处理子菜单
      if (item.submenu) {
        return translationItem({
          ...item,
          submenu: (item.submenu as MenuItemConstructorOptions[])?.map((__item: MenuItemConstructorOptions) => {
            const dynamicItem = _dynamicOptions.find(_item => _item?.id === __item?.id);
            return { ...__item, ...dynamicItem };
          }),
        });
      }

      return translationItem(item);
    });

    const menu = Menu.buildFromTemplate(localizedTemplate);

    this._currentMenu = menu;

    menu.popup({
      callback: () => {
        this._currentMenu = void 0;
        onClose?.();
      }
    })
  }

  /**
   * 销毁指定菜单模板
   * @param menuId 菜单ID
   */
  public destroyMenu(menuId: string) {
    this._menuTemplates.delete(menuId);
  }

  /**
   * 销毁所有菜单模板
   */
  public destroy() {
    this._menuTemplates.clear();
    this._currentMenu = void 0;
  }
}

export const menuManager = MenuService.getInstance();
export default menuManager;
