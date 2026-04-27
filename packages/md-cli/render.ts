#!/usr/bin/env node

import { initRenderer } from '@md/core/renderer'
import { postProcessHtml, renderMarkdown } from '@md/core/utils'
import juice from 'juice'
import { JSDOM } from 'jsdom'
import baseCSS from '../shared/src/configs/theme-css/base.css'
import defaultCSS from '../shared/src/configs/theme-css/default.css'
import graceCSS from '../shared/src/configs/theme-css/grace.css'
import simpleCSS from '../shared/src/configs/theme-css/simple.css'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { processCSS } from '../core/src/theme/cssProcessor'
import { generateCSSVariables, generateHeadingStyles } from '../core/src/theme/cssVariables'
import { wrapCSSWithScope } from '../core/src/theme/cssScopeWrapper'

type ThemeName = 'default' | 'grace' | 'simple'
type HeadingStyle = 'default' | 'color-only' | 'border-bottom' | 'border-left' | 'custom'

interface RenderOptions {
  input: string
  output?: string
  stdout: boolean
  copy: boolean
  theme: ThemeName
  fontFamily: string
  fontSize: string
  primaryColor: string
  headingStyle: HeadingStyle
  codeTheme: string
  legend: string
  macCodeBlock: boolean
  lineNumbers: boolean
  cite: boolean
  count: boolean
  indent: boolean
  justify: boolean
  customCSS?: string
  fullHtml: boolean
}

const codeBlockUrlPrefix = 'https://cdn-doocs.oss-cn-shenzhen.aliyuncs.com/npm/highlightjs/11.11.1/styles/'
const sansFont = '-apple-system-font,BlinkMacSystemFont, Helvetica Neue, PingFang SC, Hiragino Sans GB , Microsoft YaHei UI , Microsoft YaHei ,Arial,sans-serif'
const serifFont = 'Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, \'PingFang SC\', Cambria, Cochin, Georgia, Times, \'Times New Roman\', serif'
const monoFont = 'Menlo, Monaco, \'Courier New\', monospace'
const themeCSSMap: Record<ThemeName, string> = {
  default: defaultCSS,
  grace: graceCSS,
  simple: simpleCSS,
}

const aliases = {
  fonts: {
    sans: sansFont,
    'sans-serif': sansFont,
    无衬线: sansFont,
    serif: serifFont,
    衬线: serifFont,
    mono: monoFont,
    monospace: monoFont,
    等宽: monoFont,
  } as Record<string, string>,
  colors: {
    'classic-blue': '#0F4C81',
    blue: '#0F4C81',
    经典蓝: '#0F4C81',
    翡翠绿: '#009874',
    活力橘: '#FA5151',
    柠檬黄: '#FECE00',
    薰衣紫: '#92617E',
    天空蓝: '#55C9EA',
    玫瑰金: '#B76E79',
    橄榄绿: '#556B2F',
    石墨黑: '#333333',
    雾烟灰: '#A9A9A9',
    樱花粉: '#FFB7C5',
  } as Record<string, string>,
  fontSizes: {
    recommended: '16px',
    推荐: '16px',
    '14px': '14px',
    '15px': '15px',
    '16px': '16px',
    '17px': '17px',
    '18px': '18px',
  } as Record<string, string>,
} as const

function help(): string {
  return `
Usage:
  md-cli render <input.md> [--output output.html] [options]

Options:
  --stdout                         Print rendered HTML to stdout.
  --copy                           Copy rendered HTML to macOS clipboard.
  --theme <default|grace|simple>   Text theme. Default: grace.
  --font-family <sans|serif|mono|CSS value>
  --font-size <recommended|14px|15px|16px|17px|18px>
  --primary-color <classic-blue|#RRGGBB>
  --heading-style <default|color-only|border-bottom|border-left>
  --code-theme <idea|github|xcode|...>
  --legend <none|alt|title|filename|...>
  --mac-code-block <true|false>
  --line-numbers <true|false>
  --cite <true|false>
  --count <true|false>
  --indent <true|false>
  --justify <true|false>
  --custom-css <path.css>          Extra CSS appended after theme CSS.
  --full-html                      Output a complete HTML document.

The options also accept key=value form, for example:
  md-cli render input.md theme=grace font-family=sans justify=true
`.trim()
}

