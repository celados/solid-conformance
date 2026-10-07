---
type: Issue
title: "Literal spread children allocate hydration IDs in a different order"
status: draft
tier: A
severity: low
findings: ['044']
target: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Literal spread children allocate hydration IDs in a different order

A literal spread containing one button should hydrate without mismatches. Final DOM and handler work, but development emits two tag-mismatch warnings.

## Reproduction

Use a built Solid checkout at `dafad1db34626feb5f154e98e599f65be1802c6c` (all five package distributions, including the native compiler). Copy these files into an empty Bun project. The commands below explicitly link that HEAD build; omit the link command only to run the rc.13 comparison. HEAD-only cases pass on rc.13. Browser tests use system Google Chrome.

This uses the native Solid compiler, not React JSX transformation.

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

### `server.tsx`

```tsx
import {renderToString,generateHydrationScript} from '@solidjs/web'
import {Shape} from './shape'
export function markup(){return renderToString(()=><Shape clicked={()=>{}}/>)}
export function html(){return generateHydrationScript()+'<main id="root">'+markup()+'</main>'}
```

### `shape.tsx`

```tsx
export function Shape(props:{clicked:()=>void}){return <div {...{children:<button onClick={props.clicked}>click</button>}}/>}
```

### `repro.test.ts`

```ts
import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {build} from './build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
// CSR and SSR->hydrate must produce the same DOM and functioning event handlers.
test('literal spread children keeps nesting and handler through SSR hydration',async()=>{const dir=resolve('.build','spread-'+process.pid);await build(dir,(process.env.BUILD_MODE??'development') as any,{client:['./client.tsx'],server:['./server.tsx']});const runtime=await import(dir+'/server.js');const server=Bun.serve({port:0,fetch:r=>{const url=new URL(r.url);return url.pathname.endsWith('.js')?new Response(Bun.file(dir+url.pathname),{headers:{'content-type':'text/javascript'}}):new Response((url.search.includes('csr')?'<main id="root"></main>':runtime.html())+'<script type="module" src="/client.js"></script>',{headers:{'content-type':'text/html'}})}});const browser=await chromium.launch({channel:'chrome',headless:true});try{const samples=[];for(const csr of [true,false]){const page=await browser.newPage();const issues:string[]=[];page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')issues.push(m.text())});page.on('pageerror',e=>issues.push(String(e)));await page.goto(server.url+(csr?'?csr':''));await page.waitForFunction(()=>!!(window as any).inspect);await page.getByRole('button').click();samples.push({...await page.evaluate(()=>(window as any).inspect()),issues});await page.evaluate(()=>(window as any).stop());await page.close()};console.log({ssr:runtime.markup(),samples});expect(samples[0]).toEqual({count:1,nested:true,text:'click',issues:[]});expect(samples[1]).toEqual(samples[0]);expect(runtime.markup()).toMatch(/<div[^>]*><button/)}finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}},30000)
```

### `client.tsx`

```tsx
import {render,hydrate} from '@solidjs/web'
import {Shape} from './shape'
let count=0
const stop=(location.search.includes('csr')?render:hydrate)(()=> <Shape clicked={()=>count++}/>,document.getElementById('root')!)
;(window as any).inspect=()=>({count,nested:!!document.querySelector('#root>div>button'),text:document.getElementById('root')!.textContent})
;(window as any).stop=stop
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

A literal spread containing one button should hydrate without mismatches. Final DOM and handler work, but development emits two tag-mismatch warnings.

## Versions and builds

Verified on Solid HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`: 044: development.

Comparison: 044: rc.13 also fails the named contract. The original snapshot was `53ef0e69`; rc.13 results come from the versioned baseline evidence. No refreshed confirmed case passed.

## Related issues

[#3313](https://github.com/solidjs/solid/issues/3313)

Local evidence: [finding 044](../../findings/044-literal-spread-hydration/README.md).

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
