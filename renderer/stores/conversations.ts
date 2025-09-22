import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { debounce } from '@common/utils'
import type { Conversation } from '../types';
import { dataBase } from '../dataBase';

type SortBy = 'updatedAt' | 'createAt' | 'name' | 'model'; // 排序字段类型
type SortOrder = 'asc' | 'desc'; // 排序顺序类型

const SORT_BY_KEY = 'conversation:sortBy';
const SORT_ORDER_KEY = 'conversation:sortOrder';


const saveSortMode = debounce(({ sortBy, sortOrder }: { sortBy: SortBy, sortOrder: SortOrder }) => {
  localStorage.setItem(SORT_BY_KEY, sortBy);
  localStorage.setItem(SORT_ORDER_KEY, sortOrder);
}, 300); // 300ms 防抖


/**
 * Conversations Store - 管理 conversations 数据的响应式状态
 */
export const useConversationsStore = defineStore('conversations', () => {
  // 状态
  const conversations = ref<Conversation[]>([]);

  const savedSortBy = localStorage.getItem(SORT_BY_KEY) as SortBy;
  const savedSortOrder = localStorage.getItem(SORT_ORDER_KEY) as SortOrder;

  const sortBy = ref<SortBy>(savedSortBy ?? 'createAt'); // 默认按更新时间排序
  const sortOrder = ref<SortOrder>(savedSortOrder ?? 'desc'); // 默认倒序排序

  const messagesInputValue = ref(new Map())

  // Getters
  // 按置顶状态和更新时间排序，置顶的对话排在前面，相同置顶状态的按更新时间倒序排列
  const allConversations = computed(() => conversations.value);

  const messageInputValueById = computed(() => (conversationId: number) => messagesInputValue.value.get(conversationId) ?? '')

  const sortMode = computed(() => ({
    sortBy: sortBy.value,
    sortOrder: sortOrder.value,
  }))

  function setMessageInputValue(
    conversationId: number,
    value: string
  ) {
    messagesInputValue.value.set(conversationId, value);
  }

  function setSortMode(_sortBy: SortBy, _sortOrder: SortOrder) {
    if (sortBy.value !== _sortBy)
      sortBy.value = _sortBy;
    if (sortOrder.value !== _sortOrder)
      sortOrder.value = _sortOrder;
  }

  async function initialize() {
    conversations.value = await dataBase.conversations.toArray();
    // 清除无用 message
    const ids = conversations.value.map(item => item.id);
    const msgs = await dataBase.messages.toArray();
    const invalidIds = msgs.filter(item => !ids.includes(item.conversationId)).map(item => item.id);
    invalidIds.length && dataBase.messages.where('id').anyOf(invalidIds).delete();
  }

  function getConversationById(id: number) {
    return conversations.value.find(c => c.id === id) as Conversation | void;
  }

  async function addConversation(conversation: Omit<Conversation, 'id'>) {
    // 确保新对话有pinned字段，默认为false
    const conversationWithPin = {
      ...conversation,
      pinned: conversation.pinned ?? false
    };

    const conversationId = await dataBase.conversations.add(conversationWithPin);
    conversations.value.push({
      id: conversationId,
      ...conversationWithPin,
    });
    return conversationId;
  }

  async function delConversation(id: number) {
    await dataBase.messages.where('conversationId').equals(id).delete(); // 删除关联的消息
    await dataBase.conversations.delete(id);
    conversations.value = conversations.value.filter(conversation => conversation.id !== id);
  }

  async function updateConversation(conversation: Conversation, updateTime: boolean = true) {
    const _newConversation = {
      ...conversation,
      updatedAt: updateTime ? Date.now() : conversation.updatedAt // 更新为时间戳
    };
    await dataBase.conversations.update(conversation.id, _newConversation);
    conversations.value = conversations.value.map(item => (item.id === conversation.id ? _newConversation : item));
  }

  /**
   * 将对话置顶
   * @param id 对话ID
   */
  async function pinConversation(id: number) {
    const conversation = conversations.value.find(c => c.id === id);
    if (conversation) {
      await updateConversation({
        ...conversation,
        pinned: true,
      }, false);
    }
  }

  /**
   * 取消对话置顶
   * @param id 对话ID
   */
  async function unpinConversation(id: number) {
    const conversation = conversations.value.find(c => c.id === id);
    if (conversation) {
      await updateConversation({
        ...conversation,
        pinned: false,
      }, false);
    }
  }

  watch([() => sortBy.value, () => sortOrder.value], () => saveSortMode({ sortBy: sortBy.value, sortOrder: sortOrder.value }))

  // 返回状态、计算属性和方法
  return {
    // 状态
    conversations,
    sortBy,
    sortOrder,
    // 计算属性
    allConversations,
    messageInputValueById,
    sortMode,
    // 方法
    initialize,
    setMessageInputValue,
    getConversationById,
    addConversation,
    delConversation,
    updateConversation,
    pinConversation,
    unpinConversation,
    setSortMode,
  };
});
