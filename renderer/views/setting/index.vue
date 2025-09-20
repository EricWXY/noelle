<script setup lang="ts">
import { debounce } from '@common/utils';
import { NConfigProvider, NForm, NFormItem, NDivider, NSelect, NColorPicker, NSwitch, NTabs, NTabPane, NInput, type FormInst } from 'naive-ui';
import { useNaiveTheme } from '@renderer/hooks/useNaiveTheme';
import { useNaiveLocale } from '@renderer/hooks/useNaiveLocale';
import { useFontSize } from '@renderer/hooks/useFontSize';
import { useConfig } from '@renderer/hooks/useConfig';
import { useI18n } from 'vue-i18n';

useFontSize();
const { theme, themeOverrides } = useNaiveTheme();
const { locale, dateLocale } = useNaiveLocale();
const { t } = useI18n();
const activeTab = ref('basic');

const formModel = useConfig();
const formRef = useTemplateRef<FormInst>('formRef');

const providerFormModel = reactive({
  qianfan: {
    accessKey: '',
    secretKey: ''
  }
})
const providerFormRef = useTemplateRef<FormInst>('providerFormRef');


const languageOptions = [
  { label: '中文', value: 'zh' },
  { label: 'English', value: 'en' },
];
const themeModeOptions = computed(() => [
  { label: t('settings.theme.dark'), value: 'dark' },
  { label: t('settings.theme.light'), value: 'light' },
  { label: t('settings.theme.system'), value: 'system' },
]);
const fontSizeOptions = computed(() => [
  { label: t('settings.appearance.fontSizeOptions.10'), value: 10 },
  { label: t('settings.appearance.fontSizeOptions.12'), value: 12 },
  { label: t('settings.appearance.fontSizeOptions.14'), value: 14 },
  { label: t('settings.appearance.fontSizeOptions.16'), value: 16 },
  { label: t('settings.appearance.fontSizeOptions.18'), value: 18 },
  { label: t('settings.appearance.fontSizeOptions.20'), value: 20 },
  { label: t('settings.appearance.fontSizeOptions.24'), value: 24 },
]);

function onWindowClose() {
  setTimeout(() => activeTab.value = 'basic', 300);
}
const updateProviderConfig = debounce((val) => {
  formModel.provider = JSON.stringify(val)
}, 300)

watch(() => providerFormModel, (newVal) => updateProviderConfig(newVal), { deep: true })

watchEffect(() => {
  try {
    const provider = JSON.parse(formModel?.provider || '{}');
    Object.assign(providerFormModel, provider);
  } catch (error) {
    console.error('parse provider config failed', error);
  }
})
</script>

<template>
  <n-config-provider class="bg-main text-tx-primary h-screen" :locale="locale" :date-locale="dateLocale" :theme="theme"
    :theme-overrides="themeOverrides">
    <title-bar :is-maximizable="false" @close="onWindowClose">
      <drag-region class="p-2 text-[16px]">{{ t('settings.title') }}</drag-region>
    </title-bar>
    <main class="p-4">
      <n-tabs size="large" animated default-value="basic" v-model:value="activeTab">
        <n-tab-pane name="basic" :tab="t('settings.base')">
          <n-form ref="formRef" :model="formModel">
            <n-form-item :label="t('settings.theme.label')" path="themeMode">
              <n-select v-model:value="formModel.themeMode" :options="themeModeOptions" />
            </n-form-item>
            <n-form-item :label="`${t('settings.theme.primaryColor')}-${formModel.primaryColor}`">
              <n-color-picker v-model:value="formModel.primaryColor" :show-alpha="false" />
            </n-form-item>
            <n-form-item :label="t('settings.language.label')" path="language">
              <n-select v-model:value="formModel.language" :options="languageOptions" />
            </n-form-item>
            <n-form-item :label="t('settings.appearance.fontSize')">
              <n-select v-model:value="formModel.fontSize" :options="fontSizeOptions" />
            </n-form-item>
            <n-form-item :label="t('settings.behavior.minimizeToTray')" path="minimizeToTray">
              <n-switch v-model:value="formModel.minimizeToTray" :rail-style="(params) => {
                return {
                  background: params.checked ? formModel.primaryColor : 'rgba(0, 0, 0, 0.3)'
                }
              }" />
            </n-form-item>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="provider" :tab="t('settings.provider.modelConfig')">
          <n-form ref="providerFormRef" :model="providerFormModel">
            <h2 class="provider-from-sub-title"> 百度千帆 </h2>
            <n-form-item label="AccessKey" path="qianfan.accessKey">
              <n-input v-model:value="providerFormModel.qianfan.accessKey" clearable />
            </n-form-item>
            <n-form-item label="SecretKey" path="qianfan.secretKey">
              <n-input v-model:value="providerFormModel.qianfan.secretKey" type="password" clearable />
            </n-form-item>
            <n-divider />
          </n-form>
        </n-tab-pane>
      </n-tabs>
    </main>
  </n-config-provider>
</template>

<style scoped>
.provider-from-sub-title {
  font-size: 12px;
  font-weight: bold;
  padding-bottom: 8px;
  padding-top: 8px;
  color: var(--text-secondary);
}
</style>
