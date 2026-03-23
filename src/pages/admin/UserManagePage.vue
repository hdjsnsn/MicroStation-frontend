<template>
  <div id="userManagePage" class="user-manage-page">
    <div class="user-manage-inner">
      <!-- 搜索一行靠右 -->
      <div class="search-row">
        <a-form layout="inline" :model="searchParams" @finish="doSearch">
          <a-form-item label="账号">
            <a-input v-model:value="searchParams.userAccount" placeholder="输入账号" />
          </a-form-item>
          <a-form-item label="用户名">
            <a-input v-model:value="searchParams.userName" placeholder="输入用户名" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit">搜索</a-button>
          </a-form-item>
        </a-form>
      </div>

      <a-divider />

      <a-table class="user-manage-table" :columns="columns" :data-source="data" :pagination="pagination"
        :scroll="{ x: 1000  }" @change="doTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'userAccount'">
            <!-- 账号列：仅在可能被截断时显示浅色详情 -->
            <a-tooltip v-if="shouldShowTooltip(record.userAccount, 24)" :title="record.userAccount || '-'"
              color="#f7f8fa" :overlay-inner-style="{ color: '#1f2937' }">
              <div class="user-account-cell">
                {{ record.userAccount || '-' }}
              </div>
            </a-tooltip>
            <div v-else class="user-account-cell">
              {{ record.userAccount || '-' }}
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'userName'">
            <!-- 用户昵称列：仅在可能被截断时显示浅色详情 -->
            <a-tooltip v-if="shouldShowTooltip(record.userName, 18)" :title="record.userName || '-'" color="#f7f8fa"
              :overlay-inner-style="{ color: '#1f2937' }">
              <div class="user-name-cell">
                {{ record.userName || '-' }}
              </div>
            </a-tooltip>
            <div v-else class="user-name-cell">
              {{ record.userName || '-' }}
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'userAvatar'">
            <!-- 用户头像列：统一尺寸，避免超大图片撑开表格 -->
            <div class="user-avatar-cell">
              <a-image :src="record.userAvatar" :width="80" :height="80"
                style="object-fit: cover; border-radius: 6px" />
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'userRole'">
            <div v-if="record.userRole === 'admin'">
              <a-tag color="green">管理员</a-tag>
            </div>
            <div v-else>
              <a-tag color="blue">普通用户</a-tag>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'userProfile'">
            <!-- 用户简介列：仅在可能被截断时显示浅色详情 -->
            <a-tooltip v-if="shouldShowTooltip(record.userProfile, 70)" :title="record.userProfile || '-'"
              color="#f7f8fa" :overlay-inner-style="{ color: '#1f2937' }">
              <div class="user-profile-cell">
                {{ record.userProfile || '-' }}
              </div>
            </a-tooltip>
            <div v-else class="user-profile-cell">
              {{ record.userProfile || '-' }}
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'createTime'">
            {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="primary" @click="handleEdit(record)">修改</a-button>
              <a-button type="primary" danger @click="openDeleteConfirm(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
      <!-- 删除确认弹窗（居中 + 遮罩点击关闭 + 自定义左右按钮） -->
      <a-modal v-model:open="deleteModalOpen" centered :maskClosable="true"
        :maskStyle="{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }" :closable="true" class="delete-confirm-modal"
        title="确认删除" @cancel="closeDeleteConfirm">
        <div v-if="deleteTarget" class="delete-confirm-text">
          确定要删除 <strong>{{ deleteTarget.userAccount ?? deleteTarget.id ?? '' }}</strong> 吗？
        </div>

        <template #footer>
          <!-- 主操作（左侧蓝色实心），次操作（右侧白色描边） -->
          <div class="delete-confirm-footer">
            <a-button type="primary" :loading="deleteLoading" @click="confirmDelete">
              确定
            </a-button>
            <a-button class="btn-cancel" :disabled="deleteLoading" @click="closeDeleteConfirm">
              取消
            </a-button>
          </div>
        </template>
      </a-modal>
    </div>
  </div>
</template>

<script lang="ts" setup>
/// <reference path="../../api/typings.d.ts" />
import { computed, onMounted, reactive, ref } from 'vue'
import { deleteUser, listUserVoByPage } from '@/api/userController'
import dayjs from 'dayjs'
import { notify } from '@/utils/notify'
import { useLoginUserStore } from '@/stores/loginUser'
type UserVO = API.UserVO
/** 表头与单元格均水平居中 */
const colCenter = { align: 'center' as const }

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    ...colCenter,
    width: 210,
  },
  {
    title: '账号',
    dataIndex: 'userAccount',
    ...colCenter,
    width: 130,
  },
  {
    title: '用户昵称',
    dataIndex: 'userName',
    ...colCenter,
    width: 130,
  },
  {
    title: '用户头像',
    dataIndex: 'userAvatar',
    ...colCenter,
    width: 150,
  },
  {
    title: '用户简介',
    dataIndex: 'userProfile',
    ...colCenter,
    width: 210,
  },
  {
    title: '用户角色',
    dataIndex: 'userRole',
    ...colCenter,
    width: 130,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    ...colCenter,
    width: 200,
  },
  {
    title: '操作',
    key: 'action',
    ...colCenter,
    width: 200,
  },
]

const data = ref<API.UserVO[]>([])
const total = ref(0)

/**
 * 文本较短时不显示详情悬浮，避免无意义的 tooltip。
 * 这里使用长度阈值做轻量判断，满足列表场景性能与体验。
 */
const shouldShowTooltip = (text: string | null | undefined, threshold: number) => {
  return (text ?? '').trim().length > threshold
}

