import dayjs from 'dayjs'

/**
 * 统一日期时间展示格式。
 */
export const formatDateTime = (value?: string) => {
  if (!value) {
    return '-'
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
}
