import { DEFAULT_CODE_GEN_TYPE } from '@/constants/codeGenType'

type PreviewableApp = Pick<API.AppVO, 'id' | 'deployKey' | 'codeGenType'> | null | undefined

const deployDomain = (import.meta.env.VITE_DEPLOY_DOMAIN || '').replace(/\/$/, '')
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

/**
 * 将相对地址转换为当前站点下的绝对地址。
 */
const resolveAbsoluteUrl = (url: string) => {
  if (!url) {
    return ''
  }
  if (/^https?:\/\//i.test(url)) {
    return url
  }
  if (url.startsWith('/') && typeof window !== 'undefined') {
    return `${window.location.origin}${url}`
  }
  return url
}

/**
 * 构建应用预览地址。
 */
export const buildAppPreviewUrl = (app: PreviewableApp) => {
  if (!app) {
    return ''
  }
  if (app.deployKey) {
    const deployBaseUrl = resolveAbsoluteUrl(deployDomain)
    return deployBaseUrl ? `${deployBaseUrl}/${app.deployKey}/` : ''
  }
  if (!app.id) {
    return ''
  }
  const apiBasePath = resolveAbsoluteUrl(apiBaseUrl)
  return apiBaseUrl
    ? `${apiBasePath}/static/${app.codeGenType || DEFAULT_CODE_GEN_TYPE}_${app.id}/`
    : ''
}
