import {test,expect} from "bun:test";
import {chromium} from "playwright";
import {resolve} from "node:path";
import {rm} from "node:fs/promises";
import {build,type BuildMode} from "../../scripts/build";
for(const mode of ["development","observe","production"] as BuildMode[])test("RFC11 frame:applied is a bubbling post-apply document event "+mode,async()=>{
 const dir=resolve(".build","applied-"+process.pid+"-"+mode);await build(dir,mode,{client:["tracks/frames/applied-events/client.tsx"],server:[]});
 const server=Bun.serve({hostname:"127.0.0.1",port:0,fetch(request){const path=new URL(request.url).pathname;return path.endsWith(".js")?new Response(Bun.file(dir+path),{headers:{"content-type":"text/javascript"}}):new Response('<div id="client"></div><div id="root"></div><script type="module" src="/client.js"></script>',{headers:{"content-type":"text/html"}})}});
 const browser=await chromium.launch({channel:"chrome",headless:true});
 try{const page=await browser.newPage();const errors:string[]=[];page.on("pageerror",e=>errors.push(String(e)));await page.goto(String(server.url));await page.waitForFunction(()=>!!(window as any).result);const result=await page.evaluate(()=>(window as any).result);
 expect(result.clientEvents).toBe(0);expect(result.events).toEqual([{detail:{id:"applied",version:1,reason:"materialize"},bubbles:true,text:"one"},{detail:{id:"applied",version:2,reason:"morph"},bubbles:true,text:"two"}]);expect(result.text).toBe("two");expect(errors).toEqual([]);
 }finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}
},30000);
