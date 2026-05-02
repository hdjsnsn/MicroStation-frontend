<template>
  <a-form layout="vertical">
    <!-- 基础可编辑信息 -->
    <a-form-item label="应用名称" required>
      <a-input v-model:value="appNameValue" :maxlength="256" :disabled="!canEdit" placeholder="请输入应用名称" />
    </a-form-item>

    <!-- 可编辑扩展字段 -->
    <a-row :gutter="16">
      <a-col :xs="24" :md="showReadonlyInfo ? 12 : 24">
        <a-form-item label="应用封面">
          <a-input v-model:value="coverValue" :disabled="!canEdit" placeholder="请输入应用封面 URL" />
        </a-form-item>
      </a-col>
      <a-col v-if="isAdmin" :xs="24" :md="showReadonlyInfo ? 12 : 24">
        <a-form-item label="精选">
          <a-switch v-model:checked="featuredValue" :disabled="!canEdit" checked-children="已精选"
            un-checked-children="未精选" />
        </a-form-item>
      </a-col>
    </a-row>

    <!-- 详情页补充信息 -->
    <template v-if="showReadonlyInfo">
      <a-form-item label="初始提示词">
        <a-textarea :value="initPromptText" :auto-size="{ minRows: 4, maxRows: 8 }" disabled />
      </a-form-item>

      <a-row :gutter="16">
        <a-col :xs="24" :md="12">
          <a-form-item label="生成类型">
            <a-input :value="codeGenLabel" disabled />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :md="12">
          <a-form-item label="创建者">
            <a-input :value="creatorName" disabled />
          </a-form-item>
        </a-col>
      </a-row>
    </template>

    <!-- 部署信息 -->
    <a-row v-if="showReadonlyInfo" :gutter="16">
      <a-col :xs="24" :md="12">
        <a-form-item label="部署密钥">
          <a-input :value="deployKeyText" disabled />
        </a-form-item>
      </a-col>
      <a-col :xs="24" :md="12">
        <a-form-item label="部署时间">
          <a-input :value="deployedTimeText" disabled />
        </a-form-item>
      </a-col>
    </a-row>
  </a-form>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getCodeGenTypeLabel } from '@/constants/codeGenType'

type AppInfoFormState = {
  appName: string
  cover: string
  priority: number
}

const props = withDefaults(
  defineProps<{
    modelValue: AppInfoFormState
    app?: API.AppVO
    canEdit?: boolean
    isAdmin?: boolean
    showReadonlyInfo?: boolean
  }>(),
  {
    app: undefined,
    canEdit: true,
    isAdmin: false,
    showReadonlyInfo: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: AppInfoFormState]
}>()

/**
 * 更新表单字段，保持父组件状态单一来源。
 */
const updateField = <K extends keyof AppInfoFormState>(key: K, value: AppInfoFormState[K]) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}

const appNameValue = computed({
  get: () => props.modelValue.appName,
  set: (value: string) => updateField('appName', value),
})

const coverValue = computed({
  get: () => props.modelValue.cover,
  set: (value: string) => updateField('cover', value),
})

const featuredValue = computed({
  get: () => props.modelValue.priority === 99,
  set: (value: boolean) => updateField('priority', value ? 99 : 0),
})

const initPromptText = computed(() => props.app?.initPrompt || '暂无初始提示词')
const creatorName = computed(() => props.app?.user?.userName || '未知')
const deployKeyText = computed(() => props.app?.deployKey || '未部署')
const deployedTimeText = computed(() => props.app?.deployedTime || '未部署')
const codeGenLabel = computed(() => getCodeGenTypeLabel(props.app?.codeGenType, 'full'))
</script>

<style scoped></style>
