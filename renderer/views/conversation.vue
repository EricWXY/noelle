<script setup lang="ts">
import type { SelectValue } from '@renderer/types';
import { MAIN_WIN_SIZE } from '@common/constants';
import { throttle } from '@common/utils';
import { useMessagesStore } from '@renderer/stores/messages';
import { useConversationsStore } from '@renderer/stores/conversations';
import { useConfig } from '@renderer/hooks/useConfig';
import { logoData } from '@renderer/logoBase64'

import ResizeDivider from '@renderer/components/ResizeDivider.vue';
import MessageList from '@renderer/components/MessageList.vue';
import MessageInput from '@renderer/components/MessageInput.vue';
import CreateConversation from '@renderer/components/CreateConversation.vue';

const listHeight = ref(0);
const listScale = ref(0.7);
const maxListHeight = ref(window.innerHeight * 0.7);
const isStoping = ref(false);
const message = ref('');
const provider = ref<SelectValue>();
// const defaultModel
const msgInputRef = useTemplateRef<{ selectedProvider: SelectValue }>('msgInputRef');

const route = useRoute();
const router = useRouter();

const config = useConfig();

const { t } = useI18n();

const providerId = computed(() => ((provider.value as string)?.split(':')[0]) ?? '');
const selectedModel = computed(() => ((provider.value as string)?.split(':')[1]) ?? '');
const conversationId = computed(() => Number(route.params.id) as number | undefined);
const defaultModel = computed(() => config.defaultModel || void 0);

const messageInputStatus = computed(() => {
  if (isStoping.value) return 'loading';
  const messages = messagesStore.messagesByConversationId(conversationId.value ?? -1);
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.status === 'streaming' && lastMessage?.content?.length === 0) return 'loading';
  if (lastMessage?.status === 'loading' || lastMessage?.status === 'streaming') return lastMessage.status
  return 'normal';
})

const messagesStore = useMessagesStore();
const conversationsStore = useConversationsStore();

function afterCreateConversation(id: number | void, firstMsg: string) {
  if (!id) return;
  router.push(`/conversation/${id}`);
  messagesStore.sendMessage({
    type: 'question',
    content: firstMsg,
    conversationId: id,
  });
  message.value = '';
}

const canUpdateConversationTime = ref(true);
function handleProviderSelect() {
  const current = conversationsStore.getConversationById(conversationId.value as number)
  if (!conversationId.value || !current) return;
  conversationsStore.updateConversation({
    ...current,
    providerId: Number(providerId.value),
    selectedModel: selectedModel.value,
  }, canUpdateConversationTime.value)
}


async function handleSendMessage() {
  if (!conversationId.value) return;
  await messagesStore.sendMessage({
    type: 'question',
    content: message.value,
    conversationId: conversationId.value,
  });
  message.value = '';
}

async function handleStopMessage() {
  isStoping.value = true;
  const msgIds = messagesStore.loadingMsgIdsByConversationId(conversationId.value ?? -1);
  for (const id of msgIds) {
    await messagesStore.stopMessage(id);
  }
  isStoping.value = false;
}

window.onresize = throttle(async () => {
  if (window.innerHeight < MAIN_WIN_SIZE.minHeight) return;
  listHeight.value = window.innerHeight * listScale.value;
  await nextTick();
  maxListHeight.value = window.innerHeight * 0.7;
  if (listHeight.value > maxListHeight.value) {
    listHeight.value = maxListHeight.value;
  }
}, 10)

onMounted(async () => {
  await nextTick();
  listHeight.value = window.innerHeight * listScale.value;
  messagesStore.initialize();
})

watch(() => defaultModel.value, (val) => {
  if (val) provider.value = val
}, { once: true })

watch(() => listHeight.value, () => {
  listScale.value = listHeight.value / window.innerHeight;
})
watch([() => conversationId.value, () => msgInputRef.value], async ([id, msgInput]) => {
  if (!msgInput || !id) {
    provider.value = defaultModel.value;
    return;
  };
  const current = conversationsStore.getConversationById(id);
  if (!current) return;
  canUpdateConversationTime.value = false;

  msgInput.selectedProvider = `${current.providerId}:${current.selectedModel}`;
  await nextTick()
  canUpdateConversationTime.value = true;
})

</script>
<template>
  <div class="h-full" v-if="!conversationId">
    <div class="h-full pt-[45vh] px-5">
      <div class="text-3xl font-bold text-primary-subtle text-center">
        <img :src="logoData" alt="Noel" class="w-20 h-20 inline-block" />
        {{ t('main.welcome.helloMessage') }}
      </div>

      <div class="bg-bubble-others mt-6 max-w-[800px] h-[200px] mx-auto rounded-md">
        <create-conversation :providerId="providerId" :selectedModel="selectedModel" v-slot="{ create }">
          <message-input v-model:message="message" v-model:provider="provider"
            :placeholder="t('main.conversation.placeholder')" @send="(message) => create(message).then(id => afterCreateConversation(id, message)
            )" />
        </create-conversation>
      </div>
    </div>
  </div>
  <div class="h-full flex flex-col" v-else>
    <div class="w-full min-h-0" :style="{ height: listHeight + 'px' }">
      <message-list :messages="messagesStore.messagesByConversationId(conversationId)" />
    </div>
    <div class="input-container bg-bubble-others flex-auto w-[calc(100% + 10px)] ml-[-5px] ">
      <resize-divider direction="horizontal" v-model:size="listHeight" :max-size="maxListHeight" :min-size="100" />
      <message-input class="p-2 pt-0" ref="msgInputRef" v-model:message="message" v-model:provider="provider"
        :placeholder="t('main.conversation.placeholder')" :status="messageInputStatus" @send="handleSendMessage"
        @stop="handleStopMessage" @select="handleProviderSelect" />
    </div>
  </div>
</template>

<style scoped>
.input-container {
  box-shadow: 5px 1px 20px 0px rgba(101, 101, 101, 0.2);
}
</style>
