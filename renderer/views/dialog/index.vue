<script setup lang="ts">
import { NConfigProvider } from 'naive-ui';
import { useNaiveTheme } from '@renderer/hooks/useNaiveTheme';
import { useNaiveLocale } from '@renderer/hooks/useNaiveLocale';
import { useFontSize } from '@renderer/hooks/useFontSize';


useFontSize();
const { theme, themeOverrides } = useNaiveTheme();
const { locale, dateLocale } = useNaiveLocale();


const { t } = useI18n();
const _api = window.api as any

const params: Ref<CreateDialogProps> = ref({
  title: '',
  content: '',
  confirmText: '',
  cancelText: '',
})

_api._dialogGetParams().then((res: CreateDialogProps) => {
  params.value = res
})

function handleCancel() {
  _api._dialogFeedback('cancel', params.value.winId)
}
function handleConfirm() {
  _api._dialogFeedback('confirm', params.value.winId)
}
</script>

<template>
  <n-config-provider class="h-screen w-full flex flex-col" :locale="locale" :date-locale="dateLocale" :theme="theme"
    :theme-overrides="themeOverrides">
    <title-bar class="h-[30px]" :is-minimizable="false" :is-maximizable="false">
      <drag-region class="p-3 text-sm font-bold text-tx-primary">
        {{ t(params.title ?? '') }}
      </drag-region>
    </title-bar>
    <p class="flex-auto p-5 text-sm text-tx-primary">
      {{ t(params.content) }}
    </p>
    <div class="h-[40px] flex justify-end items-center gap-2 p-4 mb-[20px]">
      <button
        class="mr-1 px-4 py-1.5 cursor-pointer rounded-md text-sm text-tx-secondary hover:bg-input transition-colors"
        @click="handleCancel">
        {{ t(params.cancelText || 'dialog.cancel') }}
      </button>
      <button class="px-4 py-1.5 cursor-pointer rounded-md text-sm text-tx-primary hover:bg-red-200 transition-colors"
        @click="handleConfirm">
        {{ t(params.confirmText || 'dialog.confirm') }}
      </button>
    </div>
  </n-config-provider>
</template>
