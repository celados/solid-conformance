---
type: Issue
title: "Nested server region stays stale after refetch then argument change"
status: draft
tier: A
severity: med
findings: ['009']
target: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Nested server region stays stale after refetch then argument change

Refetching argument 1 and then requesting 2 should update the nested server span to 2; it stays 1.

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
import {
  createServerReference,
  registerServerReference,
  configureServerFunctionsServer,
  handleServerFunctionRequest,
} from "@solidjs/web/server-functions/server";
import { frameTransformResult } from "@solidjs/web/frames/server";
import { AsyncLocalStorage } from "node:async_hooks";
import { RequestContext } from "@solidjs/web";
(globalThis as any)[RequestContext] ??= new AsyncLocalStorage();
configureServerFunctionsServer({ transformResult: frameTransformResult });
createServerReference(
  registerServerReference("region", (id: number) => (p: any) => (
    <main>
      <p.wrap>
        <span>{id}</span>
      </p.wrap>
    </main>
  )),
);
export const handle = (r: Request) => handleServerFunctionRequest(r);
```

### `repro.test.ts`

```ts
import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { buildFrames } from './build';
test("A new server-function argument must replace nested server slot content", async () => {
  const directory = resolve(".build", "finding009-" + process.pid);
  await buildFrames(directory, (process.env.BUILD_MODE ?? "development") as any, {
    client: "./client.tsx",
    server: "./server.tsx",
  });
  const ssr = await import(directory + "/server.js");
  const server = Bun.serve({
    port: 0,
    fetch: (r) => {
      const u = new URL(r.url);
      if (u.pathname.startsWith("/_server")) return ssr.handle(r);
      if (u.pathname.endsWith(".js"))
        return new Response(Bun.file(directory + u.pathname), {
          headers: { "content-type": "text/javascript" },
        });
      return new Response('<div id="root"></div><script type="module" src="/client.js"></script>', {
        headers: { "content-type": "text/html" },
      });
    },
  });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(String(server.url));
    await page.waitForFunction(() => document.querySelector("section")?.textContent === "1");
    await page.evaluate(() => (window as any).refetch());
    await page.waitForTimeout(300);
    await page.evaluate(() => (window as any).change());
    await page.waitForTimeout(300);
    expect(await page.locator("section").textContent()).toBe("2");
  } finally {
    await browser.close();
    server.stop(true);
    await rm(directory, { recursive: true, force: true });
  }
}, 30000);
```

### `client.tsx`

```tsx
import { createSignal, Loading, flush } from "solid-js";
import { render, dynamic } from "@solidjs/web";
import { createServerReference } from "@solidjs/web/server-functions/client";
import { installServerComponents } from "@solidjs/web/frames";
installServerComponents();
const get = createServerReference("region");
const [id, setId] = createSignal(1);
const [version, setVersion] = createSignal(0);
const Component = dynamic(() => {
  version();
  return get(id()) as any;
});
render(
  () => (
    <Loading fallback={<b>pending</b>}>
      <Component wrap={(p: any) => <section>{p.children}</section>} />
    </Loading>
  ),
  document.getElementById("root")!,
);
(window as any).refetch = () => {
  setVersion(1);
  flush();
};
(window as any).change = () => {
  setId(2);
  flush();
};
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

Refetching argument 1 and then requesting 2 should update the nested server span to 2; it stays 1.

## Versions and builds

Verified on Solid HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`: 009: development, production.

Comparison: 009: rc.13 also fails the named contract. The original snapshot was `53ef0e69`; rc.13 results come from the versioned baseline evidence. No refreshed confirmed case passed.

## Related issues

[#2965](https://github.com/solidjs/solid/issues/2965), [#2974](https://github.com/solidjs/solid/issues/2974), [#2966](https://github.com/solidjs/solid/issues/2966)

Local evidence: [finding 009](../../findings/009-frame-nested-region-stale/README.md).

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
