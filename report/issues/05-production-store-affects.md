---
type: Issue
title: "Production tree shaking removes store affects registration"
status: draft
tier: A
severity: high
findings: ['016']
target: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Production tree shaking removes store affects registration

affects(store, key) inside an action should not throw. Production bundles reject with GlobalQueue.O is not a function; disabling tree shaking passes.

## Reproduction

In an empty Bun project, create the files below. No conformance-harness imports are needed. Browser cases use the installed system Google Chrome, not a downloaded browser. The rc.13 command is the comparison baseline; to reproduce HEAD, replace the five Solid packages with the matching built distributions from `solidjs/solid` commit `dafad1db34626feb5f154e98e599f65be1802c6c`. Do not mix package generations. 

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
BUILD_MODE=production bun test ./repro.test.ts
```

### `module.ts`

```ts
import { action, affects, createRoot, createStore } from 'solid-js'
export async function run() {
 let dispose!:()=>void
 const save=createRoot(d=>{dispose=d;const [store]=createStore({n:1});return action(function*(){affects(store,'n')})})
 try {await save()} finally {dispose()}
}
```

### `repro.test.ts`

```ts
import { test, expect } from 'bun:test'
import { realpath } from 'node:fs/promises'
import { resolve } from 'node:path'

test('RFC 06 production affects(store,key) must not throw',async()=>{
 const packages=new Map<string,{path:string,exports:Record<string,any>}>()
 for(const name of ['solid-js','@solidjs/signals']){const path=await realpath(resolve('node_modules',name));packages.set(name,{path,exports:(await Bun.file(path+'/package.json').json()).exports})}
 const outdir=resolve('.build/finding016')
 const result=await Bun.build({entrypoints:[resolve('./module.ts')],outdir,target:'bun',treeShaking:process.env.NO_TREE_SHAKE!=='1',ignoreDCEAnnotations:process.env.NO_TREE_SHAKE==='1',plugins:[{name:'actual-browser-development',setup(builder){builder.onResolve({filter:/^(solid-js|@solidjs\/signals)$/},args=>{const pkg=packages.get(args.path)!;const entry=pkg.exports['.'];const browser=entry.browser??entry;const dev=browser[process.env.BUILD_MODE??'production']??browser.default;return{path:resolve(pkg.path,typeof dev==='string'?dev:dev.import??dev.default)}})}}]})
 expect(result.success).toBe(true)
 const runtime=await import(outdir+'/module.js')
 await expect(runtime.run()).resolves.toBeUndefined()
})
```

## Expected versus actual

affects(store, key) inside an action should not throw. Production bundles reject with GlobalQueue.O is not a function; disabling tree shaking passes.

## Versions and builds

HEAD-only and production-only; development and rc.13 pass. The original failing snapshot was `53ef0e69`; the refresh target is `dafad1db34626feb5f154e98e599f65be1802c6c`. Refresh disposition is recorded in the batch index before filing.

## Related issues

[#2887](https://github.com/solidjs/solid/issues/2887)

Local evidence: [finding 016](../../findings/016-production-store-affects/README.md).
