import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {build} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
// 08 L437: weak root registration permits otherwise-unreachable undisposed roots
// to collect, but a live dependency subscription retains its owner until dispose.
test('weak root registry collects dropped roots and retains subscribed roots',async()=>{
 const dir=resolve('.build','graph-gc-'+process.pid),mode=(process.env.BUILD_MODE??'development') as any
 await build(dir,mode,{client:['tracks/docs/graph-gc-client.ts'],server:[]})
 const server=Bun.serve({port:0,fetch:r=>new URL(r.url).pathname.endsWith('.js')?new Response(Bun.file(dir+new URL(r.url).pathname),{headers:{'content-type':'text/javascript'}}):new Response('<script type="module" src="/graph-gc-client.js"></script>',{headers:{'content-type':'text/html'}})})
 const browser=await chromium.launch({channel:'chrome',headless:true})
 try{const page=await browser.newPage();await page.goto(server.url.toString());await page.waitForFunction(()=>!!(window as any).probe);const supported=await page.evaluate(()=>(window as any).probe.supported);const cdp=await page.context().newCDPSession(page);const collect=async()=>{for(let n=0;n<3;n++){await cdp.send('HeapProfiler.collectGarbage');await page.evaluate(()=>new Promise(r=>setTimeout(r,0)))}};await collect();const before=await page.evaluate(()=>(window as any).probe.size());const dropped=await page.evaluate(()=>{(window as any).probe.dropped();return (window as any).probe.size()});if(supported)expect(dropped.owners).toBeGreaterThan(before.owners);await collect();expect(await page.evaluate(()=>(window as any).probe.size())).toEqual(before);await page.evaluate(()=>(window as any).probe.subscribed());await collect();const held=await page.evaluate(()=>(window as any).probe.size());if(supported){expect(held.owners).toBeGreaterThan(before.owners);expect(held.edges).toBeGreaterThan(before.edges)};await page.evaluate(()=>(window as any).probe.cleanup());await collect();expect(await page.evaluate(()=>(window as any).probe.size())).toEqual(before)}finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}
},30000)
