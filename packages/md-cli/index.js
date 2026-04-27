#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import getPort from 'get-port'
import {
  colors,
  parseArgv,
} from './util.js'
import { createServer } from './server.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

if (process.argv[2] === 'render') {
  const renderScript = join(__dirname, 'bin/render.js')
  if (!existsSync(renderScript)) {
    console.error('md-cli render: missing bundled renderer. Run `npm run build:render` before using the local source checkout.')
    process.exit(1)
  }

  const result = spawnSync(process.execPath, [renderScript, ...process.argv.slice(3)], {
    stdio: 'inherit',
  })
  process.exit(result.status ?? 1)
}

const arg = parseArgv()

async function startServer() {
  try {
    let { port = 8800 } = arg
    port = Number(port)

    port = await getPort({ port }).catch(_ => {
      console.log(`端口 ${port} 被占用，正在寻找可用端口...`)
      return getPort()
    })

    console.log(`doocs/md-cli v${packageJson.version}`)
    console.log(`服务启动中...`)

    const app = createServer(port)

    app.listen(port, '127.0.0.1', () => {
      console.log(`服务已启动:`)
      console.log(`打开链接 ${colors.green(`http://127.0.0.1:${port}`)} 即刻使用吧~`)
      console.log(``)

      const { spaceId, clientSecret } = arg
      if (spaceId && clientSecret) {
        console.log(`${colors.green('✅ 云存储已配置，可通过自定义代码上传图片')}`)
      }
    })

    process.once('SIGINT', () => {
      console.log('\n服务器已关闭')
      process.exit(0)
    })

    process.once('SIGTERM', () => {
      console.log('\n服务器已关闭')
      process.exit(0)
    })

  } catch (err) {
    console.error('启动服务器失败:', err)
    process.exit(1)
  }
}

startServer()
