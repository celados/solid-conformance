---
type: Issue
title: "Second mount of a shared server-component factory fails hydration"
status: draft
tier: A
severity: high
findings: ['011']
target: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Second mount of a shared server-component factory fails hydration

Two consumption sites should retain independent hydrated client slots. CSR has two working buttons; hydration loses the second mount.

## Reproduction

Use a built Solid checkout at `dafad1db34626feb5f154e98e599f65be1802c6c` (all five package distributions, including the native compiler). Copy these files into an empty Bun project. The commands below explicitly link that HEAD build; omit the link command only to run the rc.13 comparison. HEAD-only cases pass on rc.13. Browser tests use system Google Chrome.

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

### `app.tsx`

```tsx
import {createMemo,Loading} from 'solid-js'
import {dynamic,isServer} from '@solidjs/web'
import {GET,createServerReference} from '@solidjs/web/server-functions'
import {Counter} from './counter'
export const source:any={}
export function App(){const value=createMemo(()=>isServer?source.read():GET((createServerReference as any)('multisite'))());const Frame=dynamic(()=>value() as any);return <Loading fallback='pending'><Frame counter={Counter}/><Frame counter={Counter}/></Loading>}
```

### `server.tsx`

```tsx
import {AsyncLocalStorage} from 'node:async_hooks'
import {RequestContext,createRequestEvent,renderToStream,NoHydration,Hydration,HydrationScript} from '@solidjs/web'
import {configureServerFunctionsServer,registerServerReference,createServerReference,GET,handleServerFunctionRequest} from '@solidjs/web/server-functions/server'
import {frameTransformResult,frameTransformDirectResult,ServerComponentPlugin,SERVER_COMPONENT_BOOTSTRAP} from '@solidjs/web/frames/server'
import {App,source} from './app'
const scope=new AsyncLocalStorage<any>();(globalThis as any)[RequestContext]=scope
configureServerFunctionsServer({transformResult:frameTransformResult,transformDirectResult:frameTransformDirectResult})
source.read=GET(createServerReference(registerServerReference('multisite',()=>(p:any)=><p.counter/>)))
export const handle=(r:Request)=>handleServerFunctionRequest(r)
export const documentStream=()=>scope.run(createRequestEvent(new Request('http://localhost/')),()=>renderToStream(()=><NoHydration><html><head><HydrationScript/><script innerHTML={SERVER_COMPONENT_BOOTSTRAP}/></head><body><div id='root'><Hydration id='multisite'><App/></Hydration></div><script type='module' src='/client.js'/></body></html></NoHydration>,{plugins:[ServerComponentPlugin]}))
```

### `counter.tsx`

```tsx
import {createSignal} from 'solid-js'
export function Counter(){const [count,set]=createSignal(0);return <button onClick={()=>set(n=>n+1)}>{count()}</button>}
```

### `repro.test.ts`

```ts
import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
import {buildFrames} from './build'
test('one shared server-component factory has independently hydrated client slots at each mount',async()=>{
 const mode=(process.env.BUILD_MODE??'development') as 'development'|'production',dir=resolve('.build','multisite-'+process.pid)
 await buildFrames(dir,mode,{client:'./client.tsx',server:'./server.tsx'})
 const ssr=await import(dir+'/server.js');const server=Bun.serve({port:0,fetch:r=>{const u=new URL(r.url);if(u.pathname.startsWith('/_server'))return ssr.handle(r);if(u.pathname.endsWith('.js'))return new Response(Bun.file(dir+u.pathname),{headers:{'content-type':'text/javascript'}});if(u.pathname==='/favicon.ico')return new Response(null,{status:204});return new Response(u.searchParams.has('hydrate')?ssr.documentStream().readable:'<div id="root"></div><script type="module" src="/client.js"></script>',{headers:{'content-type':'text/html'}})}})
 const browser=await chromium.launch({channel:'chrome',headless:true});try{for(const surface of ['csr','hydrate']){const page=await browser.newPage();await page.goto(server.url+(surface==='hydrate'?'?hydrate':''));await page.waitForFunction(()=>!!(window as any).ready);await page.evaluate(()=>(window as any).ready());expect(await page.locator('button').allTextContents()).toEqual(['0','0']);await page.locator('button').nth(1).click();console.log({surface,counters:await page.locator('button').allTextContents(),keys:await page.locator('button').evaluateAll(es=>es.map(e=>e.getAttribute('_hk')))});expect(await page.locator('button').allTextContents()).toEqual(['0','1']);await page.close()}}finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}
},30000)
```

### `client.tsx`

```tsx
import {render,hydrate} from '@solidjs/web'
import {flush} from 'solid-js'
import {installServerComponents} from '@solidjs/web/frames'
import {App} from './app'
installServerComponents()
const root=document.getElementById('root')!;(location.search.includes('hydrate')?hydrate(App,root,{renderId:'multisite'}):render(App,root));(window as any).ready=async()=>{for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,10));flush()}}
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


export async function buildFrames(outdir:string,variant:BuildMode,entries:{client:string;server:string}){return build(outdir,variant,{client:[entries.client],server:[entries.server]})}
```

## Expected versus actual

Two consumption sites should retain independent hydrated client slots. CSR has two working buttons; hydration loses the second mount.

## Versions and builds

Verified on Solid HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`: 011: development, production.

Comparison: 011: rc.13 also fails the named contract. The original snapshot was `53ef0e69`; rc.13 results come from the versioned baseline evidence. No refreshed confirmed case passed.

## Related issues

[#2973](https://github.com/solidjs/solid/issues/2973)

Local evidence: [finding 011](../../findings/011-frame-multisite-hydration/README.md).

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
