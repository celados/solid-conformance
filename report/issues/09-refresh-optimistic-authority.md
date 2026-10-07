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

In an empty Bun project, create the files below. No conformance-harness imports are needed. Browser cases use the installed system Google Chrome, not a downloaded browser. The rc.13 command is the comparison baseline; to reproduce HEAD, replace the five Solid packages with the matching built distributions from `solidjs/solid` commit `dafad1db34626feb5f154e98e599f65be1802c6c`. Do not mix package generations. 

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
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

HEAD-only; both builds fail and rc.13 passes. The original failing snapshot was `53ef0e69`; the refresh target is `dafad1db34626feb5f154e98e599f65be1802c6c`. Refresh disposition is recorded in the batch index before filing.

## Related issues

No matching issue found in the recorded open/closed searches of Solid, Router and Start.

Local evidence: [finding 022](../../findings/022-refresh-optimistic-authority/README.md).
