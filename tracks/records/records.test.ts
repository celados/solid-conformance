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
  const wire=await serverModule.traceWireCases();await Bun.write('artifacts/trace-wire-'+variant+'.json',JSON.stringify(wire,null,2));expect(wire.outside).toBeUndefined()
  const trace=await serverModule.traceCases()
  expect(trace.slotRegistered).toBe(variant!=='production');expect(trace.channelRegistered).toBe(variant!=='production')
  for(const row of trace.cases){
   if(variant==='production'){expect(row.calls).toBe(0);continue}
   expect(row.calls).toBe(1);expect(row.previous).toBe(0)
   if(row.scenario==='no-request'){expect(row.html).toContain('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');continue}
   expect(row.same).toBe(true)
   if(row.scenario==='throw'||row.scenario==='absent'){expect(row.trace.traceId).toBe('11111111111111111111111111111111');expect(row.errors).toBe(row.scenario==='throw'?1:0)}else{expect(row.trace).toMatchObject({traceId:'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',spanId:'cccccccccccccccc',parentId:'dddddddddddddddd',sampled:true});expect(row.header).toContain('vendor-entry');expect(row.trace.entries.vendor).toBe('vendor-entry')}
  }
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
   for(const call of calls){expect(call.live.serverTiming).toContain('solid-invocation');const value=Number(/solid-invocation;dur=([0-9.]+)/.exec(call.live.serverTiming)![1]),invocation=remote.find((r:any)=>r.event.id===call.event.id)!.event;expect(Math.abs(value-invocation.durationMs)).toBeLessThanOrEqual(0.051)}
   for(const r of remote){expect(r.event.direct).toBe(false);expect(r.live.request).toBe(true);expect(r.event).not.toHaveProperty('boundary')}
   const produced=http.find((r:any)=>r.type==='frame')!,consumed=client.records.find((r:any)=>r.type==='frame')!
   for(const key of ['id','version','chunks','fragments','slots','regions','errors'])expect(consumed.event[key]).toEqual(produced.event[key])
   expect(produced.event).toMatchObject({side:'server',outcome:'complete',slots:1,regions:1,errors:0});expect(consumed.event).toMatchObject({side:'client',outcome:'complete'});expect(consumed.live.response).toBe(true)
  }
  const artifact=await serverModule.artifactCase()
  const browserArtifact=await page.evaluate(()=>(window as any).recordsHarness.artifactCase())
  if(variant==='production'){expect(artifact).toBeNull();expect(browserArtifact).toBeNull()}else{
   expect(artifact!.records.invocation).toHaveLength(5);expect(artifact!.records.boundary).toHaveLength(1)
   expect(browserArtifact.artifact.records.call).toHaveLength(3);expect(browserArtifact.artifact.records.frame).toHaveLength(1)
   for(const a of [artifact,browserArtifact.artifact]){expect(a!.timeOrigin).toBeGreaterThan(0);expect(a!.attribution).not.toBeNull();expect(Object.keys(a!.records).sort()).toEqual(['boundary','call','frame','invocation','recovery']);expect(JSON.stringify(a)).not.toContain('private-argument');expect(JSON.stringify(a)).not.toContain('private-record-error')}
   expect(browserArtifact.live.feedback).toEqual(browserArtifact.artifact.attribution.feedback)
  }
  await page.evaluate(()=>(window as any).recordsHarness.close())
  const requests=await page.evaluate(()=>(window as any).recordsHarness.requestCases())
  await Bun.write('artifacts/requests-'+variant+'.json',JSON.stringify(requests,null,2))
  for(const row of requests){
   if(variant==='production'){expect(row.records).toEqual([]);continue}
   const calls=row.records.filter((r:any)=>r.type==='call'),opening=row.records.filter((r:any)=>r.type==='request')
   if(['prepare-throw','serialize-throw'].includes(row.scenario)){expect(opening).toHaveLength(0);expect(calls).toHaveLength(1);expect(row.sends).toBe(0);expect(calls[0].event.outcome).toBe('error');continue}
   expect(opening).toHaveLength(1);expect(row.sends).toBe(1)
   expect(calls).toHaveLength(['request-only','late-listener'].includes(row.scenario)?0:1)
   expect(opening[0].atSend.response).toBe(false)
   if(calls.length){expect(calls[0].identity).toBe(opening[0].identity);expect(calls[0].event.at+calls[0].event.durationMs).toBeGreaterThanOrEqual(opening[0].event.at)}
   if(row.scenario==='fetch-throw'){expect(calls[0].event.outcome).toBe('error');expect(calls[0].event).not.toHaveProperty('status');expect(calls[0].response).toBe(false);continue}
   expect(row.result).toBe(row.scenario==='handler-claimed'?9:7)
   if(row.scenario==='no-bodies'){expect(calls[0].request).toBe(false);expect(calls[0].bodyUsed).toBe(true)}
   if(row.scenario==='bodies'){expect(calls[0].header).toBe('final');expect(calls[0].requestBody).toBe('[3]');expect(calls[0].responseBody).toBe('7')}
   if(row.scenario==='reconstruction-failed'){expect(opening[0].request).toBe(false);expect(row.errors).toBe(0)}
   if(row.scenario==='listener-throw')expect(row.errors).toBe(1)
   if(row.scenario==='duplicate-listener')expect(row.records.filter((r:any)=>r.type==='duplicate')).toHaveLength(1)
   if(row.scenario==='pending-row')expect(row.pendingSnapshot).toEqual([{type:'request',response:false}])
   if(row.scenario==='request-only'){expect(opening[0].result).toBe(7);expect(opening[0].response).toBe(true)}
   if(row.scenario==='origin'||row.scenario==='origin-async-prepare'){expect(calls[0].originIdentity).toBe(true);expect(opening[0].originIdentity).toBe(true);expect(calls[0].event.origin.kind).toBe('interaction')}
   if(row.scenario==='after-await')expect(calls[0].event).not.toHaveProperty('origin')
   if(row.scenario==='body-stream'||row.scenario==='body-iterable'){expect(calls[0].request).toBe(true);expect(calls[0].requestBody).toBe('');expect(row.iterated).toBe(0);expect(row.streamLocked).toBe(false)}
   if(['body-string','body-blob'].includes(row.scenario))expect(calls[0].requestBody).toBe('fixture')
   if(row.scenario==='body-search')expect(calls[0].requestBody).toBe('a=b')
   if(['body-buffer','body-view'].includes(row.scenario))expect(calls[0].requestBody).toBe('AB')
   if(row.scenario==='body-form'){expect(calls[0].requestBody).toContain('name="a"');expect(calls[0].requestBody).toContain('b')}
  }
 }finally{await browser.close();server.stop(true);serverModule.stop();await rm(directory,{recursive:true,force:true})}
},60000)
