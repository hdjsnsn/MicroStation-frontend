<template>
  <a-layout-header class="global-header">
    <a-row :wrap="false" style="width: 100%">
      <a-col :span="6">
        <div class="left">
          <img class="logo" src="@/assets/logo.png" alt="logo" />
          <span class="title">Micro Station</span>
        </div>
      </a-col>

      <a-col :span="12">
        <div class="center">
          <a-menu
            mode="horizontal"
            theme="light"
            :selected-keys="selectedKeys"
            :items="menuItems"
            @click="handleMenuClick"
          />
        </div>
      </a-col>

      <a-col :span="6">
        <div class="right">
          <div v-if="loginUserStore.loginUser.id">
            <a-space>
              <a-avatar :src="loginUserStore.loginUser.userAvatar"/>
              {{loginUserStore.loginUser.userName ?? '无名'}}
            </a-space>
          </div>
          <div v-else>
            <a-button type="primary" href="/user/login">登录</a-button>
          </div>
        </div>
      </a-col>
    </a-row>
  </a-layout-header>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/loginUser.ts'

// 获取用户登录状态
const loginUserStore = useLoginUserStore();

type MenuItem = {
  key: string
  label: string
  path: string
}

const router = useRouter()

const menuItems = ref<MenuItem[]>([
  { key: 'home', label: '首页', path: '/' },
  { key: 'about', label: '关于', path: '/about' },
])

const selectedKeys = ref<string[]>(['home'])

const handleMenuClick = (info: { key: string }) => {
  const target = menuItems.value.find((item) => item.key === info.key)
  if (target) {
    selectedKeys.value = [target.key]
    router.push(target.path)
  }
}
</script>

<style scoped>
.global-header {
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: #ffffff;
  color: #000000;
  position: relative;
}

.left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.logo {
  width: 32px;
  height: 32px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  white-space: nowrap;
}

.center {
  /* 绝对定位，保证菜单在整个导航栏里严格居中 */
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.right {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .global-header {
    padding: 0 8px;
  }

  .center {
    position: static;
    transform: none;
    justify-content: flex-end;
  }

  .title {
    display: none;
  }
}
</style>

