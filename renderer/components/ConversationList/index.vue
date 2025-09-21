<script setup lang="ts">
import type { Conversation } from '@renderer/types';
import { MENU_IDS, CONVERSATION_ITEM_MENU_IDS } from '@common/constants';
import { CTX_KEY } from './constants';
import { useDialog } from '@renderer/hooks/useDialog';
import { createContextMenu } from '@renderer/utils/contextMenu';
import { useConversationsStore } from '@renderer/stores/conversations';
import { useFilter } from './useFilter';
import { useContextMenu } from './useContextMenu';

import ListItem from './ListItem.vue';
import SearchBar from './SearchBar.vue';
import OperationsBar from './OperationsBar.vue';


defineOptions({ name: 'ConversationList' });

const props = defineProps<{ width: number }>();
const editId = ref<number | void>();
const checkedIds = ref<number[]>([]);

const router = useRouter();
const route = useRoute();
const conversationsStore = useConversationsStore();

const { createDialog } = useDialog();
const { conversations } = useFilter();

const { handle: handleListContexMenu, isBatchOperate } = useContextMenu();

const currentId = computed(() => Number(route.params.id));

const conversationActionPolicy = new Map([
  [CONVERSATION_ITEM_MENU_IDS.DEL, async (_item: Conversation) => {

    const res = await createDialog({
      title: 'main.conversation.dialog.title',
      content: 'main.conversation.dialog.content',
    })
    if (res === 'confirm') {
      conversationsStore.delConversation(_item.id);
      _item.id === currentId.value && router.push('/conversation');
    }
  }
  ],
  [CONVERSATION_ITEM_MENU_IDS.RENAME, async (_item: Conversation) => {
    // 重命名对话
    editId.value = _item.id;
  }],
  [CONVERSATION_ITEM_MENU_IDS.PIN, async (_item: Conversation) => {
    // 切换置顶状态
    if (_item.pinned) {
      await conversationsStore.unpinConversation(_item.id);
    } else {
      await conversationsStore.pinConversation(_item.id);
    }
  }]
])

const batchActionPolicy = new Map([
  [CONVERSATION_ITEM_MENU_IDS.DEL, async () => {
    const res = await createDialog({
      title: 'main.conversation.dialog.title',
      content: 'main.conversation.dialog.content_1',
    })
    if (res !== 'confirm') return

    if (checkedIds.value.includes(currentId.value)) {
      router.push('/conversation');
    }
    checkedIds.value.forEach(id => conversationsStore.delConversation(id));
    isBatchOperate.value = false;
  }],
  [CONVERSATION_ITEM_MENU_IDS.PIN, () => {
    checkedIds.value.forEach(id => {
      if (conversationsStore.allConversations.find(item => item.id === id)?.pinned) {
        conversationsStore.unpinConversation(id);
        return
      }
      conversationsStore.pinConversation(id);
    });
    isBatchOperate.value = false;
  }]
])

function handleBatchOperate(OpId: CONVERSATION_ITEM_MENU_IDS) {
  const action = batchActionPolicy.get(OpId);
  action && action();
}

async function handleContextMenu(_item: Conversation) {
  const clickItem = await createContextMenu(
    MENU_IDS.CONVERSATION_ITEM,
    void 0,
    _item.pinned ? [{ label: 'menu.conversation.unpinConversation', id: CONVERSATION_ITEM_MENU_IDS.PIN }] : void 0) as CONVERSATION_ITEM_MENU_IDS;
  const action = conversationActionPolicy.get(clickItem);
  action && await action(_item);
}

function handleItemClick(item: Conversation) {
  if (item.id !== currentId.value)
    return router.push(`/conversation/${item.id}`);
}

function handleClickOutItem() {
  router.push('/conversation')
}

function updateTitle(id: number, title: string) {
  const target = conversationsStore.conversations.find(item => item.id === id);
  if (!target) return
  conversationsStore.updateConversation({
    ...target,
    title,
  });
  editId.value = void 0;
}

function handleAllSelectChange(checked: boolean) {
  checkedIds.value = checked ? conversations.value.map(item => item.id) : [];
}

provide(CTX_KEY, {
  width: computed(() => props.width),
  editId: computed(() => editId.value),
  checkedIds,
})
</script>

<template>
  <div class="conversation-list px-2 pt-3 h-[100vh] flex flex-col" :style="{ width: 'calc(100% - 57px)' }"
    @contextmenu.prevent.stop="handleListContexMenu" @click="handleClickOutItem">
    <search-bar class="mt-3" />
    <ul class="flex-1 overflow-auto">
      <template v-for="item in conversations" :key="item.id">
        <li v-if="item.type !== 'divider'"
          class="cursor-pointer p-2 mt-2 rounded-md hover:bg-input flex flex-col items-start gap-2"
          :class="{ 'bg-input': item.id === currentId, 'pinned-conversation': item.pinned }"
          @click.stop="handleItemClick(item)" @contextmenu.prevent.stop="handleContextMenu(item)">
          <list-item v-bind="(item)" @update-title="updateTitle" />
        </li>
        <li v-else class="divider my-2 h-px bg-input"></li>
      </template>
    </ul>
    <operations-bar v-show="isBatchOperate" @select-all="handleAllSelectChange" @cancel="isBatchOperate = false"
      @op="handleBatchOperate" />
  </div>
</template>
