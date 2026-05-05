<template>
  <div class="app-chat-page">
    <header class="chat-header">
      <div class="chat-header-left">
        <a-button danger @click="goHome">返回</a-button>
        <div class="chat-title">{{ appDetail?.appName || '应用对话' }}</div>
      </div>
      <div class="chat-header-right">
        <a-button :disabled="!appDetail?.id" @click="openDetailModal">应用详情</a-button>
        <a-button
          v-if="canViewDeployInfo"
          type="primary"
          :disabled="!canDeploy || !appDetail?.id"
          :loading="deploying"
          @click="handleDeploy"
        >
          部署
        </a-button>
      </div>
    </header>

    <div ref="chatContentRef" class="chat-content" :style="chatContentStyle">
      <section class="chat-panel">
        <div ref="messageContainerRef" class="message-list">
          <div v-if="loadingHistory" class="message-history-loading">正在加载历史消息...</div>
          <div v-if="historyInitialized && hasMoreHistory" class="message-history-toolbar">
            <a-button type="link" :loading="loadingMoreHistory" @click="loadMoreHistory">
              加载更多
            </a-button>
          </div>
          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message-row', message.role === 'user' ? 'message-row--user' : 'message-row--assistant']"
          >
            <!-- 对话消息：AI 和用户均展示头像 -->
            <div v-if="message.role === 'assistant'" class="message-avatar message-avatar--assistant">
              <img :src="logoImage" alt="AI 头像" class="message-avatar-image" />
            </div>
            <div :class="['message-bubble', message.role === 'user' ? 'message-bubble--user' : 'message-bubble--assistant']">
              <div v-if="message.role === 'user'" class="message-text">{{ message.content }}</div>
              <div
                v-else
                class="markdown-body"
                v-html="renderAssistantMessage(message.content)"
              />
            </div>
            <div v-if="message.role === 'user'" class="message-avatar message-avatar--user">
              {{ currentUserInitial }}
            </div>
          </div>
          <a-empty
            v-if="historyInitialized && !messages.length"
            class="message-empty"
            description="输入你的需求，AI 会开始为你生成应用"
          />
        </div>

        <div class="input-panel">
          <a-textarea
            v-model:value="messageInput"
            :auto-size="{ minRows: 4, maxRows: 7 }"
            placeholder="描述你想继续生成或修改的页面，例如：帮我把首页改成浅色极简风，并增加联系我们模块"
            @pressEnter="handlePressEnter"
          />
          <div class="input-panel-footer">
            <div class="input-panel-hint">
              {{ canSendMessage ? '支持多轮对话生成，AI 回复完成后右侧会自动刷新预览' : '仅应用创建者可以继续生成和部署' }}
            </div>
            <a-button
              v-if="streaming"
              danger
              @click="stopStreaming"
            >
              停止
            </a-button>
            <a-button
              v-else
              type="primary"
              :disabled="!canSendMessage"
              @click="sendMessage()"
            >
              发送
            </a-button>
          </div>
        </div>
      </section>

      <div
        class="panel-resizer"
        :class="{ 'panel-resizer--active': resizing }"
        @mousedown="startResize"
      />

      <section class="preview-panel">
        <div class="preview-header">
          <div class="preview-title">生成后的网页展示</div>
          <a-button type="link" :disabled="!previewUrl" @click="openPreviewInNewWindow">在新窗口打开</a-button>
        </div>
        <div class="preview-body">
          <iframe
            v-if="previewUrl"
            :key="previewFrameKey"
            :src="previewUrl"
            class="preview-frame"
            title="应用预览"
          />
          <a-empty
            v-else
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
            description="完成一次代码生成或已有至少 2 条对话记录后，这里会展示最新的网站效果"
          />
        </div>
      </section>
    </div>

    <a-modal
      v-model:open="detailModalOpen"
      centered
      title="应用详情"
      :footer="null"
      @cancel="closeDetailModal"
    >
      <div class="app-detail-modal">
        <div class="app-detail-section">
          <div class="app-detail-section-title">应用基础信息</div>
          <div class="app-detail-item">
            <div class="app-detail-label">创建者</div>
            <div class="app-detail-creator">
              <UserAvatar :size="40" :src="appDetail?.user?.userAvatar" :name="appDetail?.user?.userName" fallback="创" />
              <span class="app-detail-value">{{ appDetail?.user?.userName || '未知用户' }}</span>
            </div>
          </div>
          <div class="app-detail-item">
            <div class="app-detail-label">创建时间</div>
            <div class="app-detail-value">{{ formatDateTime(appDetail?.createTime) }}</div>
          </div>
        </div>

        <div v-if="canEditApp" class="app-detail-section">
          <div class="app-detail-section-title">操作栏</div>
          <div class="app-detail-actions">
            <a-button type="primary" @click="openEditFromDetail">修改</a-button>
            <a-popconfirm
              title="确定删除该应用吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDeleteApp"
            >
              <a-button danger :loading="deleting">删除</a-button>
            </a-popconfirm>
          </div>
        </div>
      </div>
    </a-modal>

    <a-modal
      v-model:open="editModalOpen"
      centered
      title="编辑应用信息"
      ok-text="保存"
      cancel-text="取消"
      :confirm-loading="editLoading"
      @ok="handleEditSubmit"
      @cancel="closeEditModal"
    >
      <a-alert
        v-if="!canEditApp"
        type="info"
        show-icon
        class="edit-modal-alert"
        message="当前用户无修改权限，仅应用创建者或管理员可编辑。"
      />
      <AppInfoForm
        v-model="editFormState"
        :app="appDetail"
        :can-edit="canEditApp"
        :is-admin="isAdmin"
        :show-readonly-info="true"
      />
    </a-modal>

    <a-modal
      v-model:open="deployModalOpen"
      title="部署成功"
      ok-text="打开链接"
      cancel-text="关闭"
      @ok="openDeployUrl"
    >
      <div class="deploy-modal-text">应用已部署完成，可通过下面的地址访问：</div>
      <a-typography-paragraph copyable class="deploy-url">
        {{ deployUrl }}
      </a-typography-paragraph>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { Empty } from 'ant-design-vue'
