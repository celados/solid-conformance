import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {build,type BuildMode} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
// RFC08 C1081 says every compiled event binding stamps an interaction.
test('050 literal compiled native handler must stamp an interaction',async()=>{const mode=(process.env.BUILD_MODE??'development') as BuildMode,dir=resolve('.build','finding050-'+process.pid);await build(dir,mode,{client:['findings/050-literal-handler-attribution/client.tsx'],server:[]});const server=Bun.serve({port:0,fetch:r=>new URL(r.url).pathname.endsWith('.js')?new Response(Bun.file(dir+new URL(r.url).pathname),{headers:{'content-type':'text/javascript'}}):new Response('<script type="module" src="/client.js"></script>',{headers:{'content-type':'text/html'}})}),browser=await chromium.launch({channel:'chrome',headless:true});try{const page=await browser.newPage();await page.goto(String(server.url));await page.waitForFunction(()=>!!(window as any).finding);const row=await page.evaluate(()=>(window as any).finding);expect(row.origins[0]).toBe('interaction');expect(row.origins[1]).toBe('interaction')}finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}},30000)
