import {test,expect} from 'bun:test'
import {build,type BuildMode} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
test('RFC08 L801/L902 and RFC12 L201–205: pre-runtime subscriptions cross bundled copies; real response trace and metric gates',async()=>{
 const mode=(process.env.BUILD_MODE??'development') as BuildMode,dir=resolve('.build','trace-protocol-'+process.pid+'-'+mode)
 try{
  await build(dir,mode,{client:[],server:['tracks/records/records-copy.ts','tracks/records/trace-cases.tsx']})
  const first=await import(dir+'/records-copy.js');const seen:any[]=[]
  const off=first.channel()?.subscribe('render',(event:any)=>seen.push(event))
  const runtime=await import(dir+'/trace-cases.js')
  expect(runtime.channel()).toBe(first.channel());expect(runtime.serverSlot()).toBe(first.serverSlot())
  await runtime.traceCases();expect(seen.length>0).toBe(mode!=='production');off?.()
  const result=await runtime.traceWireCases();await Bun.write('artifacts/trace-protocol-'+mode+'.json',JSON.stringify({result,seen},null,2))
  expect(result.outside).toBeUndefined()
  for(const row of result.rows){expect(row.header).toContain('app;dur=1');expect(row.header).toContain('traceparent');expect(row.header).not.toContain('vendor=upstream');expect(row.header).not.toContain('private=upstream');if(row.scenario==='redirect'){expect(row.header).toContain('desc="application"');continue}expect(row.html).not.toContain('vendor=upstream');expect(row.html).not.toContain('private=upstream');expect(row.html).toContain('<meta name="traceparent"');const active=mode==='development'||mode==='observe'&&row.listener;expect(row.header.includes('solid-shell')).toBe(active);expect(row.header.includes('solid-boundary')).toBe(active&&row.deferred);if(row.listener&&mode!=='production'){const render=row.records.find((r:any)=>r.type==='render').event,boundary=row.records.find((r:any)=>r.type==='boundary').event;expect(boundary.streamed).toBe(!row.deferred);const shell=Number(/solid-shell;dur=([0-9.]+)/.exec(row.header)![1]);expect(Math.abs(shell-render.shellMs)).toBeLessThanOrEqual(0.051);if(row.deferred){const duration=Number(/solid-boundary;dur=([0-9.]+)/.exec(row.header)![1]);expect(Math.abs(duration-boundary.durationMs)).toBeLessThanOrEqual(0.051)}}}
 }finally{await rm(dir,{recursive:true,force:true})}
},60000)
