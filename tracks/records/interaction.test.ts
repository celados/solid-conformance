import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {build,type BuildMode} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
test('RFC08 L539–541: async handler default thresholds, rejection, write/action acknowledgements and the 10s bounded cap',async()=>{
 const mode=(process.env.BUILD_MODE??'development') as BuildMode,dir=resolve('.build','interaction-clock-'+process.pid+'-'+mode)
 await build(dir,mode,{client:['tracks/records/interaction-client.ts'],server:[]})
 const server=Bun.serve({port:0,fetch:r=>new URL(r.url).pathname.endsWith('.js')?new Response(Bun.file(dir+'/interaction-client.js'),{headers:{'content-type':'text/javascript'}}):new Response('<script type="module" src="/interaction-client.js"></script>',{headers:{'content-type':'text/html'}})}),browser=await chromium.launch({channel:'chrome',headless:true})
 try{
  const rows=[]
  for(const [kind,ms,end,code,severity] of [['plain',99,'resolve',false,null],['plain',100,'resolve',true,'info'],['plain',200,'reject',true,'warn'],['write',200,'resolve',false,null],['action',200,'resolve',false,null],['plain',10000,'cap',true,'warn']] as const){
   const page=await browser.newPage();await page.clock.install();await page.goto(String(server.url));await page.waitForFunction(()=>!!(window as any).interactionProtocol);await page.clock.pauseAt(new Date('2050-01-01T00:00:00Z'))
   await page.evaluate(k=>(window as any).interactionProtocol.start(k),kind)
   if(end==='cap'){await page.clock.runFor(9999);const before=await page.evaluate(()=>(window as any).active.snapshot());expect(before.records).toEqual([]);await page.clock.runFor(1)}else{await page.clock.runFor(ms);await page.evaluate(e=>(window as any).active[e](),end);await page.clock.runFor(0)}
   const row=await page.evaluate(()=>(window as any).active.snapshot());rows.push({kind,ms,end,...row})
   if(mode==='production'){expect(row.events).toEqual([]);expect(row.records).toEqual([])}else{
    expect(row.records).toHaveLength(1);const event=row.records[0];expect(event.continuationMs).toBe(ms);expect(event.settledMs).toBe(ms)
    const warnings=row.events.filter((e:any)=>e.code==='UNTRACKED_ASYNC_HANDLER');expect(warnings).toHaveLength(code?1:0)
    if(code){expect(warnings[0].severity).toBe(severity);expect(warnings[0].data.capped).toBe(end==='cap');expect(warnings[0].data.continuationMs).toBe(ms);expect(row.live[row.events.indexOf(warnings[0])]).toBe(false)}
   }
   await page.evaluate(()=>(window as any).active.close());await page.close()
  }
  await Bun.write('artifacts/interaction-clock-'+mode+'.json',JSON.stringify(rows,null,2))
 }finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}
},90000)