import logoImage from '@/assets/logo.png'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
// @ts-ignore
import MarkdownIt from 'markdown-it'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppInfoForm from '@/components/AppInfoForm.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import {
  adminDeleteApp,
  adminGetAppById,
  adminUpdateApp,
  deleteApp,
  deployApp,
  getAppVoById,
  updateApp,
} from '@/api/appController'
import request from '@/request'
import { useLoginUserStore } from '@/stores/loginUser'
import { buildAppPreviewUrl } from '@/utils/app'
import { mapChatHistoryToMessage } from '@/utils/chatHistory'
import type { ChatMessage } from '@/utils/chatHistory'
import { formatDateTime } from '@/utils/date'
import { notify } from '@/utils/notify'

type StreamChunkPayload =
  | string
  | {
      d?: string
      data?: string
      content?: string
      message?: string
    }

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const appId = String(route.params.id || '')

const markdown = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
  highlight(code: string, language: string) {
    const normalizedLanguage = language?.trim().toLowerCase()
    if (normalizedLanguage && hljs.getLanguage(normalizedLanguage)) {
      return `<pre class="hljs"><code>${hljs.highlight(code, { language: normalizedLanguage }).value}</code></pre>`
    }
    return `<pre class="hljs"><code>${hljs.highlightAuto(code, ['html', 'xml', 'css', 'javascript', 'js', 'typescript', 'ts']).value}</code></pre>`
  },
})

const RESIZER_WIDTH = 12
const MIN_CHAT_PANEL_WIDTH = 320
const MIN_PREVIEW_PANEL_WIDTH = 360
const DESKTOP_BREAKPOINT = 992
const HISTORY_PAGE_SIZE = 10

const appDetail = ref<API.AppVO>()
const messageInput = ref('')
const messages = ref<ChatMessage[]>([])
const totalHistoryCount = ref(0)
const historyInitialized = ref(false)
const loadingHistory = ref(false)
const loadingMoreHistory = ref(false)
const hasMoreHistory = ref(false)
const oldestHistoryCreateTime = ref('')
const sessionGeneratedHistoryCount = ref(0)
const streaming = ref(false)
const deploying = ref(false)
const detailModalOpen = ref(false)
const editModalOpen = ref(false)
const editLoading = ref(false)
const previewUrl = ref('')
const previewFrameKey = ref(0)
const deployModalOpen = ref(false)
const deployUrl = ref('')
const deleting = ref(false)
const chatContentRef = ref<HTMLElement>()
const messageContainerRef = ref<HTMLElement>()
const chatPanelWidth = ref(420)
const viewportWidth = ref(window.innerWidth)
const resizing = ref(false)

