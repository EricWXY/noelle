import type { Provider } from '@common/types';
import { configManager } from '../service/ConfigService';
import { CONFIG_KEYS } from '@common/constants'
import { OpenAIProvider } from './OpenAIProvider';

const getProviderConfig = () => {
  try {
    return JSON.parse(configManager.get(CONFIG_KEYS.PROVIDER)) as Provider[];
  } catch (e) {
    console.error('get provider config failed', e);
    return null;
  }
}

export function createProvider(name: string) {

  const providers = getProviderConfig();

  if (!providers) {
    throw new Error('provider config not found');
  }

  for (const provider of providers) {
    if (provider.name === name) {
      if (!provider.openAISetting?.apiKey || !provider.openAISetting?.baseURL) {
        throw new Error('apiKey or baseURL not found');
      }
      return new OpenAIProvider(provider.openAISetting.apiKey, provider.openAISetting.baseURL)
    }
  }
}


