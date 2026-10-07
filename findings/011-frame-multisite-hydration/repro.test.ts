import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
import {buildFrames} from '../../tracks/frames/build'
test('one shared server-component factory has independently hydrated client slots at each mount',async()=>{
 const mode=(process.env.BUILD_MODE??'development') as 'development'|'production',dir=resolve('.build','multisite-'+process.pid)
 await buildFrames(dir,mode,{client:'findings/011-frame-multisite-hydration/client.tsx',server:'findings/011-frame-multisite-hydration/server.tsx'})
 const ssr=await import(dir+'/server.js');const server=Bun.serve({port:0,fetch:r=>{const u=new URL(r.url);if(u.pathname.startsWith('/_server'))return ssr.handle(r);if(u.pathname.endsWith('.js'))return new Response(Bun.file(dir+u.pathname),{headers:{'content-type':'text/javascript'}});if(u.pathname==='/favicon.ico')return new Response(null,{status:204});return new Response(u.searchParams.has('hydrate')?ssr.documentStream().readable:'<div id="root"></div><script type="module" src="/client.js"></script>',{headers:{'content-type':'text/html'}})}})
 const browser=await chromium.launch({channel:'chrome',headless:true});try{for(const surface of ['csr','hydrate']){const page=await browser.newPage();await page.goto(server.url+(surface==='hydrate'?'?hydrate':''));await page.waitForFunction(()=>!!(window as any).ready);await page.evaluate(()=>(window as any).ready());expect(await page.locator('button').allTextContents()).toEqual(['0','0']);await page.locator('button').nth(1).click();console.log({surface,counters:await page.locator('button').allTextContents(),keys:await page.locator('button').evaluateAll(es=>es.map(e=>e.getAttribute('_hk')))});expect(await page.locator('button').allTextContents()).toEqual(['0','1']);await page.close()}}finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}
},30000)