let currentStreamController: AbortController | null = null
const loadedHistoryMessageIds = new Set<string>()

const isDesktopLayout = computed(() => viewportWidth.value > DESKTOP_BREAKPOINT)

const chatContentStyle = computed(() => {
  if (!isDesktopLayout.value) {
    return {}
  }
  return {
    gridTemplateColumns: `${chatPanelWidth.value}px ${RESIZER_WIDTH}px minmax(0, 1fr)`,
  }
})

/**
 * 约束左侧对话区域宽度，保证右侧预览区最小可用空间。
 */
const clampChatPanelWidth = (width: number) => {
  const containerWidth = chatContentRef.value?.clientWidth ?? 0
  if (!containerWidth) {
    return width
  }
  const maxWidth = Math.max(
    MIN_CHAT_PANEL_WIDTH,
    containerWidth - RESIZER_WIDTH - MIN_PREVIEW_PANEL_WIDTH
  )
  return Math.min(Math.max(width, MIN_CHAT_PANEL_WIDTH), maxWidth)
}

/**
 * 根据容器尺寸同步当前左右面板宽度。
 */
const syncPanelWidth = () => {
  viewportWidth.value = window.innerWidth
  if (!isDesktopLayout.value || !chatContentRef.value) {
    return
  }
  chatPanelWidth.value = clampChatPanelWidth(chatPanelWidth.value)
}

/**
 * 拖拽调整左右面板宽度。
 */
const handleResizeMove = (event: MouseEvent) => {
  if (!resizing.value || !chatContentRef.value) {
    return
  }
  const rect = chatContentRef.value.getBoundingClientRect()
  const nextWidth = event.clientX - rect.left
  chatPanelWidth.value = clampChatPanelWidth(nextWidth)
}

/**
 * 结束拖拽调整。
 */
const stopResize = () => {
  if (!resizing.value) {
    return
  }
  resizing.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', handleResizeMove)
  window.removeEventListener('mouseup', stopResize)
}

/**
 * 开始拖拽调整左右面板宽度。
 */
const startResize = () => {
  if (!isDesktopLayout.value) {
    return
  }
  resizing.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', handleResizeMove)
  window.addEventListener('mouseup', stopResize)
}

/**
 * 是否为应用创建者。
 */
const isOwner = computed(() => {
  return !!appDetail.value?.userId && appDetail.value.userId === loginUserStore.loginUser.id
})

/**
 * 当前用户是否可继续对话生成。
 */
const canSendMessage = computed(() => {
  return !!loginUserStore.loginUser.id && isOwner.value
})

/**
 * 当前用户是否可部署。
 */
const canDeploy = computed(() => {
  return !!loginUserStore.loginUser.id && (isOwner.value || isAdmin.value) && !streaming.value
})

/**
 * 是否展示部署相关信息。
 */
const canViewDeployInfo = computed(() => {
  return !!loginUserStore.loginUser.id && (isOwner.value || isAdmin.value)
})

/**
 * 是否为管理员。
 */
const isAdmin = computed(() => loginUserStore.loginUser.userRole === 'admin')

/**
 * 是否可编辑应用信息。
 */
const canEditApp = computed(() => {
  return !!loginUserStore.loginUser.id && (isOwner.value || isAdmin.value)
})

/**
 * 获取当前用户昵称首字符，作为用户头像占位。
 */
const currentUserInitial = computed(() => {
  const userName = loginUserStore.loginUser.userName?.trim()
  return userName ? userName.slice(0, 1) : '我'
})

const editFormState = ref<{
  appName: string
  priority: number
}>({
  appName: '',
  priority: 0,
})

/**
 * 滚动到底部，保证最新消息可见。
 */
