import type { Provider } from '@common/types';
import { CONFIG_KEYS } from '@common/constants';
import { parseOpenAISetting } from '@common/utils';
import { decode } from 'js-base64';
import { configManager } from '../service/ConfigService';
import { OpenAIProvider } from './OpenAIProvider';

interface _Provider extends Omit<Provider, 'openAISetting'> {
  openAISetting?: {
    apiKey: string;
    baseURL: string;
  }
}
const _parseProvider = () => {
  let result: Provider[] = [];
  let isBase64Parsed = false;
  const providerConfig = configManager.get(CONFIG_KEYS.PROVIDER)
  const mapCallback = (item: Provider) => ({
    ...item,
    openAISetting: typeof item.openAISetting === 'string'
      ? parseOpenAISetting(item.openAISetting ?? '')
      : item.openAISetting
  }) as _Provider
  try {
    result = JSON.parse(decode(providerConfig)) as Provider[];
    isBase64Parsed = true;
  } catch (_e) {
    console.error('parse base64 provider config failed');
  }

  if (!isBase64Parsed) try {
    result = JSON.parse(providerConfig) as Provider[];
  } catch (_e) {
    console.error('parse provider config failed');
  }

  if (!result.length) return;
  return result.map(mapCallback) as _Provider[]
}

const getProviderConfig = () => {
  try {
    return _parseProvider();
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
      if (!provider.visible) {
        throw new Error(`provider ${provider.name} is disabled`);
      }
      return new OpenAIProvider(provider.openAISetting.apiKey, provider.openAISetting.baseURL);
    }
  }
}


