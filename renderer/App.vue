<script setup lang="ts">
import { ref } from 'vue';
import { RouterView } from 'vue-router'
import { NConfigProvider } from 'naive-ui'

import { useNaiveTheme } from '@renderer/hooks/useNaiveTheme';
import { useNaiveLocale } from '@renderer/hooks/useNaiveLocale';
import { useFontSize } from '@renderer/hooks/useFontSize';

import { useConversationsStore } from './stores/conversations'
import { useProvidersStore } from './stores/providers';
import { initProviders } from './dataBase'
import { isMac as isMacOs } from './utils/system';

import ConversationList from '@renderer/components/ConversationList/index.vue';
import NavBar from '@renderer/components/NavBar.vue';
import ResizeDivider from '@renderer/components/ResizeDivider.vue';

const isMac = isMacOs();
const sidebarWidth = ref(320); // 初始宽度

const { initialize: initializeConversationsStore } = useConversationsStore();
const { initialize: initializeProvidersStore } = useProvidersStore();

const { theme, themeOverrides } = useNaiveTheme();
const { locale, dateLocale } = useNaiveLocale();

useFontSize();
onMounted(async () => {
  await initProviders();
  await initializeProvidersStore();
  await initializeConversationsStore();
})
</script>
<template>
  <n-config-provider class="h-full w-[100vw] flex" :theme="theme" :theme-overrides="themeOverrides" :locale="locale"
    :date-locale="dateLocale">
    <aside class="sidebar h-full flex flex-shrink-0 flex-col" :style="{ width: sidebarWidth + 'px' }" v-ripple>
      <!-- Mac 红绿灯预留 -->
      <div v-if="isMac" class="w-full h-[35px]"></div>
      <div class="flex-auto flex">
        <nav-bar />
        <conversation-list class="flex-auto" :width="sidebarWidth" @click.stop @mouseleave.stop />
      </div>
    </aside>
    <resize-divider direction="vertical" v-model:size="sidebarWidth" :max-size="500" :min-size="320" />
    <div class="flex-auto">
      <router-view />
    </div>
  </n-config-provider>
</template>

<style scoped>
.app-container {
  background-color: var(--bg-secondary);
}

.sidebar {
  background-color: var(--bg-color);
  box-shadow: -3px -2px 20px rgba(101, 101, 101, 0.2);
}
</style>
