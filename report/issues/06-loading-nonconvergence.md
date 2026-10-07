---
type: Issue
title: "Loading on latest remains in fallback after a shared source settles"
status: draft
tier: A
severity: high
findings: ['029']
target: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Loading on latest remains in fallback after a shared source settles

After the shared memo resolves to 2 both boundaries should display 22. The latest boundary remains A while its sibling displays 2.

## Reproduction

In an empty Bun project, create the files below. No conformance-harness imports are needed. Browser cases use the installed system Google Chrome, not a downloaded browser. The rc.13 command is the comparison baseline; to reproduce HEAD, replace the five Solid packages with the matching built distributions from `solidjs/solid` commit `dafad1db34626feb5f154e98e599f65be1802c6c`. Do not mix package generations. 

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
BUILD_MODE=development bun test ./repro.test.ts
```

### `repro.test.ts`

```ts
import { expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { rm } from 'node:fs/promises'
import { build } from './build'

test('Loading on latest(id) converges after its shared source lands', async () => {
  const mode = (process.env.BUILD_MODE ?? 'development') as 'development' | 'production'
  const dir = resolve('.build', 'latest-loading-' + process.pid)
  await build(dir, mode, { client: ['./client.tsx'], server: [] })
  const server = Bun.serve({ port: 0, fetch: request => new URL(request.url).pathname === '/client.js'
    ? new Response(Bun.file(dir + '/client.js'), { headers: { 'content-type': 'text/javascript' } })
    : new Response('<script type="module" src="/client.js"></script>', { headers: { 'content-type': 'text/html' } }) })
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const page = await browser.newPage()
    await page.goto(server.url.toString())
    await page.waitForFunction(() => !!(window as any).result)
    const result = await page.evaluate(() => (window as any).result)
    console.log(result)
    expect(result.normal.final).toBe('22')
    expect(result.latest.initial).toBe('11')
    expect(result.latest.waiting).toBe('A1')
    expect(result.latest.source).toBe(2)
    expect(result.latest.final).toBe('22')
  } finally {
    await browser.close()
    server.stop(true)
    await rm(dir, { recursive: true, force: true })
  }
}, 30000)
```

### `client.tsx`

```tsx
import { createSignal, createMemo, latest, Loading, flush, untrack } from 'solid-js'
import { render } from '@solidjs/web'

const tick = () => new Promise(resolve => setTimeout(resolve, 20))
async function sample(ahead: boolean) {
  const target = document.createElement('div')
  let change!: (value: number) => void
  let settle!: (value: number) => void
  let source!: () => number
  let warm!: (value:number)=>void
  const first = new Promise<number>(resolve=>{warm=resolve})
  const pending = new Promise<number>(resolve => { settle = resolve })
  const dispose = render(() => {
    const [id, set] = createSignal(0)
    change = set
    const data = createMemo(() => id() ? pending : first)
    source=data
    return <><Loading on={ahead ? latest(id) : id()} fallback='A'><span>{data()}</span></Loading><Loading fallback="B"><b>{data()}</b></Loading></>
  }, target)
  try {
    warm(1)
    await tick()
    const initial = target.textContent
    change(1)
    flush()
    await tick()
    const waiting = target.textContent
    settle(2)
    for(let i=0;i<30;i++) await tick()
    flush()
    return { initial, waiting, final: target.textContent, source: untrack(source) }
  } finally { dispose() }
}
;(window as any).result = (async () => ({ normal: await sample(false), latest: await sample(true) }))()
```

### `build.ts`

```ts
import { transform } from '@solidjs/compiler'
import { realpath } from 'node:fs/promises'
import { resolve } from 'node:path'

type ExportValue = string | Record<string, unknown>
function selectExport(
	value: unknown,
	conditions: Set<string>,
): string | undefined {
	if (typeof value === 'string') return value
	if (!value || typeof value !== 'object') return undefined
	for (const [key, child] of Object.entries(value))
		if (conditions.has(key)) {
			const selected = selectExport(child, conditions)
			if (selected) return selected
		}
}
export type BuildMode = 'development' | 'production' | 'observe'
export async function build(outdir = '.build', variant: BuildMode, entries: { client: string[]; server: string[]; serverComponents?: boolean }) {
	const packages = new Map<
		string,
		{ directory: string; exports: Record<string, ExportValue> }
	>()
	for (const name of [
		'solid-js',
		'@solidjs/signals',
		'@solidjs/web',
		'@solidjs/diagnostics',
	]) {
		const directory = await realpath(resolve('node_modules', name))
		const pkg = await Bun.file(`${directory}/package.json`).json()
		packages.set(name, { directory, exports: pkg.exports })
	}
	for (const mode of ['client', 'server'] as const) {
		if (entries?.[mode].length === 0) continue
		const conditions = new Set([
			mode === 'client' ? 'browser' : 'node',
			variant,
			'import',
			'default',
		])
		const result = await Bun.build({
			metafile: true,
			entrypoints: entries![mode],
			outdir,
			naming: '[name].js',
			splitting: mode === 'client',
			target: mode === 'client' ? 'browser' : 'bun',
			conditions: [variant],
			define: { 'process.env.NODE_ENV': JSON.stringify(variant) },
			
			plugins: [
				{
					name: 'solid',
					setup(builder) {
						// Pin consumer imports to one built package graph. Upstream's internal tsconfig
						// aliases point at source and otherwise mix source with distribution exports.
						builder.onResolve(
							{
								filter:
									/^(solid-js|@solidjs\/(signals|web|diagnostics))(\/.*)?$/,
							},
							(args) => {
								const name = args.path.startsWith('@')
									? args.path.split('/').slice(0, 2).join('/')
									: 'solid-js'
								const pkg = packages.get(name)!
								const subpath = args.path.slice(name.length)
								const key = subpath ? '.' + subpath : '.'
								const file = selectExport(pkg.exports[key], conditions)
								if (!file)
									throw new Error(
										`Missing runtime export: ${args.path} (${mode})`,
									)
								return { path: resolve(pkg.directory, file) }
							},
						)
						builder.onLoad({ filter: /\.tsx$/ }, async (args) => ({
							contents: transform(await Bun.file(args.path).text(), {
								filename: args.path,
								generate: mode === 'client' ? 'dom' : 'ssr',
								hydratable: true,
								dev: variant === 'development',
								...(entries?.serverComponents ? { serverComponents: true } : {}),
							}).code,
							loader: 'ts',
						}))
					},
				},
			],
		})
		if (!result.success)
			throw new AggregateError(result.logs, `Build failed: ${mode}`)
		await Bun.write(resolve(outdir, `${mode}-metafile.json`), JSON.stringify(result.metafile, null, 2))
	}
}
```

## Expected versus actual

After the shared memo resolves to 2 both boundaries should display 22. The latest boundary remains A while its sibling displays 2.

## Versions and builds

HEAD-only; both builds fail and rc.13 passes. The original failing snapshot was `53ef0e69`; the refresh target is `dafad1db34626feb5f154e98e599f65be1802c6c`. Refresh disposition is recorded in the batch index before filing.

## Related issues

[#2706](https://github.com/solidjs/solid/issues/2706), [#2829](https://github.com/solidjs/solid/issues/2829), [#3524](https://github.com/solidjs/solid/issues/3524)

Local evidence: [finding 029](../../findings/029-latest-loading-convergence/README.md).