const scrollToBottom = async () => {
  await nextTick()
  if (!messageContainerRef.value) {
    return
  }
  messageContainerRef.value.scrollTop = messageContainerRef.value.scrollHeight
}

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
    const res = await getAppVoById({ idStr: appId })
    if (res.data.code === 0 && res.data.data) {
      appDetail.value = res.data.data
      editFormState.value = {
        ...editFormState.value,
        appName: res.data.data.appName || '',
        priority: res.data.data.priority ?? 0,
      }
      syncPreviewUrlByHistory()
      return
    }
    notify.error(res.data.message || '获取应用详情失败')
  } catch {
    notify.error('获取应用详情失败，请稍后重试')
  }
}

/**
 * 关闭当前 SSE 连接。
 */
const closeCurrentStream = () => {
  currentStreamController?.abort()
  currentStreamController = null
}

/**
 * 根据历史消息数量同步预览地址。
 */
const syncPreviewUrlByHistory = () => {
  if (appDetail.value?.deployKey || totalHistoryCount.value >= 2) {
    previewUrl.value = buildAppPreviewUrl(appDetail.value)
    return
  }
  previewUrl.value = ''
}

/**
 * 合并历史消息，保持创建时间升序。
 */
const mergeHistoryMessages = (
  historyMessages: ChatMessage[],
  mode: 'replace' | 'prepend'
) => {
  const sortedMessages = [...historyMessages].sort((a, b) => {
    const left = new Date(a.createTime || '').getTime()
    const right = new Date(b.createTime || '').getTime()
    return left - right
  })
  if (mode === 'replace') {
    messages.value = sortedMessages
    return
  }
  const currentMessageMap = new Map(messages.value.map((item) => [item.id, item]))
  sortedMessages.forEach((item) => currentMessageMap.set(item.id, item))
  const currentIds = new Set(messages.value.map((item) => item.id))
  const prependMessages = sortedMessages.filter((item) => !currentIds.has(item.id))
  messages.value = [...prependMessages, ...messages.value]
}

/**
 * 拉取一页历史消息。
 */
const fetchChatHistoryPage = async (loadMore = false) => {
  if (!appId) {
    return
  }
  if (loadMore) {
    loadingMoreHistory.value = true
  } else {
    loadingHistory.value = true
  }
  try {
    const res = await request<API.BaseResponsePageChatHistoryVO>(`/chatHistory/app/${appId}`, {
      method: 'GET',
      params: {
        pageSize: HISTORY_PAGE_SIZE,
        lastCreateTime: loadMore ? oldestHistoryCreateTime.value || undefined : undefined,
      },
    })
    if (res.data.code === 0 && res.data.data) {
      const pageData = res.data.data
      const records = pageData.records ?? []
      const nextMessages = records.map(mapChatHistoryToMessage)
      if (!loadMore) {
        loadedHistoryMessageIds.clear()
      }
      nextMessages.forEach((item) => loadedHistoryMessageIds.add(item.id))
      mergeHistoryMessages(nextMessages, loadMore ? 'prepend' : 'replace')
      totalHistoryCount.value = Number(pageData.totalRow ?? 0)
      oldestHistoryCreateTime.value = messages.value[0]?.createTime || ''
      hasMoreHistory.value = loadedHistoryMessageIds.size < totalHistoryCount.value && records.length > 0
      historyInitialized.value = true
      syncPreviewUrlByHistory()
      if (!loadMore) {
        await scrollToBottom()
      }
      return
    }
    notify.error(res.data.message || '加载对话历史失败')
  } catch {
    notify.error('加载对话历史失败，请稍后重试')
  } finally {
    if (loadMore) {
      loadingMoreHistory.value = false
    } else {
      loadingHistory.value = false
      historyInitialized.value = true
    }
  }
}

/**
 * 加载更多历史消息。
 */
const loadMoreHistory = async () => {
  if (!hasMoreHistory.value || loadingMoreHistory.value) {
    return
  }
  const previousScrollHeight = messageContainerRef.value?.scrollHeight ?? 0
  const previousScrollTop = messageContainerRef.value?.scrollTop ?? 0
  await fetchChatHistoryPage(true)
  await nextTick()
  if (!messageContainerRef.value) {
    return
  }
  const nextScrollHeight = messageContainerRef.value.scrollHeight
  messageContainerRef.value.scrollTop = nextScrollHeight - previousScrollHeight + previousScrollTop
}

