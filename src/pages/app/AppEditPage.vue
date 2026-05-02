<template>
  <div class="app-edit-page">
    <a-card :bordered="false" class="app-edit-card">
      <template #title>
        <div class="app-edit-title-row">
          <span>应用信息</span>
          <a-space>
            <a-button @click="goToChatPage" :disabled="!appId">进入对话页</a-button>
            <a-button type="primary" :loading="saving" :disabled="!canEdit" @click="handleSubmit">
              保存修改
            </a-button>
          </a-space>
        </div>
      </template>

      <a-alert
        v-if="!canEdit"
        type="info"
        show-icon
        class="app-edit-alert"
        message="当前页面为只读模式，只有应用创建者或管理员可以修改。"
      />
      <AppInfoForm
        v-model="formState"
        :app="appVo"
        :can-edit="canEdit"
        :is-admin="isAdmin"
        :show-readonly-info="true"
      />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppInfoForm from '@/components/AppInfoForm.vue'
import {
  adminGetAppById,
  adminUpdateApp,
  getAppVoById,
  updateApp,
} from '@/api/appController'
import { useLoginUserStore } from '@/stores/loginUser'
import { notify } from '@/utils/notify'

type AppVO = API.AppVO

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()
const appId = String(route.params.id || '')

const appVo = ref<AppVO>()
const saving = ref(false)

const formState = ref<{
  appName: string
  cover: string
  priority: number
}>({
  appName: '',
  cover: '',
  priority: 0,
})

/**
 * 是否为管理员。
 */
const isAdmin = computed(() => loginUserStore.loginUser.userRole === 'admin')

/**
 * 是否为应用创建者。
 */
const isOwner = computed(() => {
  return !!appVo.value?.userId && appVo.value.userId === loginUserStore.loginUser.id
})

/**
 * 是否可编辑。
 */
const canEdit = computed(() => {
  if (!loginUserStore.loginUser.id) {
    return false
  }
  return isAdmin.value || isOwner.value
})

/**
 * 获取应用详情。
 */
const fetchAppDetail = async () => {
  if (!appId) {
    notify.error('应用 ID 无效')
    await router.push('/')
    return
  }
  try {
    const appVoRes = await getAppVoById({ idStr: appId })
    if (appVoRes.data.code !== 0 || !appVoRes.data.data) {
      notify.error(appVoRes.data.message || '获取应用详情失败')
      return
    }
    appVo.value = appVoRes.data.data
    formState.value = {
      ...formState.value,
      appName: appVo.value.appName || '',
      cover: appVo.value.cover || '',
    }

    if (isAdmin.value) {
      const adminRes = await adminGetAppById({ idStr: appId })
      if (adminRes.data.code === 0 && adminRes.data.data) {
        formState.value = {
          ...formState.value,
          cover: adminRes.data.data.cover || '',
          priority: adminRes.data.data.priority ?? 0,
        }
      }
    }
  } catch {
    notify.error('获取应用详情失败，请稍后重试')
  }
}

/**
 * 提交编辑。
 */
const handleSubmit = async () => {
  if (!canEdit.value) {
    notify.warning('当前无修改权限')
    return
  }
  if (!appId) {
    notify.error('应用 ID 无效')
    return
  }
  if (!formState.value.appName.trim()) {
    notify.warning('请输入应用名称')
    return
  }

  saving.value = true
  try {
    if (isAdmin.value) {
      const res = await adminUpdateApp({
        id: appId,
        appName: formState.value.appName.trim(),
        cover: formState.value.cover.trim() || undefined,
        priority: formState.value.priority,
      })
      if (res.data.code === 0) {
        notify.success('应用信息更新成功')
        await fetchAppDetail()
        return
      }
      notify.error(res.data.message || '更新失败')
      return
    }

    const res = await updateApp({
      id: appId,
      appName: formState.value.appName.trim(),
      cover: formState.value.cover.trim() || undefined,
    })
    if (res.data.code === 0) {
      notify.success('应用信息更新成功')
      await fetchAppDetail()
      return
    }
    notify.error(res.data.message || '更新失败')
  } catch {
    notify.error('更新失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

/**
 * 跳转到对话页。
 */
const goToChatPage = async () => {
  if (!appId) {
    return
  }
  await router.push(`/app/chat/${appId}`)
}

onMounted(() => {
  fetchAppDetail()
})
</script>

<style scoped>
.app-edit-page {
  padding: 24px 16px 40px;
}

.app-edit-card {
  width: min(960px, 100%);
  margin: 0 auto;
  border-radius: 20px;
}

.app-edit-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.app-edit-alert {
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .app-edit-page {
    padding: 16px 12px 24px;
  }

  .app-edit-title-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
