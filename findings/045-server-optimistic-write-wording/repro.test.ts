import {test,expect} from 'bun:test'
import {build} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
// 08-dev-diagnostics.md L635 says a server setter write "landed as inert data".
test('server optimistic setter lands inert data as the SERVER_WRITE paragraph says',async()=>{const dir=resolve('.build','inert-'+process.pid);await build(dir,(process.env.BUILD_MODE??'development') as any,{client:[],server:['findings/045-server-optimistic-write-wording/server.ts']});try{const{sample}=await import(dir+'/server.js');expect(sample(false)).toEqual({html:'1',updaters:1});expect(sample(true)).toEqual({html:'1',updaters:1})}finally{await rm(dir,{recursive:true,force:true})}})
