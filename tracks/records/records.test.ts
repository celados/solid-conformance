import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {build,type BuildMode} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
import {runtimeReceipt} from '../../harness/runtime'
test('RFC 08/10/11: runtime records separate serializable events from live invocation/call/frame handles',async()=>{
 const variant=(process.env.BUILD_MODE??'development') as BuildMode,directory=resolve('.build','records-'+process.pid+'-'+variant)
 await build(directory,variant,{client:['tracks/records/client.tsx'],server:['tracks/records/server.tsx']})
 const serverModule=await import(directory+'/server.js') as typeof import('./server')
 const server=Bun.serve({port:0,hostname:'127.0.0.1',async fetch(request){const url=new URL(request.url);if(url.pathname.startsWith('/_server')||url.pathname.startsWith('/records/'))return serverModule.handle(request);if(url.pathname.endsWith('.js'))return new Response(Bun.file(directory+url.pathname),{headers:{'content-type':'text/javascript'}});return new Response('<!doctype html><div id="root"></div><script type="module" src="/client.js"></script>',{headers:{'content-type':'text/html'}})}})
 const browser=await chromium.launch({channel:'chrome',headless:true})
 try{
  const direct=await serverModule.serverCases();serverModule.reset()
  const page=await browser.newPage();await page.goto(String(server.url));await page.waitForFunction(()=>!!(window as any).recordsHarness)
  const client=await page.evaluate(()=>(window as any).recordsHarness.run());const http=serverModule.snapshot()
  await Bun.write(process.env.RECORD_RECEIPT??'artifacts/records-'+variant+'.json',JSON.stringify({runtime:await runtimeReceipt(),direct,client,http},null,2))
  expect(client.response).toEqual({value:'private-argument'});expect(client.dom).toContain('story-1-generation-0');expect(direct.result).toBe(3)
  if(variant==='production'){
   expect(direct.records).toEqual([]);expect(client.records).toEqual([]);expect(http).toEqual([])
  }else{
   // RFC 08 L824–896 / RFC 10 L74,L76 / RFC 11 L118:3: one settled record, live payloads, joins and monotonic spans.
   const all=[...direct.records,...client.records,...http]
   for(const {event} of all){expect(Number.isFinite(event.at)).toBe(true);if('durationMs' in event)expect(event.durationMs).toBeGreaterThanOrEqual(0);expect(JSON.stringify(event)).not.toContain('private-argument');expect(JSON.stringify(event)).not.toContain('private-record-error');expect(event).not.toHaveProperty('args');expect(event).not.toHaveProperty('result')}
   const invocations=direct.records.filter((r:any)=>r.type==='invocation')
   expect(invocations).toHaveLength(5)
   for(const r of invocations){expect(r.event.direct).toBe(true);expect(r.live.request).toBe(false)}
   expect(invocations.find((r:any)=>r.event.id==='records-sync')!.live.result).toBe(3)
   expect(invocations.find((r:any)=>r.event.id==='records-stream')!.event.deferred).toBe(true)
   expect(invocations.find((r:any)=>r.event.id==='records-fail')!.event.outcome).toBe('error')
   expect(invocations.find((r:any)=>r.event.id==='records-fail')!.live.error).toBe('Error: private-record-error')
   const boundary=direct.records.find((r:any)=>r.type==='boundary')!
   expect(boundary.event).toMatchObject({outcome:'settled',passes:2,heldMs:0,streamed:false})
   expect(invocations.filter((r:any)=>r.event.boundary===boundary.event.id)).toHaveLength(1)
   const renders=direct.records.filter((r:any)=>r.type==='render')
   expect(renders.map((r:any)=>r.event.mode)).toEqual(['string','stream'])
   expect(renders.map((r:any)=>r.event.boundaries)).toEqual([0,1])
   for(const r of renders){expect(r.event.outcome).toBe('complete');expect(r.event.shellMs).toBeLessThanOrEqual(r.event.durationMs)}
   const calls=client.records.filter((r:any)=>r.type==='call'),requests=client.records.filter((r:any)=>r.type==='request')
   expect(calls).toHaveLength(3);expect(requests).toHaveLength(3)
   expect(calls.map((r:any)=>r.event.method)).toEqual(['POST','POST','GET'])
   expect(calls.map((r:any)=>r.event.status)).toEqual([200,500,200])
   expect(calls[0].event.origin).toMatchObject({kind:'interaction',name:'click',target:'button#records'})
   for(const call of calls){const req=requests.find((r:any)=>r.live.identity===call.live.identity)!;expect(req.event.side).toBe('client');expect(req.event.at).toBeGreaterThanOrEqual(call.event.at);expect(req.event.at).toBeLessThanOrEqual(call.event.at+call.event.durationMs);expect(req.live.request).toBe(true);expect(req.event).not.toHaveProperty('status');expect(call.live.response).toBe(true);expect(call.live.bodyUsed).toBe(false)}
   const remote=http.filter((r:any)=>r.type==='invocation');expect(remote).toHaveLength(3)
   for(const r of remote){expect(r.event.direct).toBe(false);expect(r.live.request).toBe(true);expect(r.event).not.toHaveProperty('boundary')}
   const produced=http.find((r:any)=>r.type==='frame')!,consumed=client.records.find((r:any)=>r.type==='frame')!
   for(const key of ['id','version','chunks','fragments','slots','regions','errors'])expect(consumed.event[key]).toEqual(produced.event[key])
   expect(produced.event).toMatchObject({side:'server',outcome:'complete',slots:1,regions:1,errors:0});expect(consumed.event).toMatchObject({side:'client',outcome:'complete'});expect(consumed.live.response).toBe(true)
  }
  await page.evaluate(()=>(window as any).recordsHarness.close())
 }finally{await browser.close();server.stop(true);serverModule.stop();await rm(directory,{recursive:true,force:true})}
},60000)
