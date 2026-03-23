import { notification } from 'ant-design-vue'

type NotifyContent = string
const notifyClassName = 'app-notify-centered'

/**
 * 统一全局提示：封装为类似 message 的调用方式，
 * 并复用 main.ts 中 notification.config 的全局位置配置。
 */
export const notify = {
  success(content: NotifyContent) {
    notification.success({
      class: notifyClassName,
      message: content,
    })
  },
  error(content: NotifyContent) {
    notification.error({
      class: notifyClassName,
      message: content,
    })
  },
  warning(content: NotifyContent) {
    notification.warning({
      class: notifyClassName,
      message: content,
    })
  },
  info(content: NotifyContent) {
    notification.info({
      class: notifyClassName,
      message: content,
    })
  },
}
