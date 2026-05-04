/**
 * 代码生成类型常量，和后端枚举保持一致。
 */
export const CODE_GEN_TYPE = {
  HTML: 'html',
  MULTI_FILE: 'multi_file',
  VUE: "vue"
} as const

export type CodeGenType = (typeof CODE_GEN_TYPE)[keyof typeof CODE_GEN_TYPE]

export const DEFAULT_CODE_GEN_TYPE: CodeGenType = CODE_GEN_TYPE.MULTI_FILE

/**
 * 代码生成类型文案映射。
 */
export const CODE_GEN_TYPE_LABEL_MAP: Record<
  CodeGenType,
  {
    short: string
    full: string
  }
> = {
  [CODE_GEN_TYPE.HTML]: {
    short: 'HTML',
    full: 'HTML 模式',
  },
  [CODE_GEN_TYPE.MULTI_FILE]: {
    short: '多文件',
    full: '多文件模式',
  },
  [CODE_GEN_TYPE.VUE]: {
    short: 'vue',
    full: 'vue模式',
  },
}

/**
 * 获取代码生成类型文案。
 */
export const getCodeGenTypeLabel = (
  codeGenType?: string,
  mode: 'short' | 'full' = 'full'
) => {
  const labelConfig = codeGenType
    ? CODE_GEN_TYPE_LABEL_MAP[codeGenType as CodeGenType]
    : undefined
  if (!labelConfig) {
    return mode === 'short' ? '应用' : '未知类型'
  }
  return labelConfig[mode]
}
