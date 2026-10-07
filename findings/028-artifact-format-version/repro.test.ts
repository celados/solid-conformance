import {test,expect} from 'bun:test'
import {build,type BuildMode} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
import {runtimeReceipt} from '../../harness/runtime'
test('08-dev-diagnostics.md L898: captureArtifact documents format v7',async()=>{
 console.log(await runtimeReceipt());const mode=(process.env.BUILD_MODE??'development') as BuildMode
 if(mode==='production')return
 const directory=resolve('.build','artifact-version-'+process.pid)
 try{await build(directory,mode,{client:[],server:['findings/028-artifact-format-version/server.ts']});const module=await import(directory+'/server.js');expect(await module.version()).toBe(7)}finally{await rm(directory,{recursive:true,force:true})}
},30000)
