import {test,expect} from 'bun:test';
import {resolve} from 'node:path';
import {rm} from 'node:fs/promises';
import {build,type BuildMode} from '../../scripts/build';
for(const mode of ['development','observe','production'] as BuildMode[])test('RFC10 chaosReconnectEvery errors live bodies only in development '+mode,async()=>{
 const dir=resolve('.build','chaos-'+process.pid+'-'+mode);try{await build(dir,mode,{client:[],server:['tracks/frames/live-wire/server.ts']});const module=await import(dir+'/server.js');const result=await module.chaos();expect(result.initial).toContain('"s":42');expect(result.outcome).toEqual(mode==='development'?{kind:'error',message:'Live response ended by the chaos knob.'}:{kind:'pending'});expect(result.closed).toBe(1);
 }finally{await rm(dir,{recursive:true,force:true})}
},5000);
