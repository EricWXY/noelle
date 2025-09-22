import type { Message, MessageStatus } from '../types';
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { dataBase } from '../dataBase';
import { listenDialogueBack } from '../utils/dialogue'
import { useConversationsStore } from './conversations'
import { useProvidersStore } from './providers'
import { cloneDeep } from '@common/utils';

const msgContentMap = new Map<number, string>();
export const stopMethods = new Map<number, () => void>();

/**
 * Messages Store - 管理 messages 数据的响应式状态
 */
export const useMessagesStore = defineStore('messages', () => {
  const conversationsStore = useConversationsStore();
  const providersStore = useProvidersStore();
  // 状态
  const messages = ref<Message[]>([]);

  // Getters
  const allMessages = computed(() => messages.value);

  const messagesByConversationId = computed(() => {
    return (conversationId: number) => {
      return messages.value
        .filter(message => message.conversationId === conversationId)
        .sort((a, b) => a.createdAt - b.createdAt);
    };
  });

  const loadingMsgIdsByConversationId = computed(() => {
    return (conversationId: number) => {
      return messagesByConversationId.value(conversationId).filter(message => message.status === 'loading' || message.status === 'streaming').map(message => message.id)
    };
  });

  // Actions
  /**
   * 初始化 messages 数据
   * @param conversationId 可选，指定要加载的对话 ID
   */
  async function initialize(conversationId?: number) {
    if (conversationId) {
      // 只加载特定对话的消息
      messages.value = await dataBase.messages
        .where({ conversationId }).toArray()
    } else {
      // 加载所有消息
      messages.value = await dataBase.messages.toArray();
    }
  };

  /**
   * 更新对话的 updatedAt 字段
   */
  const _updateConversation = async (conversationId: number) => {
    const conversation = await dataBase.conversations.get(conversationId);
    conversation && conversationsStore.updateConversation(conversation);
  }

  /**
   * 添加新的 message
   */
  async function addMessage(message: Omit<Message, 'id' | 'createdAt'>) {
    const newMessage = {
      ...message,
      createdAt: Date.now(), // 添加当前时间戳
    } as Message;
    const id = await dataBase.messages.add(newMessage);
    _updateConversation(newMessage.conversationId);
    messages.value.push({ ...newMessage, id }); // 将新消息添加到响应式数组中
    return id
  };

  async function sendMessage(message: Omit<Message, 'id' | 'createdAt'>) {
    await addMessage(message);
    const loadingMsgId = await addMessage({
      conversationId: message.conversationId,
      type: 'answer',
      content: '',
      status: 'loading',
    })
    // message
    const conversation = conversationsStore.getConversationById(message.conversationId)
    if (!conversation) return loadingMsgId;

    const provider = providersStore.allProviders.find(p => p.id === conversation.providerId)

    if (!provider) return loadingMsgId;

    msgContentMap.set(loadingMsgId, '')
    let streamCallback: ((stream: DialogueBackStream) => Promise<void>) | void = async (stream) => {

      const { messageId, data } = stream;
      const getStatus = (data: DialogueBackStream['data']): MessageStatus => {
        if (data.isError) return 'error';
        if (data.isEnd) return 'success';
        return 'streaming';
      }
      msgContentMap.set(messageId, msgContentMap.get(messageId) + data.result);

      const _update = {
        content: msgContentMap.get(messageId) || '',
        status: getStatus(data),
        updatedAt: Date.now(),
      } as Message;
      await nextTick();
      updateMessage(messageId, _update);
      if (data.isEnd) {
        msgContentMap.delete(messageId);
        streamCallback = void 0;
      }
    }
    stopMethods.set(loadingMsgId, listenDialogueBack(streamCallback));
    const messages = messagesByConversationId.value(message.conversationId).filter(item => item.status !== 'loading').map(item => ({
      role: item.type === 'question' ? 'user' : 'assistant' as DialogueMessageRole,
      content: item.content,
    }))
    await window.api.startADialogue({
      messageId: loadingMsgId,
      providerName: provider.name,
      selectedModel: conversation.selectedModel,
      conversationId: message.conversationId,
      messages
    })

    return loadingMsgId;
  }

  async function stopMessage(id: number, update: boolean = true) {
    const stop = stopMethods.get(id);
    stop?.();
    if (update) {
      await updateMessage(id, { status: 'success', updatedAt: Date.now() })
    }
    stopMethods.delete(id);
  }

  async function updateMessage(id: number, updates: Partial<Message>) {
    let currentMsg = cloneDeep(messages.value.find(item => item.id === id));
    await dataBase.messages.update(id, { ...currentMsg, ...updates })

    messages.value = messages.value.map(item => item.id === id ? { ...item, ...updates } : item)
  }
  /**
   * 删除 message
   */
  async function deleteMessage(id: number) {
    let currentMsg = cloneDeep(messages.value.find(item => item.id === id));
    stopMessage(id, false);
    await dataBase.messages.delete(id);
    currentMsg && _updateConversation(currentMsg.conversationId);
    // 从响应式数组中移除
    messages.value = messages.value.filter(message => message.id !== id);
    currentMsg = void 0;
  };

  // 返回状态、计算属性和方法
  return {
    // 状态
    messages,

    // 计算属性
    allMessages,
    messagesByConversationId,
    loadingMsgIdsByConversationId,

    // 方法
    initialize,
    addMessage,
    deleteMessage,
    sendMessage,
    stopMessage,
  };
});
