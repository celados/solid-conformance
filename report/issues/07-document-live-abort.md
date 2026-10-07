---
type: Issue
title: "Aborted document closes a live-hole channel twice"
status: draft
tier: A
severity: high
findings: ['049']
target: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Aborted document closes a live-hole channel twice

Abort followed by producer completion should clean up once. Instead an uncaught Controller is already closed TypeError escapes the document live channel.

## Reproduction

Use a built Solid checkout at `dafad1db34626feb5f154e98e599f65be1802c6c` (all five package distributions, including the native compiler). Copy these files into an empty Bun project. The commands below explicitly link that HEAD build; omit the link command only to run the rc.13 comparison. HEAD-only cases pass on rc.13. Browser tests use system Google Chrome.

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

### `server.tsx`

```tsx
import {createMemo} from 'solid-js';
import {renderToStream} from '@solidjs/web';
import {frameTransformDirectResult} from '@solidjs/web/frames/server';
export async function run(abort=true){
 let release!:()=>void,closed=0;const pending=new Promise<void>(r=>release=r);
 async function* values(){try{yield 1;await pending}finally{closed++}}
 const C=frameTransformDirectResult(()=>{const value=createMemo(values);return <b>{value()}</b>},{id:'minimal'});
 const ctrl=new AbortController();let html='';const stream=renderToStream(()=>C(),{signal:ctrl.signal,onError(){}});stream.pipe({write:c=>{html+=String(c)},end(){}});
 await new Promise(r=>setTimeout(r,10));if(abort)ctrl.abort();release();await new Promise(r=>setTimeout(r,30));return {html,closed};
}
```

### `repro.test.ts`

```ts
import {test,expect} from 'bun:test';import {build,type BuildMode} from './build';import {resolve} from 'node:path';import {rm} from 'node:fs/promises';
for(const mode of ['development','observe','production'] as BuildMode[])test('aborting a document then finishing its server source must not throw '+mode,async()=>{const dir=resolve('.build','finding049-'+process.pid+'-'+mode);try{await build(dir,mode,{client:[],server:['./server.tsx'],serverComponents:true});const m=await import(dir+'/server.js');const control=await m.run(false);expect(control.closed).toBe(1);expect(control.html).toContain("1");const r=await m.run();expect(r.html).toContain('1');expect(r.closed).toBe(1)}finally{await rm(dir,{recursive:true,force:true})}});
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

Abort followed by producer completion should clean up once. Instead an uncaught Controller is already closed TypeError escapes the document live channel.

## Versions and builds

Verified on Solid HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`: 049: development, observe, production.

Comparison: 049: rc.13 also fails the named contract. The original snapshot was `53ef0e69`; rc.13 results come from the versioned baseline evidence. No refreshed confirmed case passed.

## Related issues

[#3768](https://github.com/solidjs/solid/issues/3768)

Local evidence: [finding 049](../../findings/049-document-live-channel-abort/README.md).

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
