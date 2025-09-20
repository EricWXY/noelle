<script setup lang="ts">
import { CTX_KEY } from './constants';
import { NInput } from 'naive-ui';

import NativeTooltip from '../NativeTooltip.vue';

interface TitleDisplayProps {
  title: string;
  isEditable: boolean;
}

const props = defineProps<TitleDisplayProps>();
const emit = defineEmits(['updateTitle']);

const ctx = inject(CTX_KEY, void 0);

const _title = ref(props.title);
const titleRef = useTemplateRef<HTMLElement>('titleRef');

// 判断标题是否超出显示长度
const isTitleOverflow = ref(false);

/**
 * 检查元素内容是否超出容器宽度
 * @param element 要检查的DOM元素
 * @returns 是否超出宽度
 */
function checkOverflow(element: HTMLElement | null): boolean {
  if (!element) return false;
  return element.scrollWidth > element.clientWidth;
}

/**
 * 更新标题溢出状态
 */
function _updateOverflowStatus() {
  isTitleOverflow.value = checkOverflow(titleRef.value);
}


// 使用防抖包装更新标题溢出状态的函数
const updateOverflowStatus = useDebounceFn(_updateOverflowStatus, 100);

/**
 * 处理标题更新
 */
function updatedTitle() {
  emit('updateTitle', _title.value);
}

// 组件挂载后检查溢出状态
onMounted(() => {
  updateOverflowStatus();
  window.addEventListener('resize', updateOverflowStatus);
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('resize', updateOverflowStatus);
});

// 监听标题内容变化，重新检查溢出状态
watch([() => props.title, () => ctx?.width.value], () => {
  updateOverflowStatus();
});
</script>

<template>
  <n-input v-if="isEditable" size="tiny" v-model:value="_title" class="w-full" @keydown.enter="updatedTitle" />
  <h2 ref="titleRef" class="conversation-title w-full text-tx-secondary font-semibold leading-5 truncate" v-else>
    <template v-if="isTitleOverflow">
      <NativeTooltip :content="title">
        {{ title }}
      </NativeTooltip>
    </template>
    <template v-else>
      {{ title }}
    </template>
  </h2>
</template>
