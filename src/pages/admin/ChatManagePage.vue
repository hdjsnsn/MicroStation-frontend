<template>
  <div class="chat-manage-page">
    <div class="chat-manage-inner">
      <div class="search-row">
        <a-form layout="inline" :model="searchParams" @finish="doSearch">
          <a-form-item label="应用 ID">
            <a-input v-model:value="searchParams.appId" placeholder="输入应用 ID" style="width: 180px" />
          </a-form-item>
          <a-form-item label="用户 ID">
            <a-input v-model:value="searchParams.userId" placeholder="输入用户 ID" style="width: 180px" />
          </a-form-item>
          <a-form-item label="消息类型">
            <a-select v-model:value="searchParams.messageType" placeholder="选择消息类型" allow-clear style="width: 160px">
              <a-select-option value="user">用户消息</a-select-option>
              <a-select-option value="ai">AI 消息</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="消息内容">
            <a-input v-model:value="searchParams.message" placeholder="输入消息内容" style="width: 220px" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit">搜索</a-button>
          </a-form-item>
        </a-form>
      </div>

      <a-divider />

      <a-table class="chat-manage-table" :columns="columns" :data-source="data" :pagination="pagination"
        :scroll="{ x: 1300 }" row-key="id" @change="doTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'messageType'">
            {{ getChatMessageTypeLabel(record.messageType) }}
          </template>
          <template v-else-if="column.dataIndex === 'message'">
            <TruncateTooltipText :text="record.message" max-width="320px" :lines="2" :threshold="40" />
          </template>
          <template v-else-if="column.dataIndex === 'createTime'">
            {{ formatDateTime(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space class="action-space" :size="8">
              <a-button type="primary" class="action-button" :disabled="!record.appId" @click="handleViewApp(record)">
                查看应用
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
/// <reference path="../../api/typings.d.ts" />
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listAllChatHistoryByPageForAdmin } from '@/api/chatHistoryController'
import TruncateTooltipText from '@/components/TruncateTooltipText.vue'
import { formatDateTime } from '@/utils/date'
import { getChatMessageTypeLabel } from '@/utils/chatHistory'
import { notify } from '@/utils/notify'

type ChatHistoryVO = API.ChatHistoryVO

const colCenter = { align: 'center' as const }
const router = useRouter()

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 120,
    ...colCenter,
  },
  {
    title: '应用 ID',
    dataIndex: 'appId',
    width: 120,
    ...colCenter,
  },
  {
    title: '用户 ID',
    dataIndex: 'userId',
    width: 120,
    ...colCenter,
  },
  {
    title: '消息类型',
    dataIndex: 'messageType',
    width: 120,
    ...colCenter,
  },
  {
    title: '消息内容',
    dataIndex: 'message',
    width: 360,
    ...colCenter,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
    ...colCenter,
  },
  {
    title: '操作',
    key: 'action',
    width: 140,
    ...colCenter,
  },
]

const data = ref<ChatHistoryVO[]>([])
const total = ref(0)

const searchParams = reactive<API.ChatHistoryQueryRequest>({
  pageNum: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
  appId: '',
  userId: '',
  messageType: undefined,
  message: '',
})

/**
 * 获取对话历史列表。
 */
const fetchData = async () => {
  try {
    const res = await listAllChatHistoryByPageForAdmin({
      ...searchParams,
      appId: searchParams.appId?.trim() || undefined,
      userId: searchParams.userId?.trim() || undefined,
      message: searchParams.message?.trim() || undefined,
    })
    if (res.data.code === 0 && res.data.data) {
      data.value = res.data.data.records ?? []
      total.value = Number(res.data.data.totalRow ?? 0)
      return
    }
    notify.error(res.data.message || '获取对话历史失败')
  } catch {
    notify.error('获取对话历史失败，请稍后重试')
  }
}

/**
 * 分页参数。
 */
const pagination = computed(() => {
  return {
    current: searchParams.pageNum ?? 1,
    pageSize: searchParams.pageSize ?? 10,
    total: total.value,
    showSizeChanger: true,
    showTotal: (value: number) => `共 ${value} 条`,
    locale: {
      items_per_page: '条 / 页',
    },
  }
})

/**
 * 搜索。
 */
const doSearch = () => {
  searchParams.pageNum = 1
  fetchData()
}

/**
 * 处理表格分页。
 */
const doTableChange = (page: { current: number; pageSize: number }) => {
  searchParams.pageNum = page.current
  searchParams.pageSize = page.pageSize
  fetchData()
}

/**
 * 跳转到对应应用对话页。
 */
const handleViewApp = async (record: ChatHistoryVO) => {
  if (!record.appId) {
    return
  }
  await router.push(`/app/chat/${record.appId}`)
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.chat-manage-page {
  width: 80%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 16px 24px;
  box-sizing: border-box;
}

.chat-manage-inner {
  width: 100%;
}

.search-row {
  padding-top: 25px;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.search-row :deep(.ant-form) {
  flex-wrap: wrap;
  gap: 8px 0;
}

.chat-manage-table :deep(.ant-table-thead > tr > th),
.chat-manage-table :deep(.ant-table-tbody > tr > td) {
  text-align: center;
  vertical-align: middle;
}

.action-space {
  flex-wrap: nowrap;
}

.action-button {
  min-width: 72px;
}

@media (max-width: 768px) {
  .chat-manage-page {
    width: 100%;
    padding: 0 12px 16px;
  }
}
</style>
