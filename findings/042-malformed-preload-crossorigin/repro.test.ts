import {test,expect} from 'bun:test'
import {build} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
// 08-dev-diagnostics.md L680 expressly diagnoses malformed crossorigin.
// as any permits an external manifest's malformed field to reach its runtime validator.
test('malformed preload crossorigin is diagnosed rather than emitted as garbage',async()=>{const dir=resolve('.build','cors-'+process.pid);await build(dir,(process.env.BUILD_MODE??'development') as any,{client:[],server:['findings/042-malformed-preload-crossorigin/server.tsx']});try{const {sample}=await import(dir+'/server.js');const missing=await sample(undefined),valid=await sample('anonymous'),bad=await sample(42);expect(missing.events.length).toBe(missing.dev?1:0);expect(valid.events).toEqual([]);expect(bad.html).toContain('page');expect(bad.events.length).toBe(bad.dev?1:0);if(bad.dev){expect(bad.events[0].data.field).toBe('crossorigin');expect(bad.events[0].data.value).toBe(42)}}finally{await rm(dir,{recursive:true,force:true})}})