function parseArgs(argv: string[]): RenderOptions {
  const values: Record<string, string | boolean> = {}
  const positional: string[] = []

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '--help' || arg === '-h') {
      console.log(help())
      process.exit(0)
    }

    if (arg.includes('=') && !arg.startsWith('--')) {
      const [key, ...rest] = arg.split('=')
      values[key] = rest.join('=')
      continue
    }

    if (arg.startsWith('--')) {
      const rawKey = arg.slice(2)
      const [key, inlineValue] = rawKey.split('=', 2)
      if (inlineValue !== undefined) {
        values[key] = inlineValue
      }
      else if (argv[index + 1] && !argv[index + 1].startsWith('--')) {
        values[key] = argv[++index]
      }
      else {
        values[key] = true
      }
      continue
    }

    positional.push(arg)
  }

  const input = positional[0] || value(values, 'input')
  if (!input) {
    throw new Error('Missing input Markdown file. Run `md-cli render --help` for usage.')
  }

  return {
    input,
    output: value(values, 'output', 'o'),
    stdout: bool(values, false, 'stdout'),
    copy: bool(values, false, 'copy'),
    theme: oneOf(value(values, 'theme') || 'grace', ['default', 'grace', 'simple'], 'theme'),
    fontFamily: resolveFont(value(values, 'font-family', 'fontFamily') || 'sans'),
    fontSize: resolveMap(value(values, 'font-size', 'fontSize') || 'recommended', aliases.fontSizes, 'font-size'),
    primaryColor: resolveMap(value(values, 'primary-color', 'primaryColor', 'color') || 'classic-blue', aliases.colors, 'primary-color'),
    headingStyle: oneOf(value(values, 'heading-style', 'headingStyle') || 'default', ['default', 'color-only', 'border-bottom', 'border-left', 'custom'], 'heading-style'),
    codeTheme: resolveCodeTheme(value(values, 'code-theme', 'codeTheme') || 'idea'),
    legend: normalizeLegend(value(values, 'legend') || 'none'),
    macCodeBlock: bool(values, false, 'mac-code-block', 'macCodeBlock'),
    lineNumbers: bool(values, false, 'line-numbers', 'lineNumbers'),
    cite: bool(values, false, 'cite'),
    count: bool(values, false, 'count'),
    indent: bool(values, false, 'indent'),
    justify: bool(values, true, 'justify'),
    customCSS: value(values, 'custom-css', 'customCSS'),
    fullHtml: bool(values, false, 'full-html', 'fullHtml'),
  }
}

function value(values: Record<string, string | boolean>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const raw = values[key]
    if (raw !== undefined && raw !== true && raw !== false)
      return String(raw)
  }
  return undefined
}

function bool(values: Record<string, string | boolean>, defaultValue: boolean, ...keys: string[]): boolean {
  for (const key of keys) {
    const raw = values[key]
    if (raw === undefined)
      continue
    if (raw === true)
      return true
    if (raw === false)
      return false
    if (/^(true|1|yes|on)$/i.test(String(raw)))
      return true
    if (/^(false|0|no|off)$/i.test(String(raw)))
      return false
    throw new Error(`Invalid boolean for ${key}: ${raw}`)
  }
  return defaultValue
}

function oneOf<T extends string>(raw: string, allowed: readonly T[], name: string): T {
  if (allowed.includes(raw as T))
    return raw as T
  throw new Error(`Invalid ${name}: ${raw}. Allowed: ${allowed.join(', ')}`)
}

function resolveMap(raw: string, map: Record<string, string>, name: string): string {
  return map[raw] || raw
}

