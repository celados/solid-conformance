import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {build} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
// 08 L700–702: bare thunk counter permutation, hydrate key misses and handlers;
// call holes, memo/children and For rows remain scoped.
test('unscoped thunk warnings expose server and hydrate permutation; call hole is quiet',async()=>{
 const mode=(process.env.BUILD_MODE??'development') as any,dir=resolve('.build','unscoped-'+process.pid)
 await build(dir,mode,{client:['tracks/docs/unscoped-client.tsx'],server:['tracks/docs/unscoped-server.tsx']});const runtime=await import(dir+'/unscoped-server.js');expect(runtime.negatives()).toBe(0)
 const server=Bun.serve({port:0,fetch:r=>{const url=new URL(r.url);return url.pathname.endsWith('.js')?new Response(Bun.file(dir+url.pathname),{headers:{'content-type':'text/javascript'}}):new Response(runtime.generateHydrationScript()+'<div id="root">'+runtime.page(url.searchParams.get('bad')==='true').html+'</div><script type="module" src="/unscoped-client.js"></script>',{headers:{'content-type':'text/html'}})}})
 const browser=await chromium.launch({channel:'chrome',headless:true});try{for(const bad of [false,true]){const rendered=runtime.page(bad);expect(rendered.events.length).toBe(mode==='development'&&bad?1:0);if(mode==='development'&&bad){const event=rendered.events[0];expect(event.kind).toBe('render');expect(event.severity).toBe('warn');expect(event.data.name).toBe('head');expect(Number(event.data.before)).toBeGreaterThan(Number(event.data.registered));expect(Number(event.data.after)).toBeGreaterThan(Number(event.data.before));expect(typeof event.data.hole).toBe('number')}
 const page=await browser.newPage();page.on('pageerror',e=>console.log('pageerror',String(e)));await page.goto(server.url+'?bad='+bad);await page.waitForFunction(()=>!!(window as any).inspect,{},{timeout:3000});await page.locator('header button').click();await page.locator('main button').click();const observed=await page.evaluate(()=>(window as any).inspect());expect(observed.events.length).toBe(mode==='development'&&bad?1:0);expect(observed.clicked).toBe(bad?0:2);if(mode==='development'&&bad){expect(observed.events[0].kind).toBe('render');expect(observed.events[0].severity).toBe('warn');expect(observed.events[0].data.name).toBe('head')};await page.evaluate(()=>(window as any).stop());await page.close()}}finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}
},30000)
