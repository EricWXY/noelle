import Dexie, { type EntityTable } from 'dexie';
import type { Provider, Conversation, Message } from './types';
// import { providers } from './testData';


export const providers: Provider[] = [
  {
    id: 1,
    name: 'qianfan',
    title: '百度千帆',
    description: '百度千帆大模型平台，提供文心一言系列大模型服务，支持多场景智能交互、内容生成与知识问答。',
    models: ['ERNIE-4.0-8K', 'ERNIE-3.5-8K', 'ERNIE-Speed-128K'],
    avatar: 'https://aip-static.cdn.bcebos.com/landing/product/ernie-bote321e5.png',
    createdAt: new Date('2023-03-01').getTime(),
    updatedAt: new Date('2024-07-15').getTime()
  },
  {
    id: 2,
    name: 'dashscope',
    title: '阿里灵积',
    description: '阿里云灵积平台，提供通义千问系列大模型服务，具备强大的中文理解能力和多模态生成能力。',
    // https://help.aliyun.com/zh/dashscope/developer-reference/api-details?spm=a2c4g.11186623.0.0.5bf41507xgULX5#b148acc634pfc
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-vl-plus'],
    avatar: 'https://qph.cf2.poecdn.net/main-thumb-pb-4160791-200-qlqunomdvkyitpedtghnhsgjlutapgfl.jpeg',
    createdAt: new Date('2023-04-15').getTime(),
    updatedAt: new Date('2024-06-20').getTime()
  },
  {
    id: 3,
    name: 'deepseek',
    title: '深度求索 (DeepSeek)',
    description: '深度求索提供的大模型服务，专注于代码和数学推理，在技术领域有独特优势。',
    // https://api-docs.deepseek.com/zh-cn/
    models: ['deepseek-chat'],
    avatar: 'https://qph.cf2.poecdn.net/main-thumb-pb-4981273-200-phhqenmywlkiybehuaqvsxpfekviajex.jpeg',
    createdAt: new Date('2023-06-10').getTime(),
    updatedAt: new Date('2024-12-27').getTime()
  }
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
