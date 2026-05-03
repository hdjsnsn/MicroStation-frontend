<template>
  <a-layout-header class="global-header">
    <div class="global-header-inner">
      <!-- 左侧：Logo + 标题 -->
      <div class="left">
        <img class="logo" src="@/assets/logo.png" alt="logo" />
        <span class="title">Micro Station</span>
      </div>

      <!-- 中侧：菜单（纯 flex 居中，避免 absolute 导致的错位） -->
      <div class="center">
        <a-menu mode="horizontal" theme="light" :selected-keys="selectedKeys" :items="menuItems"
          :disabledOverflow="true" @click="handleMenuClick" />
      </div>

      <!-- 右侧：用户信息/登录按钮 -->
      <div class="right">
        <div v-if="loginUserStore.loginUser.id">
          <a-dropdown :trigger="['click']" placement="bottomRight">
            <a class="user-dropdown-trigger" @click.prevent>
              <a-space>
                <UserAvatar :src="loginUserStore.loginUser.userAvatar" :name="loginUserStore.loginUser.userName" />
                <span class="user-name">{{ loginUserStore.loginUser.userName ?? '无名' }}</span>
              </a-space>
            </a>
            <template #overlay>
              <a-menu @click="handleUserMenuClick">
                <a-menu-item style="color: red; text-align: center" key="logout"> 登出 </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
        <div v-else>
          <a-button type="primary" href="/user/login">登录</a-button>
        </div>
      </div>
    </div>
  </a-layout-header>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logout } from '@/api/loginController'
import UserAvatar from '@/components/UserAvatar.vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { notify } from '@/utils/notify'

// 获取用户登录状态
const loginUserStore = useLoginUserStore()
const router = useRouter()
const route = useRoute()

type MenuItem = {
  key: string
  label: string
  path: string
}

// 菜单配置项
const originItems = ref<MenuItem[]>([
  { key: 'home', label: '首页', path: '/' },
  { key: 'userManage', label: '用户管理', path: '/admin/userManage' },
  { key: 'appManage', label: '应用管理', path: '/admin/appManage' },
  { key: 'chatManage', label: '对话管理', path: '/admin/chatManage' },
])

// 过滤菜单项
const filterMenus = (menus = [] as MenuItem[]) => {
  return menus?.filter((menu) => {
    const menuPath = menu?.path as string
    const loginUser = loginUserStore.loginUser
    if (menuPath === '/admin/userManage') {
      if (!loginUser || loginUser.userRole !== 'admin') {
        return false
      }
    }
    if (menuPath === '/admin/chatManage') {
      if (!loginUser || loginUser.userRole !== 'admin') {
        return false
      }
    }
    if (menuPath === '/admin/appManage') {
      if (!loginUser || !loginUser.id) {
        return false
      }
    }
    return true
  })
}

// 展示在菜单的路由数组
const menuItems = computed<MenuItem[]>(() => filterMenus(originItems.value))

// 根据当前路由确定选中项（避免固定写死导致的视觉错位）
const selectedKeys = computed<string[]>(() => {
  if (route.path === '/') {
    return ['home']
  }
  if (route.path.startsWith('/admin')) {
    if (route.path.startsWith('/admin/appManage')) {
      return ['appManage']
    }
    if (route.path.startsWith('/admin/chatManage')) {
      return ['chatManage']
    }
    return ['userManage']
  }
  if (route.path.startsWith('/app/')) {
    return []
  }
  return ['home']
})

const handleMenuClick = (info: { key: string }) => {
  const target = menuItems.value.find((item) => item.key === info.key)
  if (target) {
    router.push(target.path)
  }
}

/** 用户名下拉菜单：登出 */
const handleUserMenuClick = async (info: { key: string }) => {
  if (info.key !== 'logout') {
    return
  }
  try {
    const res = await logout()
    if (res.data.code === 0) {
      loginUserStore.clearLoginUser()
      notify.success('已登出')
      await router.push('/user/login')
      return
    }
    notify.error(res.data.message || '登出失败')
  } catch {
    notify.error('登出失败，请稍后重试')
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

/* 纯 flex 布局：左/中/右三段式，菜单永远居中 */
.global-header-inner {
  width: 100%;
  display: flex;
  align-items: center;
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
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.right {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.user-dropdown-trigger {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  color: inherit;
}

.user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .global-header {
    padding: 0 8px;
  }

  .center {
    justify-content: flex-end;
  }

  .title {
    display: none;
  }
}
</style>
