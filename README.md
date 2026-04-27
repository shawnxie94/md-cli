# 微信 Markdown 编辑器

一个面向微信公众号排版的 Markdown 编辑器。它可以将 Markdown 内容渲染为适合微信公众号图文编辑器粘贴的 HTML，并提供在线编辑、本地服务和命令行渲染能力。

## 基本能力

- 支持常用 Markdown 语法、代码块、表格、列表、引用、图片等内容。
- 支持代码高亮，并可选择不同代码块主题。
- 支持 Mermaid、PlantUML、数学公式、GFM 警告块、Ruby 注音等扩展语法。
- 支持主题、字体、字号、主题色、标题样式、图注、段落缩进和两端对齐等排版配置。
- 支持本地内容管理、文件导入导出和图片上传。
- 支持通过 Web 页面进行可视化编辑，也支持通过 `md-cli` 在脚本中直接渲染 Markdown。

## 在线编辑器

官方在线编辑器：

[https://md.doocs.org](https://md.doocs.org)

## md-cli

`md-cli` 是本仓库提供的命令行工具，适合在自动化脚本中使用。它包含两类能力：

- 启动本地 Markdown 编辑器服务。
- 将 Markdown 文件直接渲染为微信公众号兼容 HTML。

当前发布包：

```bash
@shawnxie666/md-cli
```

### 安装

全局安装：

```bash
npm install -g @shawnxie666/md-cli
```

项目内安装：

```bash
npm install @shawnxie666/md-cli
```

不安装也可以通过 `npx` 直接使用：

```bash
npx --yes --package @shawnxie666/md-cli md-cli --help
```

### 启动本地编辑器

默认启动在 `127.0.0.1:8800`：

```bash
md-cli
```

指定端口：

```bash
md-cli port=8899
```

启动后访问：

```bash
open http://127.0.0.1:8899
```

### 渲染 Markdown

将 Markdown 渲染为微信公众号兼容 HTML：

```bash
md-cli render input.md --output output.html
```

输出到 stdout：

```bash
md-cli render input.md --stdout
```

复制到 macOS 剪贴板：

```bash
md-cli render input.md --copy
```

输出完整 HTML 文档：

```bash
md-cli render input.md --output output.html --full-html
```

### 排版参数

`render` 子命令支持运行时传入排版配置：

```bash
md-cli render input.md --output output.html \
  --theme grace \
  --font-family sans \
  --font-size recommended \
  --primary-color classic-blue \
  --heading-style default \
  --code-theme idea \
  --legend none \
  --mac-code-block false \
  --line-numbers false \
  --cite false \
  --count false \
  --indent false \
  --justify true
```

常用参数：

| 参数               | 说明                        | 示例                                                    |
| ------------------ | --------------------------- | ------------------------------------------------------- |
| `--theme`          | 正文主题                    | `default`、`grace`、`simple`                            |
| `--font-family`    | 字体                        | `sans`、`serif`、`mono`，或 CSS 字体值                  |
| `--font-size`      | 字号                        | `recommended`、`14px`、`15px`、`16px`、`17px`、`18px`   |
| `--primary-color`  | 主题色                      | `classic-blue`、`经典蓝`、`#0F4C81`                     |
| `--heading-style`  | 标题样式                    | `default`、`color-only`、`border-bottom`、`border-left` |
| `--code-theme`     | 代码高亮主题                | `idea`、`github`、`xcode`，或 CSS URL                   |
| `--legend`         | 图片图注                    | `none`、`alt`、`title`、`filename`                      |
| `--mac-code-block` | 是否显示 Mac 风格代码块头部 | `true`、`false`                                         |
| `--line-numbers`   | 是否显示代码行号            | `true`、`false`                                         |
| `--cite`           | 是否将微信外链转底部引用    | `true`、`false`                                         |
| `--count`          | 是否显示字数和阅读时间      | `true`、`false`                                         |
| `--indent`         | 是否段落首行缩进            | `true`、`false`                                         |
| `--justify`        | 是否段落两端对齐            | `true`、`false`                                         |
| `--custom-css`     | 追加自定义 CSS 文件         | `/path/to/custom.css`                                   |

也支持 `key=value` 形式：

```bash
md-cli render input.md output=output.html theme=grace font-family=sans justify=true
```

### 自动化示例

在脚本中直接使用 `npx`，适合不想提前全局安装的环境：

```bash
npx --yes --package @shawnxie666/md-cli md-cli render article.md \
  --output article.html \
  --theme grace \
  --font-family sans \
  --font-size recommended \
  --primary-color classic-blue \
  --code-theme idea \
  --legend none \
  --mac-code-block false \
  --line-numbers false \
  --cite false \
  --indent false \
  --justify true
```

## 本地开发

本仓库使用 pnpm workspace。根项目要求 Node.js `>=22.16.0`。

```bash
nvm i
nvm use
pnpm i
```

启动 Web 编辑器：

```bash
pnpm web dev
```

构建 Web 编辑器：

```bash
pnpm web build
```

构建并打包 CLI：

```bash
pnpm build:cli
```

只构建 `md-cli render` 的打包产物：

```bash
pnpm --filter @shawnxie666/md-cli run build:render
```

发布 CLI：

```bash
cd packages/md-cli
npm publish --access public --registry=https://registry.npmjs.org
```

## Docker

如果只需要运行 Web 编辑器，也可以使用 Docker 镜像：

```bash
docker run -d -p 8080:80 doocs/md:latest
```

然后访问：

```bash
open http://localhost:8080
```
