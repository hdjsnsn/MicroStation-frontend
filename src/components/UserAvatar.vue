<template>
  <a-avatar :size="size" :src="src">
    {{ avatarInitial }}
  </a-avatar>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string
    name?: string
    fallback?: string
    size?: number
  }>(),
  {
    src: '',
    name: '',
    fallback: '用',
    size: 40,
  }
)

/**
 * 头像缺失时展示昵称首字符。
 */
const avatarInitial = computed(() => {
  const name = props.name?.trim()
  return name ? name.slice(0, 1) : props.fallback
})
</script>
