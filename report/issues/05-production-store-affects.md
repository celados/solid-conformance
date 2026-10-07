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

Use a built Solid checkout at `dafad1db34626feb5f154e98e599f65be1802c6c` (all five package distributions, including the native compiler). Copy these files into an empty Bun project. The commands below explicitly link that HEAD build; omit the link command only to run the rc.13 comparison. HEAD-only cases pass on rc.13. Browser tests use system Google Chrome.

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
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

Verified on Solid HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`: 016: production.

Comparison: 016: rc.13 passes the same case. The original snapshot was `53ef0e69`; rc.13 results come from the versioned baseline evidence. No refreshed confirmed case passed.

## Related issues

[#2887](https://github.com/solidjs/solid/issues/2887)

Local evidence: [finding 016](../../findings/016-production-store-affects/README.md).

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