/**
 * 添加消息。
 */
const appendMessage = (role: ChatMessage['role'], content: string) => {
  const message: ChatMessage = {
    id: `${Date.now()}-${Math.random()}`,
    role,
    content,
    createTime: new Date().toISOString(),
  }
  messages.value.push(message)
  scrollToBottom()
  return messages.value[messages.value.length - 1] as ChatMessage
}

/**
 * 将 AI 回复渲染为 Markdown HTML。
 */
const renderAssistantMessage = (content: string) => {
  return markdown.render(content || '')
}

/**
 * 解析 SSE 返回的分片内容。
 */
const parseStreamChunk = (rawData: string) => {
  if (!rawData || rawData === '[DONE]') {
    return {
      done: rawData === '[DONE]',
      chunk: '',
    }
  }
  try {
    const parsed = JSON.parse(rawData) as StreamChunkPayload
    if (typeof parsed === 'string') {
      return {
        done: parsed === '[DONE]',
        chunk: parsed === '[DONE]' ? '' : parsed,
      }
    }
    return {
      done: false,
      chunk: parsed.d ?? parsed.data ?? parsed.content ?? parsed.message ?? '',
    }
  } catch {
    return {
      done: false,
      chunk: rawData,
    }
  }
}

/**
 * 将原始流文本尽可能转换为可展示内容。
 */
const extractDisplayChunk = (rawChunk: string) => {
  if (!rawChunk) {
    return ''
  }
  const normalizedChunk = rawChunk.replace(/\r/g, '')
  if (!normalizedChunk.includes('data:') && !normalizedChunk.includes('event:')) {
    return normalizedChunk
  }
  const lines = normalizedChunk.split('\n')
  const chunks: string[] = []
  for (const line of lines) {
    if (!line) {
      continue
    }
    if (line.startsWith('data:')) {
      const payload = line.slice(5).trimStart()
      const { done, chunk } = parseStreamChunk(payload)
      if (!done && chunk) {
        chunks.push(chunk)
      }
      continue
    }
    if (!line.startsWith('event:') && !line.startsWith(':')) {
      chunks.push(line)
    }
  }
  return chunks.join('')
}

/**
 * 发送消息给 AI，使用 SSE 流式展示回复。
 */
