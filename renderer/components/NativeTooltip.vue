<script setup lang="ts">
interface Props {
  content: string;
}

defineOptions({ name: 'NativeTooltip' });

const props = defineProps<Props>()
const slots = defineSlots()

if (slots?.default?.().length > 1) {
  console.warn('NativeTooltip slot only support one element');
}

function updateTooltipContent(content: string) {
  const defaultSlot = slots?.default?.()
  if (defaultSlot) {
    const slotElement = defaultSlot[0]?.el
    if (slotElement && slotElement instanceof HTMLElement) {
      slotElement.title = content
    }
  }
}

onMounted(() => {
  updateTooltipContent(props.content)
})

watch(() => props.content, (val) => {
  updateTooltipContent(val)
})
</script>

<template>
  <template v-if="slots.default()[0].el">
    <slot></slot>
  </template>
  <template v-else>
    <span :title="props.content">
      <slot></slot>
    </span>
  </template>
</template>
