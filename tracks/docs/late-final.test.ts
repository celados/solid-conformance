import {expect,test} from 'bun:test'
import {chromium} from 'playwright'
import {build} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
// 08 L477/L1139: cost folding separates optimistic and held overlay work,
// ranks self-time/downstream cost and blames equality cutoffs only on plain runs.
test('08 late diagnostics native records fields and exclusion controls',async()=>{const dir=resolve('.build','late-final-'+process.pid);await build(dir,(process.env.BUILD_MODE??'development') as any,{client:['tracks/docs/late-final-client.ts'],server:[]});const server=Bun.serve({port:0,fetch:r=>new URL(r.url).pathname==='/late-final-client.js'?new Response(Bun.file(dir+'/late-final-client.js'),{headers:{'content-type':'text/javascript'}}):new Response('<script type="module" src="/late-final-client.js"></script>',{headers:{'content-type':'text/html'}})});const browser=await chromium.launch({channel:'chrome',headless:true});try{const page=await browser.newPage();await page.goto(server.url.toString());await page.waitForFunction(()=>!!(window as any).lateFinalResults);const result=await page.evaluate(()=>(window as any).lateFinalResults);expect(result.length).toBe(4);expect(result.filter((r:any)=>r.error)).toEqual([])}finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}},30000)
