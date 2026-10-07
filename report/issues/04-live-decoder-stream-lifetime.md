---
type: Issue
title: "Open decoded iterators are missed when a response dies"
status: draft
tier: A
severity: high
findings: ['014', '035']
target: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Open decoded iterators are missed when a response dies

A dropped live response should reconnect; a non-live iterator pull should reject. Instead live closes normally and a decoded pull stays pending.

## Reproduction

In an empty Bun project, create the files below. No conformance-harness imports are needed. Browser cases use the installed system Google Chrome, not a downloaded browser. The rc.13 command is the comparison baseline; to reproduce HEAD, replace the five Solid packages with the matching built distributions from `solidjs/solid` commit `dafad1db34626feb5f154e98e599f65be1802c6c`. Do not mix package generations. 

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun add seroval@1.6.8
BUILD_MODE=development bun test ./repro.test.ts ./live.test.ts
```

### `repro.test.ts`

```ts
import {test,expect} from "bun:test";
import {resolve} from "node:path";
import {rm} from "node:fs/promises";
import {build,type BuildMode} from './build';
test("RFC10 dying body rejects an open iterator pull",async()=>{
 const dir=resolve(".build","finding035-"+process.pid);
 try{
  await build(dir,(process.env.BUILD_MODE??"development") as BuildMode,{client:[],server:["./server.ts"]});
  const module=await import(dir+"/server.js"),result=await module.run();
  expect(result.first).toEqual({done:false,value:"first"});expect(result.transportFailed).toBe(true);
  expect(result.outcome.outcome).toBe("rejected");
 }finally{await rm(dir,{recursive:true,force:true})}
},5000);
```

### `server.ts`

```ts
import { RequestContext } from "@solidjs/web";
import { AsyncLocalStorage } from "node:async_hooks";
import {registerServerReference,handleServerFunctionRequest,decodeResponse} from "@solidjs/web/server-functions/server";
(globalThis as any)[RequestContext]=new AsyncLocalStorage();
export async function run(mode="error"){
 let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
 registerServerReference("body-death",async function*(){yield "first";await gate});
 const response=await handleServerFunctionRequest(new Request("http://localhost/_server/data/body-death",{method:"POST",body:"[]",headers:{origin:"http://localhost","content-type":"application/json","X-Server-Function-Format":"8"}}));
 const reader=response.body!.getReader();let cut!:()=>void;const failure=new Error("test-owned body failure");
 const body=new ReadableStream<Uint8Array>({start(controller){cut=()=>mode==="eof"?controller.close():controller.error(failure)},async pull(controller){const next=await reader.read();if(next.done)controller.close();else controller.enqueue(next.value)}});
 const [decoded,checked]=body.tee();
 const monitor=(async()=>{try{for await(const _chunk of checked){};return mode==="eof"}catch(error){return error===failure}})();
 try{
  const iterable:any=await decodeResponse(new Response(decoded,{headers:response.headers}));
  const iterator=iterable[Symbol.asyncIterator]();const first=await iterator.next();
  const next=iterator.next().then((value:any)=>({outcome:"resolved",value}), (error:any)=>({outcome:"rejected",message:error.message}));
  cut();const transportFailed=await monitor;
  const outcome=await Promise.race([next,new Promise(resolve=>setTimeout(()=>resolve({outcome:"pending"}),300))]);
  return {first,transportFailed,outcome};
 }finally{release();void reader.cancel().catch(()=>{})}
}
```

### `live-server.ts`

```ts
import {
  createServerReference,
  registerServerReference,
  handleServerFunctionRequest,
  GET,
} from "@solidjs/web/server-functions/server";
import { RequestContext } from "@solidjs/web";
import { AsyncLocalStorage } from "node:async_hooks";
(globalThis as any)[RequestContext] ??= new AsyncLocalStorage();
export let release: (() => void) | undefined;
export const stats = { opened: 0, closed: 0 };
GET(
  createServerReference(
    registerServerReference("standing", async function* () {
      try {
        yield ++stats.opened;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      } finally {
        stats.closed++;
      }
    }),
  ),
);
export const handle = (request: Request) => handleServerFunctionRequest(request);
```

### `live-client.ts`

```ts
import { live, GET, createServerReference } from "@solidjs/web/server-functions/client";
const values: number[] = [];
const status: string[] = [];
const source = live(GET(createServerReference("standing")))() as any;
source.onstatus = (state: string) => status.push(state);
(window as any).state = { values, status };
void (async () => {
  for await (const value of source) values.push(value);
})().catch((error) => ((window as any).state.error = String(error)));
```

### `live.test.ts`

```ts
import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { buildFrames } from './build';
test("A connected live source must reconnect after a real TCP drop", async () => {
  const dir = resolve(".build", "finding014-" + process.pid);
  await buildFrames(dir, (process.env.BUILD_MODE ?? "development") as any, {
    client: "live-client.ts",
    server: "live-server.ts",
  });
  const ssr = await import(dir + "/live-server.js");
  const fetchHandler = (request: Request) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/_server")) return ssr.handle(request);
    if (url.pathname.endsWith(".js"))
      return new Response(Bun.file(dir + url.pathname), {
        headers: { "content-type": "text/javascript" },
      });
    return new Response('<script type="module" src="/live-client.js"></script>', {
      headers: { "content-type": "text/html" },
    });
  };
  const server = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: fetchHandler });
  const downstream = new Set<any>();
  const proxy = Bun.listen<any>({
    hostname: "127.0.0.1",
    port: 0,
    socket: {
      open(socket) {
        downstream.add(socket);
        socket.data = { pending: [] as Buffer[], upstream: undefined as any };
        Bun.connect({
          hostname: "127.0.0.1",
          port: server.port!,
          socket: {
            open(upstream) {
              socket.data.upstream = upstream;
              for (const bytes of socket.data.pending) upstream.write(bytes);
              socket.data.pending.length = 0;
            },
            data(_upstream, bytes) {
              socket.write(bytes);
            },
            close() {
              socket.end();
            },
            error() {
              socket.terminate();
            },
          },
        }).catch(() => socket.terminate());
      },
      data(socket, bytes) {
        if (socket.data.upstream) socket.data.upstream.write(bytes);
        else socket.data.pending.push(Buffer.from(bytes));
      },
      close(socket) {
        downstream.delete(socket);
        socket.data.upstream?.terminate();
      },
      error(socket) {
        downstream.delete(socket);
        socket.data.upstream?.terminate();
      },
    },
  });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${proxy.port}`, { waitUntil: "commit" });
    await page.waitForFunction(() => (window as any).state?.values.length === 1, null, {
      timeout: 5000,
    });
    expect(ssr.stats.closed).toBe(0);
    expect(await page.evaluate(() => (window as any).state.status.at(-1))).toBe("connected");
    for (const socket of downstream) socket.terminate();
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => (window as any).state.status)).toContain("reconnecting");
  } finally {
    ssr.release?.();
    await browser.close();
    proxy.stop(true);
    server.stop(true);
    await rm(dir, { recursive: true, force: true });
  }
}, 30000);
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

A dropped live response should reconnect; a non-live iterator pull should reject. Instead live closes normally and a decoded pull stays pending.

## Why these two findings are grouped

The suspected shared cause is decoded-stream classification, not transport death alone. The JSON decoder recognizes streams via `__SEROVAL_STREAM__`; Seroval 1.6.8's JSON `Stream` class lacks that property. The same classification feeds both the abort sweep and the open-deferred count. The live loop treats a body ending with zero open deferreds as completion. That explains both pending pulls and `connected, closed` instead of `reconnecting`. This has not been confirmed by patching the runtime. The TCP repro below retains an unfinished producer and an origin that remains available; it does not simulate a clean server shutdown.

## Versions and builds

Development, observe and production where applicable; rc.13 also fails. The original failing snapshot was `53ef0e69`; the refresh target is `dafad1db34626feb5f154e98e599f65be1802c6c`. Refresh disposition is recorded in the batch index before filing.

## Related issues

[#3819](https://github.com/solidjs/solid/issues/3819), [#3125](https://github.com/solidjs/solid/issues/3125), [#3244](https://github.com/solidjs/solid/issues/3244), [#3232](https://github.com/solidjs/solid/issues/3232)

Local evidence: [finding 014](../../findings/014-live-drop-completes/README.md). Local evidence: [finding 035](../../findings/035-decoder-iterator-body-death/README.md).
