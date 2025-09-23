<script setup lang="ts">
import type { Message } from '@common/types';
import { MESSAGE_ITEM_MENU_IDS, MENU_IDS } from '@common/constants';
import { useMessage } from 'naive-ui';
import { createContextMenu } from '@renderer/utils/contextMenu';
import { useDialog } from '@renderer/hooks/useDialog'
import { useMessagesStore } from '@renderer/stores/messages'
import { useI18n } from 'vue-i18n';
import { useBatchTimeAgo } from '@renderer/hooks/useTimeAgo';
import { NCheckbox, NButton, NScrollbar } from 'naive-ui';
import MessageRender from '@renderer/components/MessageRender.vue';

const MESSAGE_LIST_CLASS_NAME = 'message-list' as const;
const SCROLLBAR_CONTENT_CLASS_NAME = 'n-scrollbar-content' as const;


defineOptions({ name: 'MessageList' })

const props = defineProps<{
  messages: Message[];
}>();

const isBatchMode = ref(false);
const checkedIds = ref<number[]>([]);

const itemChecked = computed(() => (id: number) => checkedIds.value.includes(id));

const route = useRoute();
const message = useMessage();
const { createDialog } = useDialog();
const { deleteMessage } = useMessagesStore();
const { t } = useI18n();

const messageActionPolicy = new Map<MESSAGE_ITEM_MENU_IDS, (msgId: number) => Promise<void>>([
  [MESSAGE_ITEM_MENU_IDS.COPY, async (msgId: number) => {
    const msg = props.messages.find((msg) => msg.id === msgId);
    if (!msg) return;
    navigator.clipboard.writeText(msg.content).then(()=>{
      message.success(t('main.message.dialog.copySuccess'));
    });
  }],
  [MESSAGE_ITEM_MENU_IDS.DELETE, async (msgId: number) => {
    const res = await createDialog({
      title: 'main.message.dialog.title',
      content: 'main.message.dialog.messageDelete',
    })
    if (res === 'confirm') deleteMessage(msgId);
  }],
  [MESSAGE_ITEM_MENU_IDS.SELECT, async (msgId: number) => {
    checkedIds.value = [...checkedIds.value, msgId]
    isBatchMode.value = true;
  }],
]);

/**
 * 使用批量时间格式化工具，提高列表性能
 */
const { formatTimeAgo } = useBatchTimeAgo();

async function handleContextMenu(msgId: number) {
  const clickItem = await createContextMenu(MENU_IDS.MSSAGE_ITEM);
  const action = messageActionPolicy.get(clickItem as MESSAGE_ITEM_MENU_IDS);
  action && await action(msgId);
}

function handleCheckItem(id: number, val: boolean) {
  if (val && !checkedIds.value.includes(id)) {
    checkedIds.value = [...checkedIds.value, id]
  } else {
    checkedIds.value = checkedIds.value.filter((_id) => _id !== id)
  }
}
async function handleBatchDelete() {
  const res = await createDialog({
    title: 'main.message.dialog.title',
    content: 'main.message.dialog.batchDelete',
  })
  if (res === 'confirm') {
    checkedIds.value.forEach((id) => deleteMessage(id));
    quitBatchMode();
  }
}

function quitBatchMode() {
  checkedIds.value = [];
  isBatchMode.value = false;
}

function _getScrollDOM() {
  const msgListsOM = document.getElementsByClassName(MESSAGE_LIST_CLASS_NAME)[0];
  if (!msgListsOM) return;
  return msgListsOM.getElementsByClassName(SCROLLBAR_CONTENT_CLASS_NAME)[0];
}

async function scrollToBottom(behavior: ScrollIntoViewOptions['behavior'] = 'smooth') {
  await nextTick();
  const scrollDOM = _getScrollDOM();
  if (!scrollDOM) return;
  scrollDOM.scrollIntoView({
    behavior,
    block: 'end',
  })
}

// 用记录高度的方式 优于节流;
let currentHeight = 0;
watch([() => route.params.id, () => props.messages.length], () => {
  scrollToBottom('instant');
  currentHeight = 0;
}
);

watch(
  () => props.messages[props.messages.length - 1]?.content?.length,
  () => {
    const scrollDOM = _getScrollDOM();
    if (!scrollDOM) return;
    const height = scrollDOM.scrollHeight;
    if (height > currentHeight) {
      currentHeight = height;
      scrollToBottom();
    }
  },
  { immediate: true, deep: true }
);

onMounted(() => {
  scrollToBottom('instant');
})
</script>

<template>
  <div class="flex flex-col h-full">
    <n-scrollbar class="message-list  px-5 pt-6">
      <div class="message-list-item mt-3 pb-5 flex items-center" v-for="message in messages" :key="message.id">
        <div class="pr-5" v-show="isBatchMode">
          <n-checkbox :checked="itemChecked(message.id)" @update:checked="(val) => handleCheckItem(message.id, val)" />
        </div>
        <div class="flex flex-auto"
          :class="{ 'justify-end': message.type === 'question', 'justify-start': message.type === 'answer' }">
          <span>
            <div class="text-sm text-gray-500 mb-2"
              :style="{ textAlign: message.type === 'question' ? 'end' : 'start' }">
              {{ formatTimeAgo(message.createdAt) }}
            </div>
            <div class="msg-shadow p-2 rounded-md bg-bubble-self text-white" v-if="message.type === 'question'"
              @contextmenu="handleContextMenu(message.id)">
              <message-render :msg-id="message.id" :content="message.content"
                :is-streaming="message.status === 'streaming'" />
            </div>
            <div v-else class="msg-shadow p-2 px-6 rounded-md bg-bubble-others text-tx-primary"
              @contextmenu="handleContextMenu(message.id)">
              <template v-if="message.status === 'loading'">
                ...
              </template>
              <template v-else>
                <message-render :msg-id="message.id" :content="message.content"
                  :is-streaming="message.status === 'streaming'" is-answer />
              </template>
            </div>
          </span>
        </div>
      </div>
    </n-scrollbar>

    <div v-show="isBatchMode" class="flex justify-between p-2 border-t-3 border-input">
      <n-button type="error" size="tiny" @click="handleBatchDelete">{{ t('main.message.batchActions.deleteSelected')
      }}</n-button>
      <n-button type="primary" size="tiny" quaternary @click="quitBatchMode">{{ t('dialog.cancel') }}</n-button>
    </div>
  </div>
</template>

<style scoped>
.msg-shadow {
  box-shadow: 0 0 10px var(--input-bg);
}
</style>
