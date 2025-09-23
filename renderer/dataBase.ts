import type { Provider, Conversation, Message } from '@common/types';
import Dexie, { type EntityTable } from 'dexie';

export const providers: Provider[] = [
  {
    id: 1,
    name: 'bigmodel',
    title: '智谱AI',
    models: ['glm-4.5-flash'],
    openAISetting: {
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
      apiKey: '',
    },
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime()
  },
  {
    id: 2,
    name: 'deepseek',
    title: '深度求索 (DeepSeek)',
    models: ['deepseek-chat'],
    openAISetting: {
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: '',
    },
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime()
  },
  {
    id: 3,
    name: 'siliconflow',
    title: '硅基流动',
    models: ['Qwen/Qwen3-8B', 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B'],
    openAISetting: {
      baseURL: 'https://api.siliconflow.cn/v1',
      apiKey: '',
    },
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime()
  },
  {
    id: 4,
    name: 'qianfan',
    title: '百度千帆',
    models: ['ernie-speed-128k', 'ernie-4.0-8k', 'ernie-3.5-8k'],
    openAISetting: {
      baseURL: 'https://qianfan.baidubce.com/v2',
      apiKey: '',
    },
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
dataBase.version(2).stores({
  providers: '++id,name',
  conversations: '++id,providerId,pinned',
  messages: '++id,conversationId'
}).upgrade(async (tx) => {
  // 迁移 providers 表中的时间字段
  const providers = await tx.table('providers').toArray();
  for (const provider of providers) {
    if (typeof provider.createdAt === 'string') {
      provider.createdAt = new Date(provider.createdAt).getTime();
    }
    if (typeof provider.updatedAt === 'string') {
      provider.updatedAt = new Date(provider.updatedAt).getTime();
    }
    await tx.table('providers').put(provider);
  }

  // 迁移 conversations 表中的时间字段
  const conversations = await tx.table('conversations').toArray();
  for (const conversation of conversations) {
    if (typeof conversation.createdAt === 'string') {
      conversation.createdAt = new Date(conversation.createdAt).getTime();
    }
    if (typeof conversation.updatedAt === 'string') {
      conversation.updatedAt = new Date(conversation.updatedAt).getTime();
    }
    await tx.table('conversations').put(conversation);
  }

  // 迁移 messages 表中的时间字段
  const messages = await tx.table('messages').toArray();
  for (const message of messages) {
    if (typeof message.createdAt === 'string') {
      message.createdAt = new Date(message.createdAt).getTime();
    }
    if (message.updatedAt && typeof message.updatedAt === 'string') {
      message.updatedAt = new Date(message.updatedAt).getTime();
    }
    await tx.table('messages').put(message);
  }
});

export async function initProviders() {
  const count = await dataBase.providers.count();
  if (count === 0) {
    await dataBase.providers.bulkAdd(providers);
  }
}
