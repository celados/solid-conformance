import {test,expect} from 'bun:test'
import {build} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
// 10-server-functions.md L304: query/action/liveQuery intentionally don't forward
// SERVER_FUNCTION_INVOKE; callers must retain the reference beneath the wrapper.
test('router wrappers reject invoke while the server reference is invocable',async()=>{const dir=resolve('.build','router-invoke-'+process.pid);await build(dir,(process.env.BUILD_MODE??'development') as any,{client:[],server:['tracks/router/invocation-server.ts']});try{const {run}=await import(dir+'/invocation-server.js');const result=await run();console.log(result);expect(result.base).toBe(3);expect(result.calls).toBe(1);expect(result.errors.length).toBe(3);for(const error of result.errors)expect(error).toContain('invoke')}finally{await rm(dir,{recursive:true,force:true})}})
