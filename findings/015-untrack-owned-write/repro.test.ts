import { test, expect } from 'bun:test'
import { realpath } from 'node:fs/promises'
import { resolve } from 'node:path'

test('RFC 01 recommends writing in untracked blocks without ownedWrite',async()=>{
 const packages=new Map<string,{path:string,exports:Record<string,any>}>()
 for(const name of ['solid-js','@solidjs/signals']){const path=await realpath(resolve('node_modules',name));packages.set(name,{path,exports:(await Bun.file(path+'/package.json').json()).exports})}
 const outdir=resolve('.build/finding015')
 const result=await Bun.build({entrypoints:[resolve('findings/015-untrack-owned-write/module.ts')],outdir,target:'bun',plugins:[{name:'actual-browser-development',setup(builder){builder.onResolve({filter:/^(solid-js|@solidjs\/signals)$/},args=>{const pkg=packages.get(args.path)!;const entry=pkg.exports['.'];const browser=entry.browser??entry;const dev=browser[process.env.BUILD_MODE??'development']??browser.default;return{path:resolve(pkg.path,typeof dev==='string'?dev:dev.import??dev.default)}})}}]})
 expect(result.success).toBe(true)
 const runtime=await import(outdir+'/module.js')
 expect(runtime.run()).toBeUndefined()
})
