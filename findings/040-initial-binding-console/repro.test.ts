import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {build} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
test('RFC08 L17: a compiled binding diagnostic includes its DOM element on the initial compute',async()=>{
 const dir=resolve('.build','finding040-'+process.pid);await build(dir,'development',{client:['findings/040-initial-binding-console/client.tsx'],server:[]});const host=Bun.serve({port:0,fetch:r=>new URL(r.url).pathname.endsWith('.js')?new Response(Bun.file(dir+'/client.js'),{headers:{'content-type':'text/javascript'}}):new Response('<div id="root"></div><script type="module" src="/client.js"></script>',{headers:{'content-type':'text/html'}})}),browser=await chromium.launch({channel:'chrome',headless:true})
 try{const page=await browser.newPage();await page.goto(String(host.url));await page.waitForFunction(()=>!!(window as any).bindingRepro);const later=await page.evaluate(()=>(window as any).bindingRepro.run(false));expect(later.events).toHaveLength(1);expect(later.reports).toHaveLength(1);expect(later.reports[0].element).toBe(true);const initial=await page.evaluate(()=>(window as any).bindingRepro.run(true));expect(initial.events).toHaveLength(1);expect(initial.reports).toHaveLength(1);expect(initial.reports[0].element).toBe(true)}finally{await browser.close();host.stop(true);await rm(dir,{recursive:true,force:true})}
},60000)
