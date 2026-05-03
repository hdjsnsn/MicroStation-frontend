<template>
  <div class="home-page">
    <section class="hero-section">
      <div class="hero-title">
        一句话
        <img class="hero-logo" src="@/assets/logo.png" alt="logo" />
        呈所想
      </div>
      <div class="hero-subtitle">与 AI 对话轻松创建网站</div>

      <div class="prompt-card">
        <a-textarea v-model:value="promptText" :auto-size="{ minRows: 5, maxRows: 8 }" class="prompt-input"
          placeholder="使用 NoCode 创建一个高效的小工具，帮我计算......" :maxlength="1000" />
        <div class="prompt-footer">
          <div class="prompt-actions">
            <a-button size="large" @click="fillPrompt('我想做一个个人博客应用，包含首页、文章列表和文章详情页')">
              博客应用
            </a-button>
            <a-button size="large" @click="fillPrompt('帮我做一个企业官网，包含首页、服务介绍和联系我们页面')">
              企业网站
            </a-button>
            <a-button size="large" @click="fillPrompt('帮我做一个电商商品后台，支持商品列表、查询和状态管理')">
              电商后台
            </a-button>
          </div>
          <a-button type="primary" size="large" :loading="creating" @click="handleCreateApp">
            开始生成
          </a-button>
        </div>
      </div>
    </section>

    <section class="list-section">
      <div class="section-header">
        <h2 class="section-title">我的作品</h2>
      </div>
      <template v-if="loginUserStore.loginUser.id">
        <div v-if="myApps.length" class="app-grid">
          <AppCard v-for="app in myApps" :key="app.id" :app="app" @chat="goToChatPage(app)"
            @preview="previewApp(app)" />
        </div>
        <a-empty v-else :image="Empty.PRESENTED_IMAGE_SIMPLE" description="还没有创建应用，试试上面的提示词" />
      </template>
      <a-empty v-else :image="Empty.PRESENTED_IMAGE_SIMPLE" description="登录后可查看自己的应用并继续创作" />
    </section>

    <section class="list-section">
      <div class="section-header">
        <h2 class="section-title">精选案例</h2>
      </div>
      <div v-if="featuredApps.length" class="app-grid app-grid--featured">
        <AppCard v-for="app in featuredApps" :key="app.id" :app="app" @chat="handleFeaturedAppClick(app)"
          @preview="previewApp(app)" />
      </div>
      <a-empty v-else :image="Empty.PRESENTED_IMAGE_SIMPLE" description="暂无精选应用" />
      <div v-if="featuredApps.length" ref="featuredLoadTriggerRef" class="featured-load-status">
        <span v-if="featuredLoading">正在加载更多精选案例...</span>
        <span v-else-if="hasMoreFeatured">继续下滑加载更多精选案例</span>
        <span v-else>已经到底了</span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Empty } from 'ant-design-vue'
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppCard from '@/components/AppCard.vue'
import { addApp, listFeaturedAppVoByPage, listMyAppVoByPage } from '@/api/appController'
import { useLoginUserStore } from '@/stores/loginUser'
import { buildAppPreviewUrl } from '@/utils/app'
import { notify } from '@/utils/notify'

type AppQueryRequest = API.AppQueryRequest
type AppVO = API.AppVO

const router = useRouter()
const loginUserStore = useLoginUserStore()

const promptText = ref('')
const creating = ref(false)

const myApps = ref<AppVO[]>([])
const featuredApps = ref<AppVO[]>([])
const featuredLoading = ref(false)
const hasMoreFeatured = ref(true)
const featuredLoadTriggerRef = ref<HTMLElement>()

const mySearchParams = reactive<AppQueryRequest>({
  pageNum: 1,
  pageSize: 3,
  sortField: 'createTime',
  sortOrder: 'descend',
})

const featuredSearchParams = reactive<AppQueryRequest>({
  pageNum: 1,
  pageSize: 9,
})

let featuredObserver: IntersectionObserver | null = null

/**
 * 将示例提示词写入输入框。
 */
const fillPrompt = (value: string) => {
  promptText.value = value
}

/**
 * 根据提示词生成应用名。
 */
const buildAppName = (value: string) => {
  const content = value.trim().replace(/\s+/g, ' ')
  const shortName = content.slice(0, 12)
  return shortName || '我的应用'
}

/**
 * 获取我的应用列表。
 */
const fetchMyApps = async () => {
  if (!loginUserStore.loginUser.id) {
    myApps.value = []
    return
  }
  try {
    const res = await listMyAppVoByPage({
      ...mySearchParams,
    })
    if (res.data.code === 0 && res.data.data) {
      myApps.value = res.data.data.records ?? []
      return
    }
    notify.error(res.data.message || '获取我的应用失败')
  } catch {
    notify.error('获取我的应用失败，请稍后重试')
  }
}

/**
 * 获取精选应用列表。
 */
