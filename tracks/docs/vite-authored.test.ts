import {test,expect} from 'bun:test'
import {createServer,createBuilder} from 'vite'
import {chromium} from 'playwright'
import {resolve} from 'node:path'
import {mkdir,rm,cp} from 'node:fs/promises'
test('RFC11 L15 authored:  components:true generated entries wire real Vite dev SSR and Chrome hydration, with the same use-server compiler contract',async()=>{
 const manifest=await Bun.file('.upstream/vite-built.json').json(),solid=(await import(manifest.directory+'/dist/esm/index.mjs')).default
 const root=resolve('.scratch','vite-authored-'+process.pid);await mkdir(root,{recursive:true});await cp('tracks/docs/vite-authored-fixture/src',root+'/src',{recursive:true})
 const server=await createServer({root,configFile:false,plugins:solid({start:true,ssr:true,serverFunctions:{components:true},diagnostics:false,performanceTracks:false}),ssr:{noExternal:['solid-js','@solidjs/web','@solidjs/signals','seroval','seroval-plugins']},server:{host:'127.0.0.1',port:0},logLevel:'silent',optimizeDeps:{noDiscovery:true}})
 const browser=await chromium.launch({channel:'chrome',headless:true})
 try{await server.listen();const address=server.httpServer!.address() as {port:number},url='http://127.0.0.1:'+address.port+'/';const debug:any={};for(const id of ['virtual:solid-ssr-entry-server.tsx','virtual:solid-ssr-entry-client.tsx','virtual:solid-ssr-document.tsx','virtual:solid-server-function-handler']){const loaded=await server.pluginContainer.load(id,{ssr:true});debug[id]=typeof loaded==='string'?loaded:loaded?.code};await Bun.write('artifacts/vite-authored-code.json',JSON.stringify(debug,null,2));const response=await fetch(url,{headers:{accept:'text/html'},signal:AbortSignal.timeout(15000)}),html=await response.text();expect(response.status).toBe(200);await Bun.write('artifacts/vite-authored-html.html',html);expect(html).toContain('server-only-marker-');const page=await browser.newPage(),messages:string[]=[],requests:string[]=[];page.on('request',r=>{if(r.url().includes('/_server'))requests.push(r.url())});await page.route('**/favicon.ico',route=>route.fulfill({status:204}));page.on('pageerror',e=>messages.push(String(e)));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')messages.push(m.text())});await page.goto(url);await page.locator('button').click();await page.waitForFunction(()=>document.querySelector('button')?.textContent==='1');expect(await page.locator('button').textContent()).toBe('1');expect(await page.locator('h1').textContent()).toBe('server-only-marker-1');expect(messages).toEqual([]);expect(requests).toEqual([]);const clientCode=await(await fetch(url+'src/functions.tsx')).text();expect(clientCode).not.toContain('server-only-marker');const results={manifest,status:response.status,html,clientCode,messages,dom:await page.locator('main').textContent()};await Bun.write('artifacts/vite-authored-components.json',JSON.stringify(results,null,2))}finally{await browser.close();await server.close();await rm(root,{recursive:true,force:true})}
},90000)

test('RFC11 L15 authored:  components:true production generated handler renders and hydrates in Chrome',async()=>{
 const manifest=await Bun.file('.upstream/vite-built.json').json(),solid=(await import(manifest.directory+'/dist/esm/index.mjs')).default
 const root=resolve('.scratch','vite-authored-build-'+process.pid);await mkdir(root,{recursive:true});await cp('tracks/docs/vite-authored-fixture/src',root+'/src',{recursive:true})
 const browser=await chromium.launch({channel:'chrome',headless:true});let host:ReturnType<typeof Bun.serve>|undefined
 try{
  const builder=await createBuilder({root,configFile:false,plugins:solid({start:true,ssr:true,serverFunctions:{components:true},diagnostics:false,performanceTracks:false}),ssr:{noExternal:['solid-js','@solidjs/web','@solidjs/signals','seroval','seroval-plugins']},logLevel:'silent'})
  await builder.buildApp()
  const files=Array.from(new Bun.Glob('**/*.js').scanSync(root+'/dist/server'));await Bun.write('artifacts/vite-authored-production-files.json',JSON.stringify(files))
  const entry=files.find(f=>f==='index.js')??files.find(f=>!f.includes('assets/')&&!f.includes('chunks/'))!
  const handler=await import(root+'/dist/server/'+entry)
  host=Bun.serve({hostname:'127.0.0.1',port:0,async fetch(request){const path=new URL(request.url).pathname;if(path==='/favicon.ico')return new Response(null,{status:204});const file=Bun.file(root+'/dist/client'+path);if(path!=='/'&&await file.exists())return new Response(file);return handler.handleRequest(request)}})
  const response=await fetch(String(host.url),{headers:{accept:'text/html'},signal:AbortSignal.timeout(15000)}),html=await response.text();expect(response.status).toBe(200);expect(html).toContain('server-only-marker-')
  const page=await browser.newPage(),errors:string[]=[],requests:string[]=[];page.on('request',r=>{if(r.url().includes('/_server'))requests.push(r.url())});page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errors.push(m.text())});await page.goto(String(host.url));await page.locator('button').click();await page.waitForFunction(()=>document.querySelector('button')?.textContent==='1');expect(await page.locator('h1').textContent()).toBe('server-only-marker-1');expect(errors).toEqual([]);expect(requests).toEqual([])
  await Bun.write('artifacts/vite-authored-production.json',JSON.stringify({manifest,files,html,errors}))
 }finally{host?.stop(true);await browser.close();await rm(root,{recursive:true,force:true})}
},120000)