const sendMessage = async (presetMessage?: string) => {
  const content = (presetMessage ?? messageInput.value).trim()
  if (!content) {
    notify.warning('请输入消息内容')
    return
  }
  if (!canSendMessage.value) {
    notify.warning('只有应用创建者可以继续生成')
    return
  }
  if (!appDetail.value?.id) {
    notify.error('应用信息尚未加载完成')
    return
  }

  closeCurrentStream()
  streaming.value = true
  appendMessage('user', content)
  messageInput.value = ''

  const assistantMessage = appendMessage('assistant', '')
  let streamCompleted = false
  let hasReceivedChunk = false
  let streamFinishedNormally = false

  const query = new URLSearchParams({
    appIdStr: String(appDetail.value.id),
    message: content,
  })
  const abortController = new AbortController()
  currentStreamController = abortController

  const finishStream = async () => {
    if (streamCompleted) {
      return
    }
    streamCompleted = true
    streaming.value = false
    closeCurrentStream()
    if (hasReceivedChunk && assistantMessage.content.trim()) {
      sessionGeneratedHistoryCount.value += 2
      totalHistoryCount.value = Math.max(
        totalHistoryCount.value,
        loadedHistoryMessageIds.size + sessionGeneratedHistoryCount.value
      )
    }
    syncPreviewUrlByHistory()
    if (previewUrl.value) {
      previewFrameKey.value += 1
    }
    if (streamFinishedNormally) {
      await deployCurrentApp(false)
    }
  }

  try {
    const response = await fetch(`${apiBaseUrl}/app/chat/gen/code?${query.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'text/event-stream',
      },
      signal: abortController.signal,
    })
    if (!response.ok || !response.body) {
      throw new Error('stream request failed')
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let pendingBuffer = ''

    while (!streamCompleted) {
      const { value, done } = await reader.read()
      if (done) {
        if (pendingBuffer.trim()) {
          const tailChunk = extractDisplayChunk(pendingBuffer)
          if (tailChunk) {
            assistantMessage.content += tailChunk
            hasReceivedChunk = true
            await scrollToBottom()
          }
        }
        streamFinishedNormally = true
        await finishStream()
        break
      }

      const decodedChunk = decoder.decode(value, { stream: true })
      pendingBuffer = `${pendingBuffer}${decodedChunk}`
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')

      if (pendingBuffer.includes('[DONE]')) {
        const [beforeDone = ''] = pendingBuffer.split('[DONE]')
        const doneChunk = extractDisplayChunk(beforeDone)
        if (doneChunk) {
          assistantMessage.content += doneChunk
          hasReceivedChunk = true
          await scrollToBottom()
        }
        streamFinishedNormally = true
        await finishStream()
        break
      }

      let eventBoundaryIndex = pendingBuffer.indexOf('\n\n')
      while (eventBoundaryIndex >= 0) {
        const completeChunk = pendingBuffer.slice(0, eventBoundaryIndex + 2)
        pendingBuffer = pendingBuffer.slice(eventBoundaryIndex + 2)
        const displayChunk = extractDisplayChunk(completeChunk)
        if (displayChunk) {
          assistantMessage.content += displayChunk
          hasReceivedChunk = true
          await scrollToBottom()
        }
        eventBoundaryIndex = pendingBuffer.indexOf('\n\n')
      }

      if (!pendingBuffer.includes('data:') && !pendingBuffer.includes('event:')) {
        assistantMessage.content += pendingBuffer
        hasReceivedChunk = true
        pendingBuffer = ''
        await scrollToBottom()
      }
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return
    }
    if (!streamCompleted && !hasReceivedChunk) {
      assistantMessage.content = '生成失败，请稍后重试'
      notify.error('生成失败，请稍后重试')
    }
    await finishStream()
  }
}

/**
 * 首次进入自己的应用且无历史消息时，自动发送初始提示词。
 */
const tryAutoSendInitPrompt = async () => {
  if (!isOwner.value || !appDetail.value?.initPrompt || messages.value.length > 0) {
    return
  }
  await sendMessage(appDetail.value.initPrompt)
}

/**
 * 部署应用并展示访问地址。
 */
const deployCurrentApp = async (showSuccessModal = true) => {
  if (!appDetail.value?.id) {
    return
  }
  if (deploying.value) {
    return
  }
  deploying.value = true
  try {
    const res = await deployApp({
      appid: appDetail.value.id,
    })
    if (res.data.code === 0 && res.data.data) {
      const fallbackDeployUrl = res.data.data
      await fetchAppDetail()
      const latestPreviewUrl = buildAppPreviewUrl(appDetail.value)
      deployUrl.value = latestPreviewUrl || fallbackDeployUrl
      previewUrl.value = latestPreviewUrl || fallbackDeployUrl
      previewFrameKey.value += 1
      if (showSuccessModal) {
        deployModalOpen.value = true
        notify.success('部署成功')
      }
      return
    }
    notify.error(res.data.message || '部署失败')
  } catch {
    notify.error('部署失败，请稍后重试')
  } finally {
    deploying.value = false
  }
}

/**
 * 手动部署应用。
 */
const handleDeploy = async () => {
  await deployCurrentApp(true)
}

/**
 * 回车发送，Shift + Enter 换行。
 */
const handlePressEnter = (event: KeyboardEvent) => {
  if (event.shiftKey) {
    return
  }
  event.preventDefault()
  sendMessage()
}

/**
 * 打开部署结果地址。
 */
const openDeployUrl = () => {
  if (!deployUrl.value) {
    return
  }
  window.open(deployUrl.value, '_blank')
}

/**
 * 在新窗口打开当前预览地址。
 */
const openPreviewInNewWindow = () => {
  if (!previewUrl.value) {
    return
  }
  window.open(previewUrl.value, '_blank')
}

/**
 * 手动停止当前生成。
 */
const stopStreaming = () => {
  if (!streaming.value) {
    return
  }
  closeCurrentStream()
  streaming.value = false
  notify.info('已停止生成')
}

/**
 * 打开应用详情弹窗。
 */
const openDetailModal = () => {
  detailModalOpen.value = true
}

/**
 * 关闭应用详情弹窗。
 */
const closeDetailModal = () => {
  detailModalOpen.value = false
}

/**
 * 打开编辑弹窗。
 */
const openEditModal = async () => {
  if (!appDetail.value?.id) {
    return
  }
  editModalOpen.value = true
  editFormState.value = {
    appName: appDetail.value.appName || '',
    priority: appDetail.value.priority ?? 0,
  }
  if (!isAdmin.value) {
    return
  }
  try {
    const res = await adminGetAppById({ idStr: String(appDetail.value.id) })
    if (res.data.code === 0 && res.data.data) {
      editFormState.value = {
        appName: res.data.data.appName || '',
        priority: res.data.data.priority ?? 0,
      }
      return
    }
    notify.error(res.data.message || '获取应用信息失败')
  } catch {
    notify.error('获取应用信息失败，请稍后重试')
  }
}

/**
 * 从详情弹窗进入编辑。
 */
const openEditFromDetail = async () => {
  closeDetailModal()
  await openEditModal()
}

/**
 * 关闭编辑弹窗。
 */
const closeEditModal = () => {
  editModalOpen.value = false
  editLoading.value = false
}

/**
 * 提交编辑。
 */
const handleEditSubmit = async () => {
  if (!canEditApp.value) {
    notify.warning('当前无修改权限')
    return
  }
  if (!appDetail.value?.id) {
    return
  }
  if (!editFormState.value.appName.trim()) {
    notify.warning('请输入应用名称')
    return
  }
  editLoading.value = true
  try {
    if (isAdmin.value) {
      const res = await adminUpdateApp({
        id: String(appDetail.value.id),
        appName: editFormState.value.appName.trim(),
        priority: editFormState.value.priority,
      })
      if (res.data.code === 0) {
        notify.success('应用信息更新成功')
        closeEditModal()
        await fetchAppDetail()
        return
      }
      notify.error(res.data.message || '更新失败')
      return
    }
    const res = await updateApp({
      id: String(appDetail.value.id),
      appName: editFormState.value.appName.trim(),
    })
    if (res.data.code === 0) {
      notify.success('应用信息更新成功')
      closeEditModal()
      await fetchAppDetail()
      return
    }
    notify.error(res.data.message || '更新失败')
  } catch {
    notify.error('更新失败，请稍后重试')
  } finally {
    editLoading.value = false
  }
}

/**
 * 删除当前应用。
 */
const handleDeleteApp = async () => {
  if (!canEditApp.value || !appDetail.value?.id) {
    return
  }
  deleting.value = true
  try {
    const res = isAdmin.value
      ? await adminDeleteApp({ id: String(appDetail.value.id) })
      : await deleteApp({ id: String(appDetail.value.id) })
    if (res.data.code === 0) {
      notify.success('应用删除成功')
      closeDetailModal()
      await router.back()
      return
    }
    notify.error(res.data.message || '删除失败')
  } catch {
    notify.error('删除失败，请稍后重试')
  } finally {
    deleting.value = false
  }
}

/**
 * 返回上一页。
 */
const goHome = () => {
  router.back()
}

onMounted(async () => {
  await fetchAppDetail()
  await fetchChatHistoryPage()
  await tryAutoSendInitPrompt()
  syncPanelWidth()
  window.addEventListener('resize', syncPanelWidth)
})

onBeforeUnmount(() => {
  closeCurrentStream()
  stopResize()
  window.removeEventListener('resize', syncPanelWidth)
})
</script>

<style scoped>
.app-chat-page {
  min-height: 100vh;
  background: #f3f4f6;
}

.chat-header {
  height: 72px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.chat-header-left,
.chat-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-title {
  color: #111827;
  font-size: 24px;
  font-weight: 700;
}

.chat-content {
  height: calc(100vh - 72px);
  padding: 16px;
  display: grid;
  grid-template-columns: 420px 12px minmax(0, 1fr);
  gap: 16px;
}

.chat-panel,
.preview-panel {
  min-height: 0;
  min-width: 0;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #ffffff;
}

.panel-resizer {
  position: relative;
  cursor: col-resize;
}

.panel-resizer::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 4px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: #dbe2ea;
  transition: background 0.2s ease;
}

.panel-resizer:hover::before,
.panel-resizer--active::before {
  background: #93c5fd;
}

.chat-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.message-history-loading,
.message-history-toolbar {
  display: flex;
  justify-content: center;
}

.message-history-loading {
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 13px;
}

.message-history-toolbar {
  margin-bottom: 8px;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 14px;
}

.message-row--user {
  justify-content: flex-end;
}

.message-row--assistant {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 88%;
  padding: 14px 16px;
  border-radius: 18px;
  line-height: 1.7;
  word-break: break-word;
}

.message-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  font-size: 16px;
  font-weight: 600;
}

.message-avatar--assistant {
  border: 1px solid #dbe2ea;
  background: #ffffff;
}

.message-avatar--user {
  background: #2563eb;
  color: #ffffff;
}

.message-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-text {
  white-space: pre-wrap;
}

.message-bubble--user {
  background: #dbeafe;
  color: #1d4ed8;
}

.message-bubble--assistant {
  background: #f3f4f6;
  color: #111827;
}

.markdown-body {
  color: #111827;
  font-size: 14px;
}

.markdown-body :deep(p),
.markdown-body :deep(ul),
.markdown-body :deep(ol),
.markdown-body :deep(pre),
.markdown-body :deep(blockquote),
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 0 0 12px;
}

.markdown-body :deep(p:last-child),
.markdown-body :deep(ul:last-child),
.markdown-body :deep(ol:last-child),
.markdown-body :deep(pre:last-child),
.markdown-body :deep(blockquote:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  color: #0f172a;
  font-weight: 700;
  line-height: 1.4;
}

.markdown-body :deep(h1) {
  font-size: 24px;
}

.markdown-body :deep(h2) {
  font-size: 20px;
}

.markdown-body :deep(h3) {
  font-size: 18px;
}

.markdown-body :deep(a) {
  color: #2563eb;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 22px;
}

.markdown-body :deep(li + li) {
  margin-top: 6px;
}

.markdown-body :deep(blockquote) {
  padding: 10px 14px;
  border-left: 4px solid #93c5fd;
  border-radius: 8px;
  background: #eff6ff;
  color: #334155;
}

.markdown-body :deep(code:not(pre code)) {
  padding: 2px 6px;
  border-radius: 6px;
  background: #e5e7eb;
  color: #be123c;
  font-size: 13px;
}

.markdown-body :deep(pre) {
  overflow-x: auto;
  border-radius: 12px;
}

.markdown-body :deep(pre code) {
  display: block;
  padding: 16px;
  font-size: 13px;
  line-height: 1.7;
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 10px;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: 10px 12px;
  border: 1px solid #dbe2ea;
  text-align: left;
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 12px;
}

.message-empty {
  margin-top: 80px;
}

.input-panel {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eef2f7;
}

.input-panel-footer {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.input-panel-hint {
  color: #6b7280;
  font-size: 13px;
}

.preview-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preview-title {
  color: #111827;
  font-size: 20px;
  font-weight: 700;
}

.preview-body {
  flex: 1;
  min-height: 0;
  margin-top: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fafafa;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #ffffff;
}

.deploy-modal-text {
  color: #4b5563;
}

.deploy-url {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
}

.app-detail-modal {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.app-detail-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.app-detail-section-title {
  color: #111827;
  font-size: 16px;
  font-weight: 700;
}

.app-detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.app-detail-label {
  color: #6b7280;
  font-size: 14px;
  white-space: nowrap;
}

.app-detail-value {
  color: #111827;
  font-size: 14px;
}

.app-detail-creator {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-detail-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 992px) {
  .chat-content {
    height: auto;
    grid-template-columns: 1fr;
  }

  .panel-resizer {
    display: none;
  }

  .chat-panel {
    min-height: 60vh;
  }

  .preview-panel {
    min-height: 60vh;
  }
}

@media (max-width: 768px) {
  .chat-header {
    height: auto;
    padding: 12px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .chat-header-left,
  .chat-header-right {
    justify-content: space-between;
  }

  .chat-title {
    font-size: 18px;
  }

  .chat-content {
    padding: 12px;
  }

  .app-detail-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .input-panel-footer {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
