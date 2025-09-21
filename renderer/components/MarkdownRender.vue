<script setup lang="ts">
import VueMarkdown from 'vue-markdown-render';
import markdownItHighlightjs from 'markdown-it-highlightjs';

defineOptions({ name: 'MarkdownRender' })
defineProps<{
  source: string;
}>()
</script>

<template>
  <VueMarkdown class="prose dark:prose-invert prose-slate prose-pre:p-0 text-inherit" :source="source"
    :plugins="[markdownItHighlightjs]" />
</template>

<style scoped>
.prose {
  font-size: inherit;
}
</style>
