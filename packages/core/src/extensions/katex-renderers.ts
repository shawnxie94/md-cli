/**
 * 公式渲染模式：
 * - 'mathjax'    : 原 doocs/md 行为，依赖 window.MathJax（浏览器端）
 * - 'passthrough': 不渲染 LaTeX，把原始 `$...$` / `$$...$$` 输出为 <code>
 *                  （公众号看不到公式，但不会因 MathJax 缺失而崩）
 *
 * 未来若要支持真公式渲染，可以在这里加 'katex' 模式调用 `katex` npm 包（纯 JS，Node 可跑）。
 */

export type KatexRenderMode = 'mathjax' | 'passthrough'

export function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * passthrough 渲染器：把公式源样输出
 * - 行内：<code class="katex-inline">$...$</code>
 * - 块：  <section class="katex-block"><pre><code>$$...$$</code></pre></section>
 *
 * 这样在公众号编辑器里至少能看到原文，CSS 仍由 doocs/md 主题提供。
 */
export function passthroughRenderer(token: any, withStyle: boolean) {
  const display = token.displayMode ?? false
  const text = String(token.text || '')

  if (display) {
    if (withStyle) {
      return `<section class="katex-block"><pre><code>${escapeHtml(text)}</code></pre></section>`
    }
    return `<pre><code>${escapeHtml(text)}</code></pre>`
  }
  if (withStyle) {
    return `<code class="katex-inline">${escapeHtml(text)}</code>`
  }
  return `<code>${escapeHtml(text)}</code>`
}

/**
 * mathjax 渲染器：原 doocs/md 行为，依赖 window.MathJax
 * 仅在浏览器/Web 渲染时使用；Node 环境（无 window.MathJax）调用会抛错。
 */
export function mathjaxRenderer(token: any, withStyle: boolean) {
  const display = token.displayMode ?? false
  // @ts-expect-error MathJax is a global variable
  window.MathJax.texReset()
  // @ts-expect-error MathJax is a global variable
  const mjxContainer = window.MathJax.tex2svg(token.text, { display })
  const svg = mjxContainer.firstChild
  const width = svg.style[`min-width`] || svg.getAttribute(`width`)
  svg.removeAttribute(`width`)

  if (withStyle) {
    svg.style.display = `initial`
    svg.style.setProperty(`max-width`, `300vw`, `important`)
    svg.style.flexShrink = `0`
    svg.style.width = width
  }

  if (!display) {
    return `<span class="katex-inline">${svg.outerHTML}</span>`
  }
  return `<section class="katex-block">${svg.outerHTML}</section>`
}

export function selectKatexRenderer(mode: KatexRenderMode, withStyle: boolean) {
  if (mode === 'passthrough') {
    return (token: any) => passthroughRenderer(token, withStyle)
  }
  return (token: any) => mathjaxRenderer(token, withStyle)
}
