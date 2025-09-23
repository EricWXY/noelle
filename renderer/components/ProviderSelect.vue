<script setup lang="ts">
import type { SelectValue } from '@renderer/types';
import { NSelect } from 'naive-ui';
import { useProvidersStore } from '@renderer/stores/providers';

defineOptions({ name: 'ProviderSelect' });

const { t } = useI18n();
const providersStore = useProvidersStore();

const selectedProvider = defineModel<SelectValue>('modelValue');

const providerOptions = computed(() => providersStore.allProviders.filter(item => item.visible).map(item => ({
  label: item.title || item.name,
  type: 'group',
  key: item.id,
  children: item.models.map(model => ({
    label: model,
    value: `${item.id}:${model}`,
  }))
})));
</script>

<template>
  <n-select size="small" v-model:value="selectedProvider" :options="providerOptions"
    :placeholder="t('main.conversation.selectModel')" />
</template>
