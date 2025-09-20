<script setup lang="ts">
import { ref } from 'vue';
import { CTX_KEY } from './constants';
import { NButton, NCheckbox } from 'naive-ui';
import { useContextMenu } from './useContextMenu';
import { useFilter } from './useFilter'

import { CONVERSATION_ITEM_MENU_IDS } from '@common/constants';

defineOptions({ name: 'OperationsBar' });

const emit = defineEmits(['cancel', 'selectAll', 'op']);

const ctx = inject(CTX_KEY, void 0);

const { isBatchOperate } = useContextMenu();
const { conversations } = useFilter();

const isAllSelected = ref(false);

function handleAllSelectChange(checked: boolean) {
  isAllSelected.value = checked;
  emit('selectAll', checked);
};

watch(() => isBatchOperate.value, () => {
  handleAllSelectChange(false);
});

watch([
  () => ctx?.checkedIds.value.length,
  () => conversations.value.length
], ([checkedIdsSize, conversationsSize]) => {
  isAllSelected.value = checkedIdsSize === conversationsSize;
});
</script>

<template>
  <div @click.stop>
    <p class="divider my-2 h-px bg-input"></p>
    <div class="flex justify-between items-center pt-1">
      <n-checkbox v-model:checked="isAllSelected" @update:checked="handleAllSelectChange">
        {{ $t('main.conversation.operations.selectAll') }}
      </n-checkbox>
      <n-button quaternary @click="emit('cancel')">
        {{ $t('main.conversation.operations.cancel') }}
      </n-button>
    </div>
    <div class="flex items-center py-4">
      <n-button @click="emit('op', CONVERSATION_ITEM_MENU_IDS.PIN)" class="flex-1" style="margin-right:2px;">
        {{ $t('main.conversation.operations.pin') }}
      </n-button>
      <n-button @click="emit('op', CONVERSATION_ITEM_MENU_IDS.DEL)" class="flex-1">
        {{ $t('main.conversation.operations.del') }}
      </n-button>
    </div>
  </div>
</template>
