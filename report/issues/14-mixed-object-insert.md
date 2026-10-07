---
type: Issue
title: "Unrenderable object beside text throws instead of being skipped"
status: draft
tier: A
severity: low
findings: ['034']
target: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Unrenderable object beside text throws instead of being skipped

The sole object hole is skipped as documented. The same object beside valid text reaches insertBefore as a non-Node and throws.

## Reproduction

Use a built Solid checkout at `dafad1db34626feb5f154e98e599f65be1802c6c` (all five package distributions, including the native compiler). Copy these files into an empty Bun project. The commands below explicitly link that HEAD build; omit the link command only to run the rc.13 comparison. HEAD-only cases pass on rc.13. Browser tests use system Google Chrome.

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

### `repro.test.ts`

```ts
import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
import {build} from './build'
// 08-dev-diagnostics.md L692: plain objects at insert positions are skipped.
test('unrenderable object is skipped when adjacent to text, as in a sole hole',async()=>{const dir=resolve('.build','mixed-object-'+process.pid);await build(dir,(process.env.BUILD_MODE??'development') as any,{client:['./client.tsx'],server:[]});const server=Bun.serve({port:0,fetch:r=>new URL(r.url).pathname==='/client.js'?new Response(Bun.file(dir+'/client.js'),{headers:{'content-type':'text/javascript'}}):new Response('<script type="module" src="/client.js"></script>',{headers:{'content-type':'text/html'}})});const browser=await chromium.launch({channel:'chrome',headless:true});try{const page=await browser.newPage();await page.goto(server.url.toString());await page.waitForFunction(()=>!!(window as any).result);const result=await page.evaluate(()=>(window as any).result);expect(result.sole).toEqual({error:null,text:''});expect(result.mixed).toEqual({error:null,text:'valid'})}finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}},30000)
```

### `client.tsx`

```tsx
import {render} from '@solidjs/web'
function sample(mixed:boolean){const target=document.createElement('div');let dispose:(()=>void)|undefined;try{const value={bad:true};dispose=render(()=>mixed?<div>valid{value as any}</div>:<div>{value as any}</div>,target);return{error:null,text:target.textContent}}catch(error){return{error:String(error),text:target.textContent}}finally{dispose?.()}}
;(window as any).result={sole:sample(false),mixed:sample(true)}
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

The sole object hole is skipped as documented. The same object beside valid text reaches insertBefore as a non-Node and throws.

## Versions and builds

Verified on Solid HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`: 034: development, production.

Comparison: 034: rc.13 also fails the named contract. The original snapshot was `53ef0e69`; rc.13 results come from the versioned baseline evidence. No refreshed confirmed case passed.

## Related issues

[#3734](https://github.com/solidjs/solid/issues/3734)

Local validation (review only; omit when filing): [finding 034](../../findings/034-mixed-insert-object/README.md).

### `link-head.ts`

```ts
import { mkdir, realpath, rm, symlink } from 'node:fs/promises'
import { resolve } from 'node:path'

const source = process.argv[2]
if (!source) throw new Error('Pass the path to the built Solid HEAD checkout.')
const root = await realpath(source)
for (const [name, folder] of [
 ['solid-js', 'solid'], ['@solidjs/signals', 'signals'],
 ['@solidjs/web', 'web'], ['@solidjs/compiler', 'compiler'],
 ['@solidjs/diagnostics', 'diagnostics'],
]) {
 const packagePath = resolve(root, 'packages', folder!)
 if (!await Bun.file(resolve(packagePath, 'package.json')).exists())
  throw new Error('Missing built package: ' + packagePath)
 const destination = resolve('node_modules', name!)
 await rm(destination, { recursive: true, force: true })
 await mkdir(resolve(destination, '..'), { recursive: true })
 await symlink(packagePath, destination, 'dir')
}
console.log('Linked the five matching HEAD packages from ' + root)
```
