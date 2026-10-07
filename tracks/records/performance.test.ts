import {test,expect} from 'bun:test'
import {build,type BuildMode} from '../../scripts/build'
import {chromium} from 'playwright'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
test('RFC 08 L1204–1226: native Chrome tracks, rich metadata, markers, tasks, shared holds and throwing host isolation',async()=>{
 const variant=(process.env.BUILD_MODE??'development') as BuildMode,directory=resolve('.build','performance-'+process.pid+'-'+variant)
 await build(directory,variant,{client:['tracks/records/performance-client.tsx'],server:[]})
 const server=Bun.serve({port:0,fetch(request){const path=new URL(request.url).pathname;return path.endsWith('.js')?new Response(Bun.file(directory+path),{headers:{'content-type':'text/javascript'}}):new Response('<div id="root"></div><script type="module" src="/performance-client.js"></script>',{headers:{'content-type':'text/html'}})}})
 const browser=await chromium.launch({channel:'chrome',headless:true})
 try{
  const page=await browser.newPage();await page.goto(String(server.url));await page.waitForFunction(()=>!!(window as any).performanceHarness)
  const result=await page.evaluate(()=>(window as any).performanceHarness.run());await Bun.write('artifacts/performance-'+variant+'.json',JSON.stringify(result,null,2))
  expect(result.value).toBe('8');expect(result.tasksWithoutEngine).toBe(0);expect(result.serverSlotKeys).toEqual([]);if(variant!=='production'){expect(JSON.stringify(result.entries).includes('Control Secret')).toBe(variant==='development');for(const row of result.privacy){expect(row.text.includes('Control Label')).toBe(row.level==='labels');expect(row.text).not.toContain('Private Cell')}}
  if(variant==='production'){expect(result.entries).toEqual([]);expect(result.tasks).toEqual([]);expect(result.warnings).toBe(0)}else{
   expect(result.entries.length).toBeGreaterThan(0);expect(result.after).toBeGreaterThan(result.before);expect(result.cleared).toBe(0)
   expect(result.warnings).toBe(variant==='development'?1:0)
   const tracks=result.entries.map((e:any)=>e.detail.devtools.track)
   for(const track of ['Interactions','Propagation','Effects','Memos','Async','Navigations','Holds'])expect(tracks).toContain(track)
   for(const entry of result.entries){expect(Number.isFinite(entry.start)).toBe(true);expect(entry.duration).toBeGreaterThanOrEqual(0)}
   expect(result.entries.some((e:any)=>e.detail.devtools.dataType==='marker'&&e.name.includes('NO_OWNER_CLEANUP'))).toBe(true)
   const named=result.entries.filter((e:any)=>e.name.includes('double')||e.name.includes('createDebounced'));expect(named.length).toBeGreaterThan(0);expect(named.every((e:any)=>!e.name.includes('<Outer>'))).toBe(true);expect(result.entries.some((e:any)=>e.name.includes('<Card> › createDebounced')&&!e.name.includes('createDebounced.value'))).toBe(true);expect(result.entries.some((e:any)=>e.name.includes('<Card> › <Show>'))).toBe(true);expect(named.some((e:any)=>e.detail.devtools.properties?.some((p:any)=>p[0]==='Owner path'&&p[1].includes('<Outer>')))).toBe(true);const marker=result.entries.find((e:any)=>e.name.includes('NO_OWNER_CLEANUP'));expect(marker.detail.devtools.performanceIssue).toBeDefined();if(variant==='development')expect(marker.detail.devtools.performanceIssue.learnMoreUrl).toContain('#no_owner_cleanup');
   if(variant==='development')expect(result.tasks.length).toBeGreaterThan(0);else expect(result.tasks).toEqual([])
  }
 }finally{await browser.close();server.stop(true);await rm(directory,{recursive:true,force:true})}
},60000)
