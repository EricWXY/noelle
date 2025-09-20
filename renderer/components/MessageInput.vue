<script setup lang="ts">
import type { SelectValue } from '@renderer/types';
import { Icon as IconifyIcon } from '@iconify/vue'
import { NButton, NIcon } from 'naive-ui';
import ProviderSelect from './ProviderSelect.vue';

interface Props {
  placeholder?: string;
  loading?: boolean;
}
interface Emits {
  (e: 'send', message: string): void;
  (e: 'select', provider: SelectValue): void;
}

defineOptions({ name: 'MessageInput' });

withDefaults(defineProps<Props>(), { placeholder: '', loading: false })
const emit = defineEmits<Emits>();
const message = defineModel('message', {
  type: String,
  default: ''
});

const selectedProvider = defineModel<SelectValue>('provider');

const isBtnDisabled = computed(() => {
  if (!selectedProvider.value) return true;
  return message.value.length === 0;
});

function handleSend() {
  if (isBtnDisabled.value) return;
  emit('send', message.value);
}

watch(() => selectedProvider.value, (newVal) => emit('select', newVal));

defineExpose({
  selectedProvider,
})
</script>

<template>
  <div class="message-input h-full flex flex-col">
    <!-- <div class="tool-bar h-[40px] "></div> -->
    <textarea class="input-area pt-4 px-2 flex-auto w-full text-tx-primary placeholder:text-tx-secondary"
      :value="message" :placeholder="placeholder" @input="message = ($event!.target as any).value"></textarea>
    <div class="bottom-bar h-[40px] flex justify-between items-center p-2 mb-2">
      <div class="selecter-container w-[200px]">
        <provider-select v-model="selectedProvider" />
      </div>
      <n-button circle type="primary" :disabled="isBtnDisabled" @click="handleSend">
        <template #icon>
          <n-icon>
            <iconify-icon class="w-4 h-4" icon="material-symbols:arrow-upward" />
          </n-icon>
        </template>
      </n-button>
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
