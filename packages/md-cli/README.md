# md-cli

A powerful yet simple tool for rendering Markdown documents locally during development.

## Installation

To get started with `md-cli`, you can install it either globally or locally, depending on your needs.

### Install locally

If you only need it for a specific project, you can install it locally by running:

```bash
npm install @shawnxie666/md-cli
```

### Install globally

For global access across all your projects, install it globally with:

```bash
npm install -g @shawnxie666/md-cli
```

## Usage

Once installed, running `md-cli` is a breeze. Here’s how to get started:

### Render Markdown for WeChat

Render a Markdown file to WeChat Official Account-compatible HTML:

```bash
md-cli render input.md --output output.html
```

Print to stdout:

```bash
md-cli render input.md --stdout
```

The render command supports runtime style options:

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
  --indent false \
  --justify true
```

Supported aliases:

- `--theme`: `default`, `grace`, `simple`
- `--font-family`: `sans`, `serif`, `mono`, or a CSS font-family value
- `--font-size`: `recommended`, `14px`, `15px`, `16px`, `17px`, `18px`
- `--primary-color`: `classic-blue`, Chinese color labels such as `经典蓝`, or a CSS color value
- `--heading-style`: `default`, `color-only`, `border-bottom`, `border-left`
- `--code-theme`: a highlight.js theme name such as `idea`, `github`, `xcode`, or a CSS URL
- `--legend`: `none`, `alt`, `title`, `filename`, or a combined legend expression

### Default setup

To launch `md-cli` with the default settings, simply run:

```bash
md-cli
```

### Custom port

If you prefer to run `md-cli` on a different port, say `8899`, just specify it like this:

```bash
md-cli port=8899
```
