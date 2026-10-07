import {expect,test} from 'bun:test'
import {chromium} from 'playwright'
import {build} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
// 08 L477/L1139: cost folding separates optimistic and held overlay work,
// ranks self-time/downstream cost and blames equality cutoffs only on plain runs.
test('cost tables preserve exact rerun sums and exclude overlay waste',async()=>{const dir=resolve('.build','cost-overlay-'+process.pid);await build(dir,(process.env.BUILD_MODE??'development') as any,{client:['tracks/docs/cost-overlay-client.ts'],server:[]});const server=Bun.serve({port:0,fetch:r=>new URL(r.url).pathname==='/cost-overlay-client.js'?new Response(Bun.file(dir+'/cost-overlay-client.js'),{headers:{'content-type':'text/javascript'}}):new Response('<script type="module" src="/cost-overlay-client.js"></script>',{headers:{'content-type':'text/html'}})});const browser=await chromium.launch({channel:'chrome',headless:true});try{const page=await browser.newPage();await page.goto(server.url.toString());await page.waitForFunction(()=>!!(window as any).results);const result=await page.evaluate(()=>(window as any).results);expect(result.length).toBe(8);expect(result.filter((r:any)=>r.error)).toEqual([])}finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}},30000)
