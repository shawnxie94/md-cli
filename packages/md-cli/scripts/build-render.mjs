import { build } from 'esbuild'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageDir = path.resolve(__dirname, '..')
const repoRoot = path.resolve(packageDir, '../..')

const workspaceExports = {
  '@md/core': {
    base: path.join(repoRoot, 'packages/core/src'),
    entries: {
      '': 'index.ts',
      '/renderer': 'renderer/index.ts',
      '/extensions': 'extensions/index.ts',
      '/utils': 'utils/index.ts',
      '/theme': 'theme/index.ts',
    },
  },
  '@md/shared': {
    base: path.join(repoRoot, 'packages/shared/src'),
    entries: {
      '': 'index.ts',
      '/configs': 'configs/index.ts',
      '/constants': 'constants/index.ts',
      '/types': 'types/index.ts',
      '/utils': 'utils/index.ts',
      '/editor': 'editor/index.ts',
    },
  },
}

function resolveWorkspacePath(specifier) {
  for (const [packageName, config] of Object.entries(workspaceExports)) {
    if (specifier !== packageName && !specifier.startsWith(`${packageName}/`))
      continue

    const subpath = specifier.slice(packageName.length)
    const entry = config.entries[subpath]
    if (entry)
      return path.join(config.base, entry)

    const relative = subpath.replace(/^\//, '')
    return path.join(config.base, `${relative}.ts`)
  }
}

const workspaceResolver = {
  name: 'workspace-resolver',
  setup(buildContext) {
    buildContext.onResolve({ filter: /^@md\/(?:core|shared)(?:\/.*)?$/ }, (args) => {
      const resolved = resolveWorkspacePath(args.path)
      if (!resolved)
        return

      return { path: resolved }
    })
  },
}

await fs.mkdir(path.join(packageDir, 'bin'), { recursive: true })

await build({
  entryPoints: [path.join(packageDir, 'render.ts')],
  outfile: path.join(packageDir, 'bin/render.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  loader: {
    '.css': 'text',
  },
  external: [
    '@antv/infographic',
    'canvas',
    'jsdom',
    'juice',
    'mermaid',
  ],
  plugins: [workspaceResolver],
})