const fetchFeaturedApps = async (reset = false) => {
  if (featuredLoading.value) {
    return
  }
  if (!reset && !hasMoreFeatured.value) {
    return
  }
  if (reset) {
    featuredSearchParams.pageNum = 1
    hasMoreFeatured.value = true
  }
  featuredLoading.value = true
  try {
    const res = await listFeaturedAppVoByPage({
      ...featuredSearchParams,
    })
    if (res.data.code === 0 && res.data.data) {
      const records = res.data.data.records ?? []
      featuredApps.value = reset ? records : [...featuredApps.value, ...records]
      const total = Number(res.data.data.totalRow ?? 0)
      hasMoreFeatured.value = featuredApps.value.length < total && records.length > 0
      if (hasMoreFeatured.value) {
        featuredSearchParams.pageNum = (featuredSearchParams.pageNum ?? 1) + 1
      }
      return
    }
    notify.error(res.data.message || '获取精选应用失败')
  } catch {
    notify.error('获取精选应用失败，请稍后重试')
  } finally {
    featuredLoading.value = false
  }
}

/**
 * 初始化精选案例滚动加载。
 */
const initFeaturedObserver = () => {
  featuredObserver?.disconnect()
  if (!featuredLoadTriggerRef.value) {
    return
  }
  featuredObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        fetchFeaturedApps()
      }
    },
    {
      root: null,
      rootMargin: '240px 0px',
      threshold: 0,
    }
  )
  featuredObserver.observe(featuredLoadTriggerRef.value)
}

/**
 * 创建应用并跳转到生成页。
 */
const handleCreateApp = async () => {
  const initPrompt = promptText.value.trim()
  if (!loginUserStore.loginUser.id) {
    notify.warning('请先登录')
    await router.push(`/user/login?redirect=${encodeURIComponent(window.location.href)}`)
    return
  }
  if (!initPrompt) {
    notify.warning('请输入应用需求描述')
    return
  }
  creating.value = true
  try {
    const res = await addApp({
      appName: buildAppName(initPrompt),
      initPrompt,
    })
    if (res.data.code === 0 && res.data.data) {
      notify.success('应用创建成功，正在进入对话页')
      promptText.value = ''
      await router.push(`/app/chat/${res.data.data}`)
      return
    }
    notify.error(res.data.message || '创建应用失败')
  } catch {
    notify.error('创建应用失败，请稍后重试')
  } finally {
    creating.value = false
  }
}

/**
 * 进入应用对话页。
 */
const goToChatPage = async (app: AppVO) => {
  if (!app.id) {
    return
  }
  await router.push(`/app/chat/${app.id}`)
}

/**
 * 预览应用。
 */
const previewApp = async (app: AppVO) => {
  const previewUrl = buildAppPreviewUrl(app)
  if (!previewUrl) {
    notify.warning('当前应用暂无可预览地址')
    return
  }
  window.open(previewUrl, '_blank')
}

/**
 * 处理精选案例点击。
 */
const handleFeaturedAppClick = async (app: AppVO) => {
  if (!app.id) {
    return
  }
  await router.push(`/app/chat/${app.id}`)
}

onMounted(() => {
  fetchFeaturedApps(true)
  fetchMyApps()
  initFeaturedObserver()
})

watch(
  () => loginUserStore.loginUser.id,
  () => {
    fetchMyApps()
  }
)

watch(featuredLoadTriggerRef, () => {
  initFeaturedObserver()
})

onBeforeUnmount(() => {
  featuredObserver?.disconnect()
  featuredObserver = null
})
</script>

<style scoped>
.home-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(94, 234, 212, 0.28), transparent 28%),
    radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.28), transparent 35%),
    linear-gradient(180deg, #f9fbfb 0%, #eefaf7 48%, #eef6ff 100%);
}

.hero-section {
  max-width: 1120px;
  margin: 0 auto 48px;
  padding: 64px 16px 0;
  text-align: center;
}

.hero-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #111827;
  font-size: 56px;
  line-height: 1.2;
  font-weight: 700;
}

.hero-logo {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.hero-subtitle {
  margin-top: 16px;
  color: #6b7280;
  font-size: 24px;
}

.prompt-card {
  margin: 36px auto 0;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08);
  text-align: left;
}

.prompt-input :deep(textarea) {
  min-height: 160px !important;
  border: none;
  box-shadow: none;
  resize: none;
  color: #111827;
  font-size: 18px;
}

.prompt-footer {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.prompt-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.list-section {
  max-width: 1320px;
  margin: 0 auto 44px;
  padding: 0 16px;
}

.section-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-title {
  margin: 0;
  color: #111827;
  font-size: 28px;
  font-weight: 700;
}

.section-search {
  width: 320px;
  max-width: 100%;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.app-grid--featured {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.pagination-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.featured-load-status {
  margin-top: 24px;
  padding: 8px 0 4px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

@media (max-width: 992px) {
  .hero-title {
    font-size: 40px;
  }

  .hero-subtitle {
    font-size: 18px;
  }

  .app-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .app-grid--featured {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .home-page {
    padding: 16px 0 24px;
  }

  .hero-section {
    padding-top: 32px;
  }

  .hero-title {
    font-size: 32px;
  }

  .hero-logo {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .prompt-card {
    padding: 16px;
  }

  .prompt-footer,
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .app-grid {
    grid-template-columns: 1fr;
  }

  .app-grid--featured {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .pagination-wrap {
    justify-content: center;
  }
}
</style>
