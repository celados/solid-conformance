import {test,expect} from 'bun:test'
import {build} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
// 08-dev-diagnostics.md L692 explicitly includes a plain object and a symbol
// in UNRECOGNIZED_INSERT_VALUE's warn-and-skip rule on server and client.
test('server Symbol insertion warns exactly like a plain object',async()=>{const dir=resolve('.build','symbol-'+process.pid);await build(dir,(process.env.BUILD_MODE??'development') as any,{client:[],server:['findings/033-symbol-insert-diagnostic/server.tsx']});try{const {sample}=await import(dir+'/server.js');const object=sample(false),symbol=sample(true);expect(object.html).not.toContain('[object Object]');expect(symbol.html).not.toContain('unrenderable');expect(object.warned).toBe(object.dev?1:0);expect(symbol.warned).toBe(symbol.dev?1:0)}finally{await rm(dir,{recursive:true,force:true})}})
