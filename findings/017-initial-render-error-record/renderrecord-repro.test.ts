import {test,expect} from 'bun:test';
import {resolve} from 'node:path';
import {rm} from 'node:fs/promises';
import {build,type BuildMode} from '../../scripts/build';
(process.env.BUILD_MODE==='production'?test.skip:test)('Initial stream render failure emits its render record after a normal-render positive control',async()=>{
 const directory=resolve('.build','finding017-render-'+process.pid);
 try{await build(directory,(process.env.BUILD_MODE??'development') as BuildMode,{client:[],server:['findings/017-initial-render-error-record/renderrecord-server.ts']});const module=await import(directory+'/renderrecord-server.js');const result=await module.run();expect(result.positive).toHaveLength(1);expect(result.positive[0].outcome).toBe('complete');expect(result.sameError).toBe(true);expect(result.records).toHaveLength(1);expect(result.records[0].outcome).toBe('error')}finally{await rm(directory,{recursive:true,force:true})}
});
