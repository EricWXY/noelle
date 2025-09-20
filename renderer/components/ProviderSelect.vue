<script setup lang="ts">
import type { SelectValue } from '@renderer/types';
import { NSelect } from 'naive-ui';
import { useProvidersStore } from '@renderer/stores/providers';
import { useI18n } from 'vue-i18n';

defineOptions({ name: 'ProviderSelect' });

const props = defineProps<{
  modelValue: SelectValue
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: SelectValue): void
}>()

const { t } = useI18n();
const providersStore = useProvidersStore();

const selectedProvider = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const providerOptions = computed(() => providersStore.allProviders.map(item => ({
  label: item.title || item.name,
  type: 'group',
  key: item.id,
  children: item.models.map(model => ({
    label: model,
    value: `${item.id}:${model}`,
  }))
})))
</script>

<template>
  <n-select size="small" v-model:value="selectedProvider" :options="providerOptions"
    :placeholder="t('main.conversation.selectModel')" />
</template>
