import { DEFAULT_CODE_GEN_TYPE, getCodeGenTypeLabel } from '@/constants/codeGenType'

type PreviewableApp = Pick<API.AppVO, 'id' | 'deployKey' | 'codeGenType'> | null | undefined

const deployDomain = (import.meta.env.VITE_DEPLOY_DOMAIN || '').replace(/\/$/, '')
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

/**
 * 构建应用预览地址。
 */
export const buildAppPreviewUrl = (app: PreviewableApp) => {
  if (!app) {
    return ''
  }
  if (app.deployKey) {
    return deployDomain ? `${deployDomain}/${app.deployKey}/` : ''
  }
  if (!app.id) {
    return ''
  }
  return apiBaseUrl
    ? `${apiBaseUrl}/static/${app.codeGenType || DEFAULT_CODE_GEN_TYPE}_${app.id}/`
    : ''
}

export { getCodeGenTypeLabel }
