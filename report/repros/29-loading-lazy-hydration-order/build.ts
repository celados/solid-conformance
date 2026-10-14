import { transform } from '@solidjs/compiler'
import { realpath } from 'node:fs/promises'
import { resolve } from 'node:path'

function selectExport(value: unknown, conditions: Set<string>): string | undefined {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return undefined
  for (const [key, child] of Object.entries(value)) {
    if (conditions.has(key)) {
      const selected = selectExport(child, conditions)
      if (selected) return selected
    }
  }
}

export async function build(entries: {client: string[]; server: string[]}) {
  const mode = process.env.BUILD_MODE ?? 'development'
  if (!['development', 'production'].includes(mode)) throw new Error('BUILD_MODE must be development or production')
  const packages = new Map<string, {directory: string; exports: Record<string, unknown>}>()
  for (const name of ['solid-js', '@solidjs/signals', '@solidjs/web', '@solidjs/diagnostics']) {
    const directory = await realpath(resolve('node_modules', name))
    const pkg = await Bun.file(resolve(directory, 'package.json')).json()
    packages.set(name, {directory, exports: pkg.exports})
  }
  for (const target of ['client', 'server'] as const) {
    if (!entries[target].length) continue
    const conditions = new Set([target === 'client' ? 'browser' : 'node', mode, 'import', 'default'])
    const result = await Bun.build({
      entrypoints: entries[target], outdir: '.build', naming: '[name].js',
      splitting: target === 'client', target: target === 'client' ? 'browser' : 'bun',
      conditions: ['solid', mode], tsconfig: 'tsconfig.json',
      define: {'process.env.NODE_ENV': JSON.stringify(mode)},
      plugins: [{name: 'solid-jsx', setup(builder) {
        builder.onResolve({filter: /^(solid-js|@solidjs\/(signals|web|diagnostics))(\/.*)?$/}, args => {
          const name = args.path.startsWith('@') ? args.path.split('/').slice(0, 2).join('/') : 'solid-js'
          const pkg = packages.get(name)!
          const subpath = args.path.slice(name.length)
          const entry = selectExport(pkg.exports[subpath ? '.' + subpath : '.'], conditions)
          if (!entry) throw new Error('Missing export: ' + args.path)
          return {path: resolve(pkg.directory, entry)}
        })
        builder.onLoad({filter: /\.[jt]sx$/}, async args => ({
          contents: transform(await Bun.file(args.path).text(), {
            filename: args.path, generate: target === 'client' ? 'dom' : 'ssr',
            hydratable: true, dev: mode === 'development',
          }).code,
          loader: 'ts',
        }))
      }}],
    })
    if (!result.success) throw new AggregateError(result.logs, 'Build failed: ' + target)
  }
}
