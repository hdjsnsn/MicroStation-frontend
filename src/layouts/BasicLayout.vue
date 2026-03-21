<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <a-layout class="basic-layout">
    <GlobalHeader />

    <a-layout-content class="basic-layout-content">
      <RouterView />
    </a-layout-content>

    <GlobalFooter />
  </a-layout>
</template>

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

@media (min-width: 768px) {
  .basic-layout-content {
    padding: 24px;
  }
}
</style>
