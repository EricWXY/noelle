import type { Conversation } from '@common/types';
import { useConversationsStore } from '@renderer/stores/conversations';
import { debounce } from '@common/utils';


const searchKey = ref('');
const _searchKey = ref('');
export function useFilter() {
  const conversationsStore = useConversationsStore();

  const sortConversations = computed(() => {
    const { sortBy, sortOrder } = conversationsStore.sortMode;

    const divider = Object.freeze({
      type: 'divider',
      id: -1
    }) as Conversation; // 用于分隔置顶和非置顶对话的对象

    const pinned: Conversation[] = conversationsStore.allConversations.filter(item => item.pinned).map(item => ({ type: 'conversation', ...item }));

    if (pinned.length) {
      pinned.push(divider); // 分隔置顶和非置顶对话的对象
    }

    const unPinned: Conversation[] = conversationsStore.allConversations.filter(item => !item.pinned).map(item => ({ type: 'conversation', ...item }));

    const handleSortOrder = <T = number | string>(a?: T, b?: T) => {
      if (typeof a === 'number' && typeof b === 'number') {
        return sortOrder === 'desc' ? b - a : a - b;
      }
      if (typeof a === 'string' && typeof b === 'string') {
        return sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b);
      }
      return 0;
    }

    if (sortBy === 'createAt') {
      return [
        ...pinned.sort((a, b) => handleSortOrder(a.createdAt, b.createdAt)),
        ...unPinned.sort((a, b) => handleSortOrder(a.createdAt, b.createdAt)),
      ]
    }

    if (sortBy === 'updatedAt') {
      return [
        ...pinned.sort((a, b) => handleSortOrder(a.updatedAt, b.updatedAt)),
        ...unPinned.sort((a, b) => handleSortOrder(a.updatedAt, b.updatedAt)),
      ]
    }

    if (sortBy === 'name') {
      return [
        ...pinned.sort((a, b) => handleSortOrder(a.title, b.title)),
        ...unPinned.sort((a, b) => handleSortOrder(a.title, b.title))
      ]
    }

    return [
      ...pinned.sort((a, b) => handleSortOrder(a.selectedModel, b.selectedModel)),
      ...unPinned.sort((a, b) => handleSortOrder(a.selectedModel, b.selectedModel))
    ]
  });

  const filteredConversations = computed(() => {
    if (!_searchKey.value) return sortConversations.value;
    return sortConversations.value.filter(item => item?.title && item?.title.includes(_searchKey.value));
  });

  const updateSearchKey = debounce((newVal) => {
    _searchKey.value = newVal;
  }, 200);

  watch(() => searchKey.value, (newVal) => updateSearchKey(newVal));

  return {
    searchKey,
    conversations: filteredConversations,
  }
}
