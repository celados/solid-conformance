import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {build,type BuildMode} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
// RFC08 L1234: Unnamed nodes fall back to their owner id.
test('051 unnamed attribution nodes fall back to owner id',async()=>{const mode=(process.env.BUILD_MODE??'development') as BuildMode,dir=resolve('.build','finding051-'+process.pid);await build(dir,mode,{client:['findings/051-unnamed-attribution-owner-id/client.ts'],server:[]});const server=Bun.serve({port:0,fetch:r=>new URL(r.url).pathname.endsWith('.js')?new Response(Bun.file(dir+new URL(r.url).pathname),{headers:{'content-type':'text/javascript'}}):new Response('<script type="module" src="/client.js"></script>',{headers:{'content-type':'text/html'}})}),browser=await chromium.launch({channel:'chrome',headless:true});try{const page=await browser.newPage();await page.goto(String(server.url));await page.waitForFunction(()=>!!(window as any).finding051);const row=await page.evaluate(()=>(window as any).finding051);expect(row[0].nodeName).toBe('named');expect(typeof row[1].ownerId).toBe('string');expect([row[1].nodeName,row[2].nodeName]).toEqual([row[1].ownerId,row[2].ownerId])}finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}},30000)
