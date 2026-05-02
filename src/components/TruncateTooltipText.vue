<template>
  <a-tooltip
    v-if="showTooltip"
    :title="displayText"
    :color="color"
    :overlay-inner-style="{ color: overlayTextColor }"
  >
    <div class="truncate-text" :style="textStyle">
      {{ displayText }}
    </div>
  </a-tooltip>
  <div v-else class="truncate-text" :style="textStyle">
    {{ displayText }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

const props = withDefaults(
  defineProps<{
    text?: string | null
    maxWidth?: string
    lines?: number
    alwaysTooltip?: boolean
    threshold?: number
    color?: string
    overlayTextColor?: string
    align?: 'left' | 'center' | 'right'
  }>(),
  {
    text: '',
    maxWidth: '120px',
    lines: 1,
    alwaysTooltip: false,
    threshold: 0,
    color: '#f7f8fa',
    overlayTextColor: '#1f2937',
    align: 'left',
  }
)

const displayText = computed(() => {
  const value = props.text?.trim()
  return value || '-'
})

const showTooltip = computed(() => {
  return props.alwaysTooltip || (props.text ?? '').trim().length > props.threshold
})

const textStyle = computed(() => {
  const baseStyle: CSSProperties = {
    maxWidth: props.maxWidth,
    margin: '0 auto',
    overflow: 'hidden',
    textAlign: props.align,
    lineHeight: '20px',
  }
  if (props.lines <= 1) {
    return {
      ...baseStyle,
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    } satisfies CSSProperties
  }
  return {
    ...baseStyle,
    display: '-webkit-box',
    WebkitLineClamp: String(props.lines),
    WebkitBoxOrient: 'vertical',
    wordBreak: 'break-word',
  } as CSSProperties
})
</script>

<style scoped>
.truncate-text {
  display: block;
}
</style>
