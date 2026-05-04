<template>
  <div class="app-manage-page">
    <div class="app-manage-inner">
      <div class="search-row">
        <a-form layout="inline" :model="searchParams" @finish="doSearch">
          <a-form-item label="应用名称">
            <a-input v-model:value="searchParams.appName" placeholder="输入应用名称" />
          </a-form-item>
          <a-form-item v-if="isAdmin" label="创建人 ID">
            <a-input v-model:value="searchParams.userId" placeholder="输入用户 ID" style="width: 180px" />
          </a-form-item>
          <a-form-item label="部署标识">
            <a-input v-model:value="searchParams.deployKey" placeholder="输入 deployKey" />
          </a-form-item>
          <a-form-item v-if="isAdmin" label="精选">
            <a-select v-model:value="searchParams.priority" placeholder="选择精选状态" allow-clear style="width: 140px">
              <a-select-option :value="99">已精选</a-select-option>
              <a-select-option :value="0">未精选</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit">搜索</a-button>
          </a-form-item>
        </a-form>
      </div>

      <a-divider />

      <a-table class="app-manage-table" :columns="columns" :data-source="data" :pagination="pagination"
        :scroll="{ x: 1500 }" row-key="id" @change="doTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'appName'">
            <!-- 应用名称：单行省略，悬停展示完整内容 -->
            <TruncateTooltipText
              :text="record.appName"
              max-width="100px"
              :always-tooltip="true"
            />
          </template>
          <template v-else-if="column.dataIndex === 'priority'">
            <a-button v-if="isAdmin" :type="record.priority === 99 ? 'primary' : 'default'"
              @click="handleFeature(record)">
              {{ record.priority === 99 ? '已精选' : '设为精选' }}
            </a-button>
            <span v-else>{{ record.priority === 99 ? '已精选' : '未精选' }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'user'">
            {{ record.user?.userName || record.userId || '-' }}
          </template>
          <template v-else-if="column.dataIndex === 'codeGenType'">
            {{ getCodeGenTypeLabel(record.codeGenType, 'full') }}
          </template>
          <template v-else-if="column.dataIndex === 'createTime'">
            {{ formatDateTime(record.createTime) }}
          </template>
          <template v-else-if="column.dataIndex === 'deployKey'">
            {{ record.deployKey || '未部署' }}
          </template>
          <template v-else-if="column.dataIndex === 'deployedTime'">
            {{ record.deployedTime ? formatDateTime(record.deployedTime) : '未部署' }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space class="action-space" :size="8">
              <a-button class="action-button" @click="handlePreview(record)">预览</a-button>
              <a-button type="primary" class="action-button" @click="handleEdit(record)">编辑</a-button>
              <a-button type="primary" danger class="action-button" @click="openDeleteConfirm(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <a-modal v-model:open="editModalOpen" centered title="编辑应用信息" ok-text="保存" cancel-text="取消"
        :confirm-loading="editLoading" @ok="confirmEdit" @cancel="closeEditModal">
        <AppInfoForm
          v-model="editFormState"
          :app="editAppDetail"
          :can-edit="true"
          :is-admin="isAdmin"
          :show-readonly-info="true"
        />
      </a-modal>

      <a-modal v-model:open="deleteModalOpen" centered title="确认删除" ok-text="确定" cancel-text="取消"
        :confirm-loading="deleteLoading" @ok="confirmDelete">
        <div v-if="deleteTarget">
          确定要删除应用 <strong>{{ deleteTarget.appName || deleteTarget.id }}</strong> 吗？
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
/// <reference path="../../api/typings.d.ts" />
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppInfoForm from '@/components/AppInfoForm.vue'
import TruncateTooltipText from '@/components/TruncateTooltipText.vue'
import { getCodeGenTypeLabel } from '@/constants/codeGenType'
import {
  adminDeleteApp,
  adminGetAppById,
  adminListAppVoByPage,
  adminUpdateApp,
  deleteApp,
  getAppVoById,
  listMyAppVoByPage,
  updateApp,
} from '@/api/appController'
import { useLoginUserStore } from '@/stores/loginUser'
import { formatDateTime } from '@/utils/date'
import { notify } from '@/utils/notify'

type AppVO = API.AppVO

const colCenter = { align: 'center' as const }
const router = useRouter()
const loginUserStore = useLoginUserStore()
const isAdmin = computed(() => loginUserStore.loginUser.userRole === 'admin')

const columns = computed(() => {
  const baseColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 180,
      ...colCenter,
    },
    {
      title: '应用名称',
      dataIndex: 'appName',
      width: 120,
      ...colCenter,
    },
    {
      title: '代码类型',
      dataIndex: 'codeGenType',
      width: 120,
      ...colCenter,
    },
    {
      title: '部署标识',
      dataIndex: 'deployKey',
      width: 140,
      ...colCenter,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
      ...colCenter,
    },
    {
      title: '部署时间',
      dataIndex: 'deployedTime',
      width: 180,
      ...colCenter,
    },
  ]
  if (isAdmin.value) {
    baseColumns.splice(2, 0, {
      title: '创建人',
      dataIndex: 'user',
      width: 110,
      ...colCenter,
    })
    baseColumns.splice(5, 0, {
      title: '精选',
      dataIndex: 'priority',
      width: 120,
      ...colCenter,
    })
  }
  return [
    ...baseColumns,
    {
      title: '操作',
      key: 'action',
      width: 250,
      ...colCenter,
    },
  ]
})

