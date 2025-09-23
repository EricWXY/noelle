import type { Provider } from '@common/types';
import { defineStore } from 'pinia';
import { deepMerge } from '@common/utils';
import { dataBase } from '../dataBase';
import { useConfig } from '@renderer/hooks/useConfig';

/**
 * Providers Store - 管理 providers 数据的响应式状态（组合式API）
 */
export const useProvidersStore = defineStore('providers', () => {
  // 状态定义（替代选项式API的state）
  const providers = ref<Provider[]>([]);

  // 计算属性（替代选项式API的getters）
  const allProviders = computed(() => providers.value);

  const config = useConfig();

  // 方法定义
  /**
   * 初始化 providers 数据
   */
  async function initialize() {
    providers.value = await dataBase.providers.toArray();
  };

  /**
   * 更新 providers 数据
   * @param provider - 要更新的 provider 对象
   */
  async function updateProvider(id: number, provider: Partial<Provider>) {
    await dataBase.providers.update(id, { ...provider });
    providers.value = providers.value.map(item => item.id === id ? { ...deepMerge(item, provider) as Provider } : item);
    // 刷新 providers 数据
    config.provider = JSON.stringify(providers.value);
  }

  watch(() => config.provider, () => initialize())

  // 暴露给外部的属性和方法
  return {
    // 状态
    providers,

    // 计算属性
    allProviders,

    // 方法
    initialize,
    updateProvider
  };
});
