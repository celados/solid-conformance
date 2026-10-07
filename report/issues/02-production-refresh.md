---
type: Issue
title: "Production refresh promise never settles"
status: draft
tier: A
severity: high
findings: ['008']
target: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Production refresh promise never settles

An immediately resolved recomputation should settle refresh with 2; production leaves the promise pending.

## Reproduction

In an empty Bun project, create the files below. No conformance-harness imports are needed. Browser cases use the installed system Google Chrome, not a downloaded browser. The rc.13 command is the comparison baseline; to reproduce HEAD, replace the five Solid packages with the matching built distributions from `solidjs/solid` commit `dafad1db34626feb5f154e98e599f65be1802c6c`. Do not mix package generations. 

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
BUILD_MODE=production bun test ./repro.test.ts
```

### `client.tsx`

```tsx
import { createMemo, resolve, refresh, createSignal } from 'solid-js'
export function refreshCase() {
	let read!: ReturnType<typeof createMemo<number>>, write!: (value: string) => void
	function App() {
		let calls = 0
		read = createMemo(() => Promise.resolve(++calls))
		const [result, set] = createSignal('waiting'); write = set
		return <span>{result()}</span>
	}
	return { App, streams: [], async settle() {
		await resolve(read)
		let timer: ReturnType<typeof setTimeout> | undefined
		try { write(String(await Promise.race([refresh(read), new Promise(res => { timer = setTimeout(() => res('timeout'), 200) })]))) }
		finally { clearTimeout(timer) }
	} }
}

import {render} from '@solidjs/web'
const sample=refreshCase()
render(sample.App,document.getElementById('root')!)
;(window as any).result=(async()=>{await sample.settle();return document.getElementById('root')!.innerHTML})()
```

### `repro.test.ts`

```ts
import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {resolve} from 'node:path'
import {build} from './build'
test("Production refresh promise never settles",async()=>{
 const dir=resolve('dist');await build(dir,(process.env.BUILD_MODE??'development') as any,{client:['client.tsx'],server:[]})
 const server=Bun.serve({port:0,fetch:r=>new URL(r.url).pathname==='/client.js'?new Response(Bun.file(dir+'/client.js'),{headers:{'content-type':'text/javascript'}}):new Response('<div id="root"></div><script type="module" src="/client.js"></script>',{headers:{'content-type':'text/html'}})})
 const browser=await chromium.launch({channel:'chrome',headless:true})
 try{const page=await browser.newPage();await page.goto(String(server.url));await page.waitForFunction(()=>!!(window as any).result);expect(await page.evaluate(()=>(window as any).result)).toBe("<span>2</span>")}finally{await browser.close();server.stop(true)}
},30000)
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

An immediately resolved recomputation should settle refresh with 2; production leaves the promise pending.

## Versions and builds

HEAD-only and production-only; development and rc.13 pass. The original failing snapshot was `53ef0e69`; the refresh target is `dafad1db34626feb5f154e98e599f65be1802c6c`. Refresh disposition is recorded in the batch index before filing.

## Related issues

[#3738](https://github.com/solidjs/solid/issues/3738), [#3178](https://github.com/solidjs/solid/issues/3178)

Local evidence: [finding 008](../../findings/008-production-refresh/README.md).
