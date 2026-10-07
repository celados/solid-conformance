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
 const pending=runtime.run();pending.catch((error:unknown)=>console.log('Observed rejection:',String(error)));await expect(pending).resolves.toBeUndefined()
})
