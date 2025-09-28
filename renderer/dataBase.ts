import type { Provider, Conversation, Message } from '@common/types';
import { stringifyOpenAISetting } from '@common/utils';
import { logger } from './utils/logger';
import Dexie, { type EntityTable } from 'dexie';

export const providers: Provider[] = [
  {
    id: 1,
    name: 'bigmodel',
    title: '智谱AI',
    models: ['glm-4.5-flash'],
    openAISetting: stringifyOpenAISetting({
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
      apiKey: '',
    }),
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime()
  },
  {
    id: 2,
    name: 'deepseek',
    title: '深度求索 (DeepSeek)',
    models: ['deepseek-chat'],
    openAISetting: stringifyOpenAISetting({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: '',
    }),
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime()
  },
  {
    id: 3,
    name: 'siliconflow',
    title: '硅基流动',
    models: ['Qwen/Qwen3-8B', 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B'],
    openAISetting: stringifyOpenAISetting({
      baseURL: 'https://api.siliconflow.cn/v1',
      apiKey: '',
    }),
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime()
  },
  {
    id: 4,
    name: 'qianfan',
    title: '百度千帆',
    models: ['ernie-speed-128k', 'ernie-4.0-8k', 'ernie-3.5-8k'],
    openAISetting: stringifyOpenAISetting({
      baseURL: 'https://qianfan.baidubce.com/v2',
      apiKey: '',
    }),
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime()
  },
];


export const dataBase = new Dexie('noel') as Dexie & {
  providers: EntityTable<Provider, 'id'>;
  conversations: EntityTable<Conversation, 'id'>;
  messages: EntityTable<Message, 'id'>;
}

// 版本 1 - 初始版本
// dataBase.version(1).stores({
//   providers: '++id,name',
//   conversations: '++id,providerId,pinned',
//   messages: '++id,conversationId'
// });
// 版本 2 - 修改时间字段类型从 string 到 number (时间戳)
// 版本 3 - 修改 OpenAISetting 字段类型 为 base64 字符串
dataBase.version(3).stores({
  providers: '++id,name',
  conversations: '++id,providerId,pinned',
  messages: '++id,conversationId'
})

export async function initProviders() {
  const count = await dataBase.providers.count();
  if (count === 0) {
    await dataBase.providers.bulkAdd(providers);
    logger.info('providers data initialized');
  }
}