// 搜索条件
const searchParams = reactive<API.UserQueryRequest>({
  pageNum: 1,
  pageSize: 10,
})

// 获取数据
const fetchData = async () => {
  const res = await listUserVoByPage({
    ...searchParams,
  })
  if (res.data.data) {
    data.value = res.data.data.records ?? []
    total.value = Number(res.data.data.totalRow ?? 0)
  } else {
    notify.error('获取数据失败，原因：' + res.data.message)
  }
}

// 分页参数
const pagination = computed(() => {
  return {
    current: searchParams.pageNum ?? 1,
    pageSize: searchParams.pageSize ?? 10,
    total: total.value,
    showSizeChanger: true,
    // 分页器本地化：将 "page" 文案改为 "页"
    locale: {
      items_per_page: '条 / 页',
    },
    showTotal: (total: number) => `共 ${total} 条`,
  }
})

// 表格变化处理
const doTableChange = (page: { current: number; pageSize: number }) => {
  searchParams.pageNum = page.current
  searchParams.pageSize = page.pageSize
  fetchData()
}

const doSearch = () => {
  // 重置页码
  searchParams.pageNum = 1
  fetchData()
}

/** 修改用户（可在此打开弹窗或跳转编辑页） */
const handleEdit = (record: UserVO) => {
  notify.info(`编辑用户：${record.userAccount ?? record.id}`)
}

/** 删除用户 */
const deleteModalOpen = ref(false)
const deleteLoading = ref(false)
const deleteTarget = ref<UserVO | null>(null)

const openDeleteConfirm = (record: UserVO) => {
  deleteTarget.value = record
  deleteModalOpen.value = true
}

const closeDeleteConfirm = () => {
  deleteModalOpen.value = false
  deleteLoading.value = false
  deleteTarget.value = null
}

const handleDelete = async (record: UserVO) => {
  const loginUserStore = useLoginUserStore()
  const id = record.id
  if (!id) {
    notify.error('删除失败：用户 ID 缺失')
    return false
  }
  if (id == loginUserStore.loginUser.id) {
    notify.error('删除失败：无法删除正在登录的用户')
    return false
  }

  try {
    const res = await deleteUser({ id })
    if (res.data?.code === 0) {
      notify.success(`删除用户：${record.userAccount ?? id} 成功`)
      await fetchData()
      return true
    }
    notify.error(res.data?.message || '删除失败，请重试')
    return false
  } catch {
    notify.error('删除失败，请稍后重试')
    return false
  }
}

const confirmDelete = async () => {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  await handleDelete(deleteTarget.value)
  closeDeleteConfirm()
}

// 页面加载时请求一次
onMounted(() => {
  fetchData()
})

</script>

<style scoped>
/* 整体区域约占页面宽度的 3/4，水平居中 */
.user-manage-page {
  width: 75%;
  max-width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  padding: 0 16px;
}

.user-manage-inner {
  width: 100%;
}

/* 搜索行靠右 */
.search-row {
  padding-top: 25px;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 0 8px;
}

.search-row :deep(.ant-form) {
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* 与列 align:center 一致，保证表头、数据格整体居中 */
.user-manage-table :deep(.ant-table-thead > tr > th),
.user-manage-table :deep(.ant-table-tbody > tr > td) {
  text-align: center;
  vertical-align: middle;
}

/* 账号列：宽度较小，限制 2 行 */
.user-account-cell {
  max-width: 150px;
  margin: 0 auto;
  overflow: hidden;
  text-align: left;
  line-height: 20px;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

/* 用户昵称列：宽度中等，限制 2 行 */
.user-name-cell {
  max-width: 130px;
  margin: 0 auto;
  overflow: hidden;
  text-align: left;
  line-height: 20px;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

/* 用户简介列：宽度更大，限制 3 行 */
.user-profile-cell {
  max-width: 220px;
  margin: 0 auto;
  overflow: hidden;
  text-align: left;
  line-height: 20px;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

/* 用户头像列：限制尺寸并保持居中 */
.user-avatar-cell {
  width: 80px;
  height: 50px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 6px;
}

.delete-confirm-modal :deep(.ant-modal-content) {
  background: #111827;
  /* 深色内容，便于白色描边按钮可见 */
  border-radius: 12px;
}

.delete-confirm-modal :deep(.ant-modal-header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
}

.delete-confirm-modal :deep(.ant-modal-title) {
  color: #ffffff;
}

.delete-confirm-modal :deep(.ant-modal-body) {
  color: #ffffff;
}

.delete-confirm-modal :deep(.ant-modal-footer) {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
}

.delete-confirm-text {
  font-size: 15px;
  color: #070707;
  padding: 5px 0 0 0;
}

.delete-confirm-sub {
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.9);
}

.delete-confirm-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.delete-confirm-footer .btn-cancel {
  background: transparent;
  border: 1px solid #000000;
  color: #000000;
}

.delete-confirm-footer .btn-cancel:hover {
  background: transparent !important;
  color: #989595 !important;
  border-color: #989595 !important;
}

/* 覆盖 ant-design-vue 默认 hover/禁用样式，确保“取消”始终黑色边框+黑色字体 */
.delete-confirm-modal :deep(.ant-btn.btn-cancel),
.delete-confirm-modal :deep(.ant-btn.btn-cancel:hover),
.delete-confirm-modal :deep(.ant-btn.btn-cancel:active),
.delete-confirm-modal :deep(.ant-btn.btn-cancel[disabled]) {
  background: transparent !important;
  border-color: #000000 !important;
  color: #000000 !important;
  box-shadow: none !important;
}

@media (max-width: 768px) {
  .user-manage-page {
    width: 100%;
  }
}
</style>
