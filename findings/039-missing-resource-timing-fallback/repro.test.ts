import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {build,type BuildMode} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
test('RFC08 L1222: a resource-less call gets a centred server span after the 30 second observer window',async()=>{
 const mode=(process.env.BUILD_MODE??'development') as BuildMode,dir=resolve('.build','server-fallback-'+process.pid+'-'+mode)
 await build(dir,mode,{client:['findings/039-missing-resource-timing-fallback/client.ts'],server:[]})
 const host=Bun.serve({port:0,fetch:r=>new URL(r.url).pathname.endsWith('.js')?new Response(Bun.file(dir+'/client.js'),{headers:{'content-type':'text/javascript'}}):new Response('<script type="module" src="/client.js"></script>',{headers:{'content-type':'text/html'}})}),browser=await chromium.launch({channel:'chrome',headless:true})
 try{const page=await browser.newPage();await page.goto(String(host.url));await page.waitForFunction(()=>!!(window as any).serverPerformance);const positive=await page.evaluate(async()=>{const active=await(window as any).serverPerformance.cache(false);try{return active.snapshot()}finally{active.close()}});expect(positive).toHaveLength(mode==='production'?0:1);await page.clock.install();await page.clock.pauseAt(new Date('2050-01-01T00:00:00Z'));const before=await page.evaluate(async()=>{const active=await(window as any).serverPerformance.cache(true);(window as any).fallback=active;return {result:active.result,calls:active.calls,entries:active.snapshot(),nativeObserver:typeof PerformanceObserver}});expect(before.result).toBe(17);expect(before.nativeObserver).toBe('function');expect(before.entries).toEqual([]);if(mode!=='production')expect(before.calls).toHaveLength(1);await page.clock.runFor(30001);await page.evaluate(async()=>{await(await fetch('/probe?expiry')).text()});await page.clock.runFor(100);const entries=await page.evaluate(()=>{const active=(window as any).fallback;try{return active.snapshot()}finally{active.close()}});await Bun.write('artifacts/server-fallback-'+mode+'.json',JSON.stringify({before,entries},null,2));expect(entries).toHaveLength(mode==='production'?0:1)
 }finally{await browser.close();host.stop(true);await rm(dir,{recursive:true,force:true})}
},60000)
