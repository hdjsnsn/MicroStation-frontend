export type ChatMessageRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatMessageRole
  content: string
  createTime?: string
}

/**
 * 将后端消息类型统一转换为前端对话角色。
 */
const normalizeChatMessageRole = (messageType?: string): ChatMessageRole => {
  const normalizedType = messageType?.trim().toLowerCase() || ''
  if (
    normalizedType === 'user'
    || normalizedType === 'human'
    || normalizedType.includes('user')
    || normalizedType.includes('human')
  ) {
    return 'user'
  }
  return 'assistant'
}

/**
 * 获取对话消息类型展示文案。
 */
export const getChatMessageTypeLabel = (messageType?: string) => {
  return normalizeChatMessageRole(messageType) === 'user' ? '用户消息' : 'AI 消息'
}

/**
 * 将对话历史记录转换为页面展示消息。
 */
export const mapChatHistoryToMessage = (record: API.ChatHistoryVO): ChatMessage => {
  return {
    id: String(record.id || `${record.createTime || Date.now()}-${Math.random()}`),
    role: normalizeChatMessageRole(record.messageType),
    content: record.message || '',
    createTime: record.createTime,
  }
}
