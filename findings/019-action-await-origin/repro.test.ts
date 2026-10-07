import {test,expect} from 'bun:test'
import {build} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
test('RFC 08 L1154: action-body writes after await are stamped async',async()=>{
 const directory=resolve('.build','finding019-'+process.pid)
 try{
  await build(directory,'development',{client:['findings/019-action-await-origin/module.ts'],server:[]})
  const child=Bun.spawn(['bun','-e','const m=await import(process.argv[1]);console.log(JSON.stringify(await m.run()))',directory+'/module.js'],{stdout:'pipe',stderr:'pipe'})
  const output=await new Response(child.stdout).text();expect(await child.exited).toBe(0);expect(JSON.parse(output)).toBe('async')
 }finally{await rm(directory,{recursive:true,force:true})}
})
