---
type: Issue
title: "Async-generator action times out on its authoritative live echo"
status: draft
tier: A
severity: med
findings: ['053']
target: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Async-generator action times out on its authoritative live echo

After await 0, yield until should acknowledge the matching authoritative row without accepting its optimistic guess. It times out; a bare yield before until works.

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
import {createRoot,createSignal,createOptimisticStore,action,until,flush} from 'solid-js'
export async function run(reenter=true){let close!:()=>void;const state=createRoot(dispose=>{close=dispose;const[source,write]=createSignal<{clientId:string}[]>([]),[rows,set]=createOptimisticStore(()=>source(),[]);let confirmed=false;const save=action(async function*(){set(d=>{d.push({clientId:'c1'})});await 0;if(reenter)yield;yield until(()=>rows.some(row=>row.clientId==='c1'),{timeout:100});confirmed=true});return{write,save,confirmed:()=>confirmed}});try{const done=state.save().then(()=>({confirmed:state.confirmed(),error:undefined}),error=>({confirmed:state.confirmed(),error:String(error)}));await new Promise(resolve=>setTimeout(resolve,10));const beforeEcho=state.confirmed();state.write([{clientId:'c1'}]);flush();return{beforeEcho,...await done}}finally{close()}}
```

### `repro.test.ts`

```ts
import{test,expect}from'bun:test';import {realpath}from'node:fs/promises';import{resolve}from'node:path';test('06-actions-optimistic.md C166: await fire-and-forget send then until waits for the authoritative live echo',async()=>{const packages=new Map<string,{path:string,exports:Record<string,any>}>();for(const name of ['solid-js','@solidjs/signals']){const path=await realpath(resolve('node_modules',name));packages.set(name,{path,exports:(await Bun.file(path+'/package.json').json()).exports})}const built=await Bun.build({entrypoints:[resolve('./module.ts')],outdir:resolve('.build/finding053'),target:'bun',plugins:[{name:'actual-browser',setup(builder){builder.onResolve({filter:/^(solid-js|@solidjs\/signals)$/},args=>{const pkg=packages.get(args.path)!,entry=pkg.exports['.'],browser=entry.browser??entry,selected=browser[process.env.BUILD_MODE??'development']??browser.default;return{path:resolve(pkg.path,typeof selected==='string'?selected:selected.import??selected.default)}})}}]});expect(built.success).toBe(true);const r=await import(resolve('.build/finding053/module.js'));expect(await r.run()).toEqual({beforeEcho:false,confirmed:true,error:undefined});expect(await r.run(false)).toEqual({beforeEcho:false,confirmed:true,error:undefined})},30000)
```

## Expected versus actual

After await 0, yield until should acknowledge the matching authoritative row without accepting its optimistic guess. It times out; a bare yield before until works.

## Context

Adding a bare `yield` after the native `await` is a passing workaround. This shape is the live-send example in chapter 06; rc.13 also completes without that workaround. Please decide whether the current runtime regression should be fixed or the example/context requirement should change. The workaround alone does not establish intended semantics.

## Versions and builds

Verified on Solid HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`: 053: development, production.

Comparison: 053: rc.13 passes the same case. The original snapshot was `53ef0e69`; rc.13 results come from the versioned baseline evidence. No refreshed confirmed case passed.

## Related issues

[#3687](https://github.com/solidjs/solid/issues/3687)

Local evidence: [finding 053](../../findings/053-await-send-until-context/README.md).

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
