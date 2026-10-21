// usage: cd tracks/remeasure/<rcNN> && BUILD_MODE=development|production bun ../run.ts
import { transform } from '@solidjs/compiler'
import { realpathSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const variant = process.env.BUILD_MODE ?? 'development'
const cwd = process.cwd()
const sel = (v: any, c: Set<string>): string | undefined => {
	if (typeof v === 'string') return v
	if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (c.has(k)) { const r = sel(x, c); if (r) return r }
}
const conds = new Set(['node', variant, 'import', 'default'])
const pkgs = new Map<string, { dir: string; exports: any }>()
for (const n of ['solid-js', '@solidjs/signals', '@solidjs/web', '@solidjs/diagnostics']) {
	const dir = realpathSync(resolve(cwd, 'node_modules', n))
	pkgs.set(n, { dir, exports: JSON.parse(readFileSync(dir + '/package.json', 'utf8')).exports })
}
const ver = (n: string) => JSON.parse(readFileSync(resolve(cwd, 'node_modules', n, 'package.json'), 'utf8')).version
const built = await Bun.build({
	entrypoints: [resolve(import.meta.dir, 'entry.tsx')],
	outdir: resolve(cwd, '.build-' + variant), naming: 'entry.js', target: 'bun',
	conditions: [variant], define: { 'process.env.NODE_ENV': JSON.stringify(variant) },
	plugins: [{ name: 'solid', setup(b) {
		b.onResolve({ filter: /^(solid-js|@solidjs\/(signals|web|diagnostics))(\/.*)?$/ }, (a) => {
			const name = a.path.startsWith('@') ? a.path.split('/').slice(0, 2).join('/') : 'solid-js'
			const p = pkgs.get(name)!, sub = a.path.slice(name.length)
			const f = sel(p.exports[sub ? '.' + sub : '.'], conds)
			if (!f) throw new Error('no export ' + a.path)
			return { path: resolve(p.dir, f) }
		})
		b.onResolve({ filter: /^@solidjs\/router$/ }, () => ({ path: resolve(cwd, 'node_modules/@solidjs/router/dist/index.js') }))
		b.onLoad({ filter: /\.[jt]sx$/ }, async (a) => ({
			contents: transform(await Bun.file(a.path).text(), { filename: a.path, generate: 'ssr', hydratable: true, dev: variant === 'development' }).code, loader: 'ts' }))
	} }],
})
if (!built.success) throw new AggregateError(built.logs, 'build failed')
const m = await import(resolve(cwd, '.build-' + variant, 'entry.js'))
console.log(`# solid-js ${ver('solid-js')} @solidjs/web ${ver('@solidjs/web')} router ${ver('@solidjs/router')} mode=${variant}`)
await m.runAll()
process.exit(0)
