<script setup lang="ts">
import VueMarkdown from 'vue-markdown-render';
import markdownItHighlightjs from 'markdown-it-highlightjs';
import { useI18n } from 'vue-i18n';

defineOptions({ name: 'MessageRender' })
const props = defineProps<{
  msgId: number;
  content: string;
  isStreaming: boolean;
}>()

// 使用i18n
const { t } = useI18n();

const renderId = computed(() => `msg-render-${props.msgId}`);

const _findLastElement = (target: HTMLElement): Element | void => {
  const isList = (el: Element) => el.tagName === 'OL' || el.tagName === 'UL';

  if (!target) return
  let lastElement: Element | void = target.lastElementChild ?? target;
  if (lastElement && lastElement.tagName === 'PRE')
    lastElement = lastElement.getElementsByClassName('hljs')[0] ?? lastElement
  if (lastElement && isList(lastElement))
    lastElement = _findLastElement(lastElement as HTMLElement)

  if (lastElement && lastElement.tagName === 'LI') {
    const _uls = lastElement.getElementsByTagName('ul');
    const _ols = lastElement.getElementsByTagName('ol');
    if (_uls.length) lastElement = _findLastElement(_uls[0]);
    if (_ols.length) lastElement = _findLastElement(_ols[0]);
  }

  return lastElement;
}

function addCursor(target: HTMLElement) {
  const lastEl = _findLastElement(target);
  const cursor = `<b class="_cursor"></b>`;
  if (!lastEl) return
  lastEl.insertAdjacentHTML('beforeend', cursor);
}

async function handleCursor() {
  if (props.isStreaming) {
    await nextTick();
    const target = document.getElementById(renderId.value);
    if (!target) return;
    addCursor(target);
  }
}

function removeCursor() {
  const target = document.getElementById(renderId.value);
  if (!target) return;
  const lastEl = _findLastElement(target);
  lastEl?.lastElementChild?.remove();
}

watch(() => props.content, () => handleCursor());

watch(() => props.isStreaming, async (newVal, oldVal) => {
  if (!newVal && oldVal) {
    await nextTick();
    removeCursor();
  }
});
</script>

<template>
  <template v-if="content.trim().length">
    <VueMarkdown :id="renderId" class="prose dark:prose-invert prose-slate prose-pre:p-0 text-inherit" :source="content"
      :plugins="[markdownItHighlightjs]" />
  </template>
  <span class="_cursor" v-else>{{ t('main.message.rendering') }}</span>
</template>

<style scoped>
.prose {
  font-size: inherit;
}
</style>

<style>
/* 打字机光标效果 - 通过CSS伪元素实现 */
._cursor::after {
  content: '';
  display: inline-block;
  width: 0.5em;
  height: 1.2em;
  transform: translateX(0.6em);
  background-color: currentColor;
  animation: cursor-blink 1s infinite;
  margin-left: 2px;
  vertical-align: text-bottom;
  line-height: 1;
}

@keyframes cursor-blink {

  0%,
  49% {
    opacity: 1;
  }

  50%,
  100% {
    opacity: 0;
  }
}
</style>
