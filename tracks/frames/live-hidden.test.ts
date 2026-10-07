import {test,expect} from 'bun:test';
import {naturalChrome} from './live-hidden/chrome';
import {resolve} from 'node:path';
import {rm} from 'node:fs/promises';
import {build,type BuildMode} from '../../scripts/build';
for(const mode of ['development','observe','production'] as BuildMode[])test('RFC10 a genuinely hidden Chrome page retains its live connection '+mode,async()=>{
 const dir=resolve('.build','live-hidden-'+process.pid+'-'+mode);await build(dir,mode,{client:['tracks/frames/live-hidden/client.ts'],server:['tracks/frames/live-hidden/server.ts']});const ssr=await import(dir+'/server.js');
 const server=Bun.serve({hostname:'127.0.0.1',port:0,idleTimeout:0,fetch(request){const path=new URL(request.url).pathname;return path.startsWith('/_server')?ssr.handle(request):path.endsWith('.js')?new Response(Bun.file(dir+path),{headers:{'content-type':'text/javascript'}}):path==='/favicon.ico'?new Response(null,{status:204}):new Response('<div id="value"></div><script type="module" src="/client.js"></script>',{headers:{'content-type':'text/html'}})}});
 const taskChrome=await naturalChrome(dir+'/chrome-profile');const {browser,context}=taskChrome;try{const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(String(server.url));await page.waitForFunction(()=>document.getElementById('value')?.textContent==='first');expect(ssr.stats).toEqual({opened:1,closed:0});
 // Disable Playwright's synthetic focus override before minimizing the actual task window.
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:false});const {windowId}=await cdp.send('Browser.getWindowForTarget');await cdp.send('Browser.setWindowBounds',{windowId,bounds:{windowState:'minimized'}});await page.waitForFunction(()=>document.visibilityState==='hidden',{},{polling:100,timeout:5000});expect(await page.evaluate(()=>document.visibilityState)).toBe('hidden');
 ssr.sendSecond();await page.waitForFunction(()=>document.getElementById('value')?.textContent==='second',{},{polling:100,timeout:5000});expect(ssr.stats).toEqual({opened:1,closed:0});expect(await page.evaluate(()=>(window as any).hidden.requests)).toEqual(['/_server/live/hidden']);expect(await page.evaluate(()=>(window as any).hidden.statuses)).toEqual(['connected']);await page.evaluate(()=>(window as any).hidden.stop());for(let i=0;i<50&&!ssr.stats.closed;i++)await new Promise(r=>setTimeout(r,10));expect(ssr.stats).toEqual({opened:1,closed:1});expect(errors).toEqual([]);
 }finally{ssr.sendSecond();await taskChrome.close();server.stop(true);await rm(dir,{recursive:true,force:true})}
},30000);
