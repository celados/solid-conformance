import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {build,type BuildMode} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
test('RFC08 L1125/L1181: trusted Chrome event timings join the dispatched interaction on the performance clock',async()=>{
 const mode=(process.env.BUILD_MODE??'development') as BuildMode,dir=resolve('.build','input-clock-'+process.pid+'-'+mode)
 await build(dir,mode,{client:['tracks/records/input-client.tsx'],server:[]})
 const server=Bun.serve({port:0,fetch:r=>new URL(r.url).pathname.endsWith('.js')?new Response(Bun.file(dir+'/input-client.js'),{headers:{'content-type':'text/javascript'}}):new Response('<div id="root"></div><script type="module" src="/input-client.js"></script>',{headers:{'content-type':'text/html'}})}),browser=await chromium.launch({channel:'chrome',headless:true})
 try{const page=await browser.newPage();await page.goto(String(server.url));await page.locator('button').click();await page.waitForFunction(()=>(window as any).inputHarness.snapshot().entries.some((e:any)=>e.name==='click'));const result=await page.evaluate(()=>(window as any).inputHarness.snapshot());await Bun.write('artifacts/input-clock-'+mode+'.json',JSON.stringify(result,null,2));expect(result.count).toBe('1');const event=result.entries.find((e:any)=>e.name==='click');expect(event.interactionId).toBeGreaterThan(0);if(mode==='production')expect(result.records).toEqual([]);else{expect(result.records).toHaveLength(1);const record=result.records[0];expect(record.at).toBe(result.stamps[0]);expect(event.startTime).toBe(record.at);expect(record.handlerMs).toBeGreaterThanOrEqual(29);expect(record.inputDelayMs).toBeGreaterThanOrEqual(0);expect(record.settledMs).toBeGreaterThanOrEqual(record.handlerMs)}await page.evaluate(()=>(window as any).inputHarness.close())}finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}
},60000)
