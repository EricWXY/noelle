<script setup lang="ts">
import type { SelectValue } from '@renderer/types';
import { SHORTCUT_KEYS } from '@common/constants'
import { Icon as IconifyIcon } from '@iconify/vue';
import { NButton, NIcon } from 'naive-ui';
import { listenShortcut } from '../utils/shortcut';
import NativeTooltip from './NativeTooltip.vue'
import ProviderSelect from './ProviderSelect.vue';

interface Props {
  placeholder?: string;
  status?: 'loading' | 'streaming' | 'normal';
}
interface Emits {
  (e: 'send', message: string): void;
  (e: 'select', provider: SelectValue): void;
  (e: 'stop'): void;
}

defineOptions({ name: 'MessageInput' });

const props = withDefaults(defineProps<Props>(), { placeholder: '', status: 'normal' })
const emit = defineEmits<Emits>();
const focused = ref(false);
const message = defineModel('message', {
  type: String,
  default: ''
});

const selectedProvider = defineModel<SelectValue>('provider');

// 使用i18n
const { t } = useI18n();

const isBtnDisabled = computed(() => {
  if (props.status === 'loading') return true;
  if (props.status === 'streaming') return false;

  if (!selectedProvider.value) return true;
  return message.value.length === 0;
});

const btnTipContent = computed(() => {
  if (props.status === 'loading') return t('main.message.sending');
  if (props.status === 'streaming') return t('main.message.stopGeneration');
  return t('main.message.send');
});

function handleSend() {
  if (props.status === 'streaming') return emit('stop');

  if (isBtnDisabled.value) return;
  emit('send', message.value);
}

async function handlePasteClipboard(e: MouseEvent) {
  e.preventDefault();
  const content = await navigator.clipboard.readText();
  if (message.value === content) return;
  message.value = content;
}

const removeShortcutListener = listenShortcut(SHORTCUT_KEYS.SEND_MESSAGE, () => {
  if (props.status === 'streaming') return;
  if (isBtnDisabled.value) return;
  if (!focused.value) return;
  handleSend();
});

watch(() => selectedProvider.value, (newVal) => emit('select', newVal));

onUnmounted(() => removeShortcutListener());

defineExpose({
  selectedProvider,
});
</script>

<template>
  <div class="message-input h-full flex flex-col">
    <!-- <div class="tool-bar h-[40px] "></div> -->
    <textarea class="input-area pt-4 px-2 flex-auto w-full text-tx-primary placeholder:text-tx-secondary"
      :value="message" :placeholder="placeholder" @input="message = ($event!.target as any).value"
      @contextmenu="handlePasteClipboard" @focus="focused = true" @blur="focused = false"></textarea>
    <div class="bottom-bar h-[40px] flex justify-between items-center p-2 mb-2">
      <div class="selecter-container w-[200px]">
        <provider-select v-model="selectedProvider" />
      </div>
      <native-tooltip :content="btnTipContent">
        <n-button circle type="primary" :disabled="isBtnDisabled" @click="handleSend">
          <template #icon>
            <n-icon>
              <iconify-icon v-if="status === 'normal'" class="w-4 h-4" icon="material-symbols:arrow-upward" />
              <iconify-icon v-else-if="status === 'streaming'" class="w-4 h-4" icon="material-symbols:pause" />
              <iconify-icon v-else class="w-4 h-4 animate-spin" icon="mdi:loading" />
            </n-icon>
          </template>
        </n-button>
      </native-tooltip>
    </div>
  </div>
</template>

<style scoped>
.input-area {
  padding-inline: 16px;
  border: none;
  resize: none;
}

.input-area:focus {
  outline: none;
}
</style>
