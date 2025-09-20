import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Provider } from '../types';
import { dataBase } from '../dataBase';

/**
 * Providers Store - 管理 providers 数据的响应式状态（组合式API）
 */
export const useProvidersStore = defineStore('providers', () => {
  // 状态定义（替代选项式API的state）
  const providers = ref<Provider[]>([]);

  // 计算属性（替代选项式API的getters）
  const allProviders = computed(() => providers.value);


  // 方法定义
  /**
   * 初始化 providers 数据
   */
  async function initialize() {
    providers.value = await dataBase.providers.toArray();
  };


  // 暴露给外部的属性和方法
  return {
    // 状态
    providers,

    // 计算属性
    allProviders,

    // 方法
    initialize,
  };
});
