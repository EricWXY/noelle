import type { IProviderConfig } from '@common/types'
import { configManager } from '../service/ConfigService'
import { CONFIG_KEYS } from '@common/constants'
import { QianfanProvider } from './QianfanProvider';
import { BaseProvider } from './BaseProvider';
import { OpenAIProvider } from './OpenAIProvider';

// const config = configManager.
const getProviderConfig = () => JSON.parse(configManager.get(CONFIG_KEYS.PROVIDER)) as IProviderConfig

const actionsPolicy = new Map<string, () => BaseProvider>([
  ['qianfan', () => {
    const providerConfig = getProviderConfig();
    if (!providerConfig?.qianfan?.accessKey || !providerConfig?.qianfan?.secretKey) {
      throw new Error('qianfan accessKey or secretKey not found');
    }
    return new QianfanProvider(providerConfig.qianfan.accessKey, providerConfig.qianfan.secretKey)
  }],
  ['dashscope', () => {
    const providerConfig = getProviderConfig();
    if (!providerConfig?.dashscope?.apiKey || !providerConfig?.dashscope?.baseUrl) {
      throw new Error('dashscope accessKey or secretKey not found');
    }
    return new OpenAIProvider(providerConfig.dashscope.apiKey, providerConfig.dashscope.baseUrl)
  }],
  ['deepseek', () => {
    const providerConfig = getProviderConfig();
    if (!providerConfig?.deepseek?.apiKey || !providerConfig?.deepseek?.baseUrl) {
      throw new Error('deepseek apiKey or baseUrl not found');
    }
    return new OpenAIProvider(providerConfig.deepseek.apiKey, providerConfig.deepseek.baseUrl)
  }]
])

export function createProvider(name: string): BaseProvider {
  const action = actionsPolicy.get(name)

  if (!action) {
    throw new Error(`provider ${name} not found`);
  }
  return action();
}

