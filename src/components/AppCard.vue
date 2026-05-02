<template>
  <div class="app-card">
    <div class="app-card-cover">
      <img
        v-if="props.app.cover"
        :src="props.app.cover"
        :alt="props.app.appName || '应用封面'"
        class="app-card-image"
      />
      <div v-else class="app-card-placeholder">
        <div class="app-card-placeholder-badge">{{ getCodeGenTypeLabel(props.app.codeGenType, 'short') }}</div>
      </div>
      <div class="app-card-overlay">
        <a-button type="primary" @click.stop="emit('chat')">进入对话</a-button>
        <a-button @click.stop="emit('preview')">预览应用</a-button>
      </div>
    </div>
    <div class="app-card-body">
      <!-- 卡片信息区：左侧头像，右侧标题与创建者昵称 -->
      <div class="app-card-info">
        <UserAvatar
          :size="44"
          :src="props.app.user?.userAvatar"
          :name="props.app.user?.userName"
          class="app-card-avatar"
        />
        <div class="app-card-main">
          <div class="app-card-title-row">
            <div class="app-card-title">{{ props.app.appName || '未命名应用' }}</div>
            <a-tag v-if="props.app.priority === 99" color="gold">精选</a-tag>
          </div>
          <div class="app-card-author">
            {{ props.app.user?.userName || '未知用户' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import UserAvatar from '@/components/UserAvatar.vue'
import { getCodeGenTypeLabel } from '@/constants/codeGenType'

const props = defineProps<{
  app: API.AppVO
}>()

const emit = defineEmits<{
  chat: []
  preview: []
}>()

</script>

<style scoped>
.app-card {
  overflow: hidden;
  border: 1px solid #edf0f4;
  border-radius: 20px;
  background: #ffffff;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.app-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.app-card-cover {
  position: relative;
  height: 220px;
  background: #f8fafc;
}

.app-card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(15, 23, 42, 0.42);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.app-card:hover .app-card-overlay {
  opacity: 1;
  pointer-events: auto;
}

.app-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.app-card-placeholder {
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background:
    radial-gradient(circle at top right, rgba(45, 212, 191, 0.28), transparent 35%),
    radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.24), transparent 40%),
    linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%);
}

.app-card-placeholder-badge {
  width: fit-content;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
  font-size: 12px;
}

.app-card-placeholder-title {
  color: #0f172a;
  font-size: 28px;
  line-height: 1.3;
  font-weight: 700;
  word-break: break-word;
}

.app-card-body {
  padding: 16px 18px 18px;
}

.app-card-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-card-avatar {
  flex-shrink: 0;
  background: #dbeafe;
  color: #1d4ed8;
}

.app-card-main {
  min-width: 0;
  flex: 1;
}

.app-card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-card-title {
  flex: 1;
  color: #111827;
  font-size: 24px;
  line-height: 1.4;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-card-author {
  margin-top: 6px;
  color: #374151;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .app-card-cover {
    height: 180px;
  }

  .app-card-title {
    font-size: 18px;
  }

  .app-card-author {
    font-size: 14px;
  }
}
</style>