const data = ref<AppVO[]>([])
const total = ref(0)
const editModalOpen = ref(false)
const editLoading = ref(false)
const editTarget = ref<AppVO | null>(null)
const editAppDetail = ref<AppVO>()
const deleteModalOpen = ref(false)
const deleteLoading = ref(false)
const deleteTarget = ref<AppVO | null>(null)

const searchParams = reactive<API.AppQueryRequest>({
  pageNum: 1,
  pageSize: 10,
  sortField: 'id',
  sortOrder: 'descend',
  appName: '',
})

const editFormState = ref<{
  appName: string
  priority: number
}>({
  appName: '',
  priority: 0,
})

/**
 * 获取应用列表。
 */
const fetchData = async () => {
  try {
    const res = isAdmin.value
      ? await adminListAppVoByPage({
        ...searchParams,
      })
      : await listMyAppVoByPage({
        ...searchParams,
      })
    if (res.data.code === 0 && res.data.data) {
      data.value = res.data.data.records ?? []
      total.value = Number(res.data.data.totalRow ?? 0)
      return
    }
    notify.error(res.data.message || '获取应用列表失败')
  } catch {
    notify.error('获取应用列表失败，请稍后重试')
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
 * 预览应用。
 */
const handlePreview = async (record: AppVO) => {
  if (!record.id) {
    return
  }
  await router.push(`/app/chat/${record.id}`)
}

/**
 * 编辑应用。
 */
const handleEdit = async (record: AppVO) => {
  if (!record.id) {
    return
  }
  editTarget.value = record
  editAppDetail.value = record
  editModalOpen.value = true
  editFormState.value = {
    appName: record.appName || '',
    priority: record.priority ?? 0,
  }

  try {
    const appVoRes = await getAppVoById({ idStr: String(record.id) })
    if (appVoRes.data.code === 0 && appVoRes.data.data) {
      editAppDetail.value = appVoRes.data.data
      editFormState.value = {
        ...editFormState.value,
        appName: appVoRes.data.data.appName || '',
        priority: appVoRes.data.data.priority ?? 0,
      }
    } else {
      notify.error(appVoRes.data.message || '获取应用详情失败')
      return
    }
    if (isAdmin.value) {
      const adminRes = await adminGetAppById({ idStr: String(record.id) })
      if (adminRes.data.code === 0 && adminRes.data.data) {
        editFormState.value = {
          ...editFormState.value,
          priority: adminRes.data.data.priority ?? 0,
        }
        return
      }
      notify.error(adminRes.data.message || '获取应用详情失败')
    }
  } catch {
    notify.error('获取应用详情失败，请稍后重试')
  }
}

/**
 * 关闭编辑弹窗。
 */
const closeEditModal = () => {
  editModalOpen.value = false
  editLoading.value = false
  editTarget.value = null
  editAppDetail.value = undefined
}

/**
 * 确认编辑。
 */
const confirmEdit = async () => {
  if (!editTarget.value?.id) {
    return
  }
  if (!editFormState.value.appName.trim()) {
    notify.warning('请输入应用名称')
    return
  }
  editLoading.value = true
  try {
    const res = isAdmin.value
      ? await adminUpdateApp({
        id: String(editTarget.value.id),
        appName: editFormState.value.appName.trim(),
        priority: editFormState.value.priority,
      })
      : await updateApp({
        id: String(editTarget.value.id),
        appName: editFormState.value.appName.trim(),
      })
    if (res.data.code === 0) {
      notify.success('应用信息更新成功')
      closeEditModal()
      await fetchData()
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
 * 切换精选状态。
 */
const handleFeature = async (record: AppVO) => {
  if (!isAdmin.value) {
    return
  }
  if (!record.id) {
    return
  }
  try {
    const res = await adminUpdateApp({
      id: String(record.id),
      priority: record.priority === 99 ? 0 : 99,
    })
    if (res.data.code === 0) {
      notify.success(record.priority === 99 ? '已取消精选' : '已设置为精选')
      await fetchData()
      return
    }
    notify.error(res.data.message || '操作失败')
  } catch {
    notify.error('操作失败，请稍后重试')
  }
}

/**
 * 打开删除弹窗。
 */
const openDeleteConfirm = (record: AppVO) => {
  deleteTarget.value = record
  deleteModalOpen.value = true
}

/**
 * 确认删除。
 */
const confirmDelete = async () => {
  if (!deleteTarget.value?.id) {
    return
  }
  deleteLoading.value = true
  try {
    const res = isAdmin.value
      ? await adminDeleteApp({ id: String(deleteTarget.value.id) })
      : await deleteApp({ id: String(deleteTarget.value.id) })
    if (res.data.code === 0) {
      notify.success('删除成功')
      deleteModalOpen.value = false
      deleteTarget.value = null
      await fetchData()
      return
    }
    notify.error(res.data.message || '删除失败')
  } catch {
    notify.error('删除失败，请稍后重试')
  } finally {
    deleteLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.app-manage-page {
  width: 80%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 16px 24px;
  box-sizing: border-box;
}

.app-manage-inner {
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

.app-manage-table :deep(.ant-table-thead > tr > th),
.app-manage-table :deep(.ant-table-tbody > tr > td) {
  text-align: center;
  vertical-align: middle;
}

.action-space {
  flex-wrap: nowrap;
}

.action-button {
  min-width: 56px;
}

@media (max-width: 768px) {
  .app-manage-page {
    width: 100%;
    padding: 0 12px 16px;
  }
}
</style>
