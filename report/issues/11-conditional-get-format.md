---
type: Issue
title: "304 format header overwrites cached GET representation"
status: draft
tier: A
severity: med
findings: ['036']
target: dafad1db34626feb5f154e98e599f65be1802c6c
---

# 304 format header overwrites cached GET representation

Browser-managed conditional GET should replay cached {value:17}. Both client fetches see 200, but the second decoded result is undefined.

## Reproduction

In an empty Bun project, create the files below. No conformance-harness imports are needed. Browser cases use the installed system Google Chrome, not a downloaded browser. The rc.13 command is the comparison baseline; to reproduce HEAD, replace the five Solid packages with the matching built distributions from `solidjs/solid` commit `dafad1db34626feb5f154e98e599f65be1802c6c`. Do not mix package generations. 

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
BUILD_MODE=development bun test ./repro.test.ts
```

### `client.ts`

```ts
import {GET,createServerReference,configureServerFunctionsClient} from "@solidjs/web/server-functions/client";
const statuses:number[]=[],hints:any[]=[],formats:(string|null)[]=[];
configureServerFunctionsClient({fetch:async(address,init)=>{hints.push(Object.fromEntries(new Headers(init.headers)));const response=await fetch(address,init);statuses.push(response.status);formats.push(response.headers.get("X-Server-Function-Format"));return response}});
const read=GET(createServerReference("conditional"));
(window as any).conditional=(async()=>{const first=await read();await new Promise(r=>setTimeout(r,20));const second=await read();return{first,second,statuses,hints,formats}})();
```

### `repro.test.ts`

```ts
import {test,expect} from "bun:test";
import {chromium} from "playwright";
import {resolve} from "node:path";
import {rm} from "node:fs/promises";
import {build,type BuildMode} from './build';
const mode=(process.env.BUILD_MODE??"development") as BuildMode;
test("RFC10 browser owns conditional GET exchange "+mode,async()=>{
 const dir=resolve(".build","conditional-"+process.pid+"-"+mode);
 await build(dir,mode,{client:["./client.ts"],server:["./server.ts"]});
 const module=await import(dir+"/server.js");const server=Bun.serve({hostname:"127.0.0.1",port:0,fetch(req){const url=new URL(req.url);return url.pathname.startsWith("/_server")?module.handle(req):url.pathname.endsWith(".js")?new Response(Bun.file(dir+url.pathname),{headers:{"content-type":"text/javascript"}}):new Response('<script type="module" src="/client.js"></script>',{headers:{"content-type":"text/html"}})}});
 const browser=await chromium.launch({channel:"chrome",headless:true});
 try{const page=await browser.newPage();const errors:string[]=[];page.on("pageerror",e=>errors.push(String(e)));await page.goto(String(server.url));await page.waitForFunction(()=>!!(window as any).conditional);const result=await page.evaluate(()=> (window as any).conditional);
 console.log({ calls: module.calls, result });
 expect(module.calls).toEqual([null,'"constant"']);expect(result.statuses).toEqual([200,200]);expect(result.first).toEqual({value:17});expect(result.hints.every((h:any)=>!h["if-none-match"])).toBe(true);expect(errors).toEqual([]);
 expect(result.second).toEqual({value:17});
 }finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}
},30000);
```

### `server.ts`

```ts
import {AsyncLocalStorage} from "node:async_hooks";
import {RequestContext,getRequestEvent,respond} from "@solidjs/web";
import {GET,createServerReference,registerServerReference,handleServerFunctionRequest} from "@solidjs/web/server-functions/server";
(globalThis as any)[RequestContext]=new AsyncLocalStorage();
export const calls:(string|null)[]=[];
GET(createServerReference(registerServerReference("conditional",()=>{
 const headers={etag:'"constant"',"cache-control":"private, max-age=0, must-revalidate"};
 const conditional=getRequestEvent()!.request.headers.get("if-none-match");calls.push(conditional);
 return conditional==='"constant"'?new Response(null,{status:304,headers}):respond({value:17},{headers});
})));
export const handle=handleServerFunctionRequest;
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

Browser-managed conditional GET should replay cached {value:17}. Both client fetches see 200, but the second decoded result is undefined.

## Versions and builds

Development, observe and production fail; rc.13 also fails. The original failing snapshot was `53ef0e69`; the refresh target is `dafad1db34626feb5f154e98e599f65be1802c6c`. Refresh disposition is recorded in the batch index before filing.

## Related issues

[#3101](https://github.com/solidjs/solid/issues/3101), [#3134](https://github.com/solidjs/solid/issues/3134)

Local evidence: [finding 036](../../findings/036-conditional-cache-format/README.md).
