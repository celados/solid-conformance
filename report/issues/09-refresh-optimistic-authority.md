---
type: Issue
title: "Awaited refresh returns the caller optimistic override"
status: draft
tier: A
severity: med
findings: ['022']
target: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Awaited refresh returns the caller optimistic override

The authoritative source always resolves to 2; yield refresh inside the action returns its own optimistic 99 instead.

## Reproduction

Use a built Solid checkout at `dafad1db34626feb5f154e98e599f65be1802c6c` (all five package distributions, including the native compiler). Copy these files into an empty Bun project. The commands below explicitly link that HEAD build; omit the link command only to run the rc.13 comparison. HEAD-only cases pass on rc.13. Browser tests use system Google Chrome.

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

### `module.ts`

```ts
import { action, createOptimistic, createRoot, refresh, resolve } from 'solid-js'
export async function run() {
 let dispose!:()=>void
 const state=createRoot(d=>{dispose=d;const [read,write]=createOptimistic(()=>Promise.resolve(2));const save=action(function*(){write(99);return yield refresh(read)});return{read,save}})
 try {await resolve(state.read);return await state.save()} finally {dispose()}
}
```

### `repro.test.ts`

```ts
import { test, expect } from 'bun:test'
import { realpath } from 'node:fs/promises'
import { resolve } from 'node:path'

test('06-actions-optimistic.md: refresh delivers source truth, never the caller optimistic override',async()=>{
 const packages=new Map<string,{path:string,exports:Record<string,any>}>()
 for(const name of ['solid-js','@solidjs/signals']){const path=await realpath(resolve('node_modules',name));packages.set(name,{path,exports:(await Bun.file(path+'/package.json').json()).exports})}
 const outdir=resolve('.build/finding022')
 const result=await Bun.build({entrypoints:[resolve('./module.ts')],outdir,target:'bun',plugins:[{name:'actual-browser-development',setup(builder){builder.onResolve({filter:/^(solid-js|@solidjs\/signals)$/},args=>{const pkg=packages.get(args.path)!;const entry=pkg.exports['.'];const browser=entry.browser??entry;const dev=browser[process.env.BUILD_MODE??'development']??browser.default;return{path:resolve(pkg.path,typeof dev==='string'?dev:dev.import??dev.default)}})}}]})
 expect(result.success).toBe(true)
 const runtime=await import(outdir+'/module.js')
 expect(await runtime.run()).toBe(2)
})
```

## Expected versus actual

The authoritative source always resolves to 2; yield refresh inside the action returns its own optimistic 99 instead.

## Versions and builds

Verified on Solid HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`: 022: development, production.

Comparison: 022: rc.13 passes the same case. The original snapshot was `53ef0e69`; rc.13 results come from the versioned baseline evidence. No refreshed confirmed case passed.

## Related issues

No matching issue found in the recorded open/closed searches of Solid, Router and Start.

Local validation (review only; omit when filing): [finding 022](../../findings/022-refresh-optimistic-authority/README.md).

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

Local baseline validation (review only): [rc.13 022 logs](../evidence/022-rc13-development-supplement.log), plus the corresponding production log.
