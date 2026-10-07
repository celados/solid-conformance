import {test,expect} from 'bun:test';
import {resolve} from 'node:path';
import {rm} from 'node:fs/promises';
import {build,type BuildMode} from '../../scripts/build';
for(const mode of ['development','observe','production'] as BuildMode[])test('RFC10 real idle live response emits its 20s comment heartbeat '+mode,async()=>{
 const dir=resolve('.build','heartbeat-'+process.pid+'-'+mode);try{await build(dir,mode,{client:[],server:['tracks/frames/live-wire/server.ts']});const module=await import(dir+'/server.js');const result=await module.heartbeat();
 expect(result.initial).toContain('data:');expect(result.initial).toContain('"s":17');expect(result.text).toBe(':\n\n');expect(result.elapsed).toBeGreaterThan(18000);expect(result.elapsed).toBeLessThan(25000);expect(result.closed).toBe(1);expect(result.headers).toMatchObject({'content-type':'text/event-stream','cache-control':'no-store','x-accel-buffering':'no'});
 }finally{await rm(dir,{recursive:true,force:true})}
},35000);