function resolveFont(raw: string): string {
  return aliases.fonts[raw] || raw
}

function resolveCodeTheme(raw: string): string {
  if (/^https?:\/\//.test(raw))
    return raw
  return `${codeBlockUrlPrefix}${raw}.min.css`
}

function normalizeLegend(raw: string): string {
  if (raw === 'none' || raw === 'false' || raw === 'off' || raw === '不显示')
    return ''
  return raw
}

function readThemeCSS(theme: ThemeName): string {
  const themeCSS = theme === 'default'
    ? defaultCSS
    : `${defaultCSS}\n\n${themeCSSMap[theme]}`
  return `${baseCSS}\n\n${wrapCSSWithScope(themeCSS, '#output')}`
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  return await response.text()
}

async function buildStyles(options: RenderOptions): Promise<string> {
  const headingStyles = options.headingStyle === 'default'
    ? {}
    : { h1: options.headingStyle, h2: options.headingStyle, h3: options.headingStyle, h4: options.headingStyle, h5: options.headingStyle, h6: options.headingStyle }

  const variables = {
    primaryColor: options.primaryColor,
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    isUseIndent: options.indent,
    isUseJustify: options.justify,
    headingStyles,
  }

  const variablesCSS = generateCSSVariables(variables)
  const themeCSS = readThemeCSS(options.theme)
  const headingCSS = generateHeadingStyles(variables)
  const customCSS = options.customCSS
    ? wrapCSSWithScope(fs.readFileSync(path.resolve(options.customCSS), 'utf8'), '#output')
    : ''

  const hljsCSS = await fetchText(options.codeTheme)
  const merged = [
    variablesCSS,
    themeCSS,
    headingCSS,
    customCSS,
    `#output .hljs.code__pre > .mac-sign { display: ${options.macCodeBlock ? 'flex' : 'none'}; }`,
    `#output h2 strong { color: inherit !important; }`,
    hljsCSS,
  ].filter(Boolean).join('\n\n')

  return processCSS(merged)
}

function createEmptyNode(document: Document): HTMLElement {
  const node = document.createElement('p')
  node.style.fontSize = '0'
  node.style.lineHeight = '0'
  node.style.margin = '0'
  node.innerHTML = '&nbsp;'
  return node
}

function modifyHtmlStructure(document: Document, root: HTMLElement): void {
  root.querySelectorAll('li > ul, li > ol').forEach((originalItem) => {
    originalItem.parentElement!.insertAdjacentElement('afterend', originalItem)
  })
}

function solveWeChatImage(root: HTMLElement): void {
  root.querySelectorAll('img').forEach((image) => {
    const width = image.getAttribute('width')
    const height = image.getAttribute('height')

    if (width) {
      image.removeAttribute('width')
      image.style.width = /^\d+$/.test(width) ? `${width}px` : width
    }

    if (height) {
      image.removeAttribute('height')
      image.style.height = /^\d+$/.test(height) ? `${height}px` : height
    }
  })
}

function postProcessForWeChat(html: string, styles: string, primaryColor: string): string {
  const copyStyles = styles
    .replace(/#output\s*\{/g, 'body {')
    .replace(/#output\s+/g, '')
    .replace(/^#output\s*/gm, '')
  const withStyles = `<style>${copyStyles}</style>${html}`
  const inlined = juice(withStyles, {
    inlinePseudoElements: true,
    preserveImportant: true,
    resolveCSSVariables: false,
  })

  const dom = new JSDOM(`<div id="output">${inlined}</div>`)
  const document = dom.window.document
  const root = document.querySelector('#output') as HTMLElement

  modifyHtmlStructure(document, root)
  root.innerHTML = root.innerHTML
    .replace(/([^-])top:(.*?)em/g, '$1transform: translateY($2em)')
    .replace(/hsl\(var\(--foreground\)\)/g, '#3f3f3f')
    .replace(/var\(--blockquote-background\)/g, '#f7f7f7')
    .replace(/var\(--md-primary-color\)/g, primaryColor)
    .replace(/--md-primary-color:.+?;/g, '')
    .replace(/--md-font-family:.+?;/g, '')
    .replace(/--md-font-size:.+?;/g, '')
    .replace(/<span class="nodeLabel"([^>]*)><p[^>]*>(.*?)<\/p><\/span>/g, '<span class="nodeLabel"$1>$2</span>')
    .replace(/<span class="edgeLabel"([^>]*)><p[^>]*>(.*?)<\/p><\/span>/g, '<span class="edgeLabel"$1>$2</span>')

  solveWeChatImage(root)

  root.insertBefore(createEmptyNode(document), root.firstChild)
  root.appendChild(createEmptyNode(document))

  root.querySelectorAll('.nodeLabel').forEach((node) => {
    const parent = node.parentElement
    const grand = parent?.parentElement
    if (!parent || !grand)
      return
    const xmlns = parent.getAttribute('xmlns')
    const style = parent.getAttribute('style')
    if (!xmlns || !style)
      return
    const section = document.createElement('section')
    section.setAttribute('xmlns', xmlns)
    section.setAttribute('style', style)
    section.innerHTML = parent.innerHTML
    grand.innerHTML = ''
    grand.appendChild(section)
  })

  root.innerHTML = root.innerHTML.replace(
    /<tspan([^>]*)>/g,
    '<tspan$1 style="fill: #333333 !important; color: #333333 !important; stroke: none !important;">',
  )

  root.querySelectorAll('.infographic-diagram').forEach((diagram) => {
    diagram.querySelectorAll('text').forEach((textElem) => {
      const dominantBaseline = textElem.getAttribute('dominant-baseline')
      const variantMap: Record<string, string> = {
        alphabetic: '',
        central: '0.35em',
        middle: '0.35em',
        hanging: '-0.55em',
        ideographic: '0.18em',
        'text-before-edge': '-0.85em',
        'text-after-edge': '0.15em',
      }
      if (dominantBaseline) {
        textElem.removeAttribute('dominant-baseline')
        const dy = variantMap[dominantBaseline]
        if (dy)
          textElem.setAttribute('dy', dy)
      }
    })
  })

  return root.innerHTML
}

async function copyToClipboard(html: string): Promise<void> {
  if (process.platform !== 'darwin')
    throw new Error('--copy currently supports macOS pbcopy only.')
  const { spawn } = await import('node:child_process')
  await new Promise<void>((resolve, reject) => {
    const child = spawn('pbcopy')
    child.stdin.end(html)
    child.on('error', reject)
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`pbcopy exited with ${code}`)))
  })
}

function wrapFullHtml(content: string, title = 'doocs-md-rendered'): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body>
${content}
</body>
</html>
`
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const markdown = fs.readFileSync(path.resolve(options.input), 'utf8')

  const renderer = initRenderer({
    isMacCodeBlock: options.macCodeBlock,
    isShowLineNumber: options.lineNumbers,
    citeStatus: options.cite,
    countStatus: options.count,
    legend: options.legend,
  })

  renderer.reset({
    isMacCodeBlock: options.macCodeBlock,
    isShowLineNumber: options.lineNumbers,
    citeStatus: options.cite,
    countStatus: options.count,
    legend: options.legend,
    themeMode: 'light',
  })

  const { html: baseHtml, readingTime } = renderMarkdown(markdown, renderer)
  const outputHtml = postProcessHtml(baseHtml, readingTime, renderer)
  const styles = await buildStyles(options)
  let result = postProcessForWeChat(outputHtml, styles, options.primaryColor)

  if (options.fullHtml)
    result = wrapFullHtml(result, path.basename(options.input))

  if (options.output)
    fs.writeFileSync(path.resolve(options.output), result, 'utf8')

  if (options.copy)
    await copyToClipboard(result)

  if (options.stdout || (!options.output && !options.copy))
    process.stdout.write(result)
}

main().catch((error) => {
  console.error(`md-cli render: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
