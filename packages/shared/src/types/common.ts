import type { Token } from 'marked'

/**
 * 渲染器选项（新主题系统）
 * 主题样式通过 CSS 注入，不再通过 JS 对象传递
 * 注意：isUseIndent 和 isUseJustify 现在通过 CSS 变量系统处理，不需要传递给渲染器
 */
export interface IOpts {
  legend?: string
  citeStatus?: boolean
  countStatus?: boolean
  isMacCodeBlock?: boolean
  isShowLineNumber?: boolean
  themeMode?: 'light' | 'dark'
  /**
   * KaTeX/MathJax 渲染模式：
   * - 'mathjax'     : 原 doocs/md 行为，依赖 window.MathJax（仅浏览器可用）
   * - 'passthrough' : 不渲染 LaTeX，把原始公式输出为 <code>，Node 友好（默认）
   */
  katexMode?: 'mathjax' | 'passthrough'
}

export interface IConfigOption<VT = string> {
  label: string
  value: VT
  desc: string
}

/**
 * Options for the `markedAlert` extension.
 */
export interface AlertOptions {
  className?: string
  variants?: AlertVariantItem[]
  withoutStyle?: boolean
}

/**
 * Configuration for an alert type.
 */
export interface AlertVariantItem {
  type: string
  icon: string
  title?: string
  titleClassName?: string
}

/**
 * Represents an alert token.
 */
export interface Alert {
  type: `alert`
  meta: {
    className: string
    variant: string
    icon: string
    title: string
    titleClassName: string
  }
  raw: string
  text: string
  tokens: Token[]
}

export interface PostAccount {
  avatar?: string
  displayName: string
  home: string
  icon: string
  supportTypes?: string[]
  title: string
  type: string
  uid: string
  checked: boolean
  loggedIn?: boolean
  isChecking?: boolean
  status?: string
  error?: string
}

export interface Post {
  title: string
  desc: string
  thumb: string
  content: string
  markdown: string
  accounts: PostAccount[]
}
