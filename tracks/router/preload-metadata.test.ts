import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {build,type BuildMode} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
test('RFC10 L186 metadata GET URL preloads once; navigation adopts cache; invalidation requests again',async()=>{
  const mode=(process.env.BUILD_MODE??'development') as BuildMode,dir=resolve('.build','router-preload-meta-'+process.pid)
  await build(dir,mode,{client:['tracks/router/preload-metadata-client.tsx'],server:['tracks/router/contract-server.tsx']})
  const mod=await import(dir+'/contract-server.js'),wire:{method:string,url:string}[]=[]
  const server=Bun.serve({port:0,fetch:async r=>{const path=new URL(r.url).pathname;if(path.startsWith('/_server')){wire.push({method:r.method,url:r.url});return mod.handle(r)}if(path.endsWith('.js'))return new Response(Bun.file(dir+path),{headers:{'content-type':'text/javascript'}});return new Response('<script type="module" src="/preload-metadata-client.js"></script>',{headers:{'content-type':'text/html'}})}})
  const browser=await chromium.launch({channel:'chrome',headless:true})
  try{const page=await browser.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(String(server.url));await page.waitForFunction(()=>!!(window as any).preloadMetadataResult);const r=await page.evaluate(()=>(window as any).preloadMetadataResult);expect(errors).toEqual([]);expect(r.postHasURL).toBe(false);expect(new URL(r.url,String(server.url)).pathname).toBe('/_server/data/router-meta-read');expect(JSON.parse(new URL(r.url,String(server.url)).searchParams.get('args')!)).toEqual([7]);expect(r.before).toBe('home');expect(r.after).toBe('9');expect(r.final).toBe('9');expect(r.intents).toContain('preload');expect(r.first).toBe(1);expect(wire).toHaveLength(2);expect(wire.map(r=>r.method)).toEqual(['GET','GET']);expect(wire.every(e=>e.url===new URL(r.url,String(server.url)).href)).toBe(true);expect(mod.dataCounts().reads).toBe(2)}finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}
},60000)
