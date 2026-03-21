<template>
  <a-layout class="basic-layout">
    <GlobalHeader v-if="!hideGlobalLayout" />

    <a-layout-content :class="['basic-layout-content', { 'basic-layout-content--full': hideGlobalLayout }]">
      <RouterView />
    </a-layout-content>

    <GlobalFooter v-if="!hideGlobalLayout" />
  </a-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import GlobalFooter from '@/components/GlobalFooter.vue'

const route = useRoute()
const hideLayoutRoutes = ['/user/login', '/user/register']
const hideGlobalLayout = computed(() => hideLayoutRoutes.includes(route.path))
</script>

<style scoped>
.basic-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.basic-layout-content {
  flex: 1;
  padding: 16px;
  background-color: #f5f5f5;
}

.basic-layout-content--full {
  padding: 0;
}

@media (min-width: 768px) {
  .basic-layout-content {
    padding: 24px;
  }

  .basic-layout-content--full {
    padding: 0;
  }
}
</style>
