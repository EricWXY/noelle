<script setup lang="ts">
import { NCollapse, NCollapseItem, NSwitch, NInput, NInputGroup, NInputGroupLabel, NDynamicTags, NDivider, NSelect } from 'naive-ui';
import { useProvidersStore } from '@renderer/stores/providers';
import { useConfig } from '@renderer/hooks/useConfig';
import { useI18n } from 'vue-i18n';

const providersStore = useProvidersStore();
const config = useConfig();
const defaultModel = ref(config.defaultModel || void 0);

// 使用i18n
const { t } = useI18n();

const providerOptions = computed(() => providersStore.allProviders.filter(item => item.visible).map(item => ({
  label: item.title || item.name,
  type: 'group',
  key: item.id,
  children: item.models.map(model => ({
    label: model,
    value: `${item.id}:${model}`,
  }))
})))

function handleApiKeyUpdate(id: number, apiKey: string) {
  const baseURL = providersStore.allProviders.find(item => item.id === id)?.openAISetting?.baseURL ?? ''
  providersStore.updateProvider(id, { openAISetting: { apiKey, baseURL } });
}

function handleBaseURLUpdate(id: number, baseURL: string) {
  const apiKey = providersStore.allProviders.find(item => item.id === id)?.openAISetting?.apiKey ?? ''
  providersStore.updateProvider(id, { openAISetting: { apiKey, baseURL } });
}

onMounted(() => providersStore.initialize());

watch(() => config.defaultModel, () => defaultModel.value = config.defaultModel, { once: true });

watch(defaultModel, (v) => config.defaultModel = v);

</script>

<template>

  <div class="flex items-center py-4">
    <div class="w-[100px]">
      {{ t('settings.providers.defaultModel') }}：
    </div>
    <n-select v-model:value="defaultModel" :options="providerOptions" />
  </div>
  <n-divider />
  <n-collapse>
    <n-collapse-item v-for="(provider, index) in providersStore.allProviders" :key="provider.name"
      :title="provider.title ?? provider.name">
      <template #header-extra>
        <n-switch :value="providersStore.allProviders[index].visible"
          @update:value="(v) => providersStore.updateProvider(provider.id, { visible: v })" @click.stop />
      </template>
      <n-input-group class="my-2">
        <n-input-group-label>{{ t('settings.providers.apiKey') }}</n-input-group-label>
        <n-input type="password" :value="providersStore.allProviders[index].openAISetting?.apiKey ?? ''"
          @update:value="(v) => handleApiKeyUpdate(provider.id, v)" />
      </n-input-group>
      <n-input-group class="my-2">
        <n-input-group-label>{{ t('settings.providers.apiUrl') }}</n-input-group-label>
        <n-input :value="providersStore.allProviders[index].openAISetting?.baseURL ?? ''"
          @update:value="(v) => handleBaseURLUpdate(provider.id, v)" />
      </n-input-group>
      <n-dynamic-tags :value="providersStore.allProviders[index].models ?? []"
        @update:value="(v: any) => providersStore.updateProvider(provider.id, { models: v })" />
    </n-collapse-item>
  </n-collapse>
</template>
