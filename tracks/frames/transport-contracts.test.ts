import {test,expect} from "bun:test";
import {chromium} from "playwright";
import {resolve} from "node:path";
import {rm} from "node:fs/promises";
import {build,type BuildMode} from "../../scripts/build";
for(const mode of ["development","observe","production"] as BuildMode[])test("RFC10 transport awaits the replacement hook and owns one consumer per source "+mode,async()=>{
 const dir=resolve(".build","transport-"+process.pid+"-"+mode);await build(dir,mode,{client:["tracks/frames/transport-contracts/client.ts"],server:[]});
 const server=Bun.serve({hostname:"127.0.0.1",port:0,fetch(request){const path=new URL(request.url).pathname;return path.endsWith(".js")?new Response(Bun.file(dir+path),{headers:{"content-type":"text/javascript"}}):new Response('<script type="module" src="/client.js"></script>',{headers:{"content-type":"text/html"}})}});
 const browser=await chromium.launch({channel:"chrome",headless:true});
 try{const page=await browser.newPage();const errors:string[]=[];page.on("pageerror",e=>errors.push(String(e)));await page.goto(String(server.url));await page.waitForFunction(()=>!!(window as any).result);const result=await page.evaluate(()=>(window as any).result);
 expect(result.before).toBe(0);expect(result.hooks).toEqual(['replacement','replacement','replacement']);expect(result.value).toBe(7);expect(result.events).toEqual([['current',{answer:9}]]);expect(result.passthrough).toBe(true);expect(result.envelope).toEqual({value:7,data:{owned:{answer:9}}});
 expect(result.sent.map((x:any)=>x.address)).toEqual(['/fixture/data/transport','/fixture/data/transport','/fixture/data/transport']);expect(result.sent[0].headers).toContainEqual(['x-fixture','ready']);expect(result.sent[0].headers).toContainEqual(['x-single-flight','owned']);expect(result.sent[1].headers.some((x:any)=>x[0]==='x-single-flight')).toBe(false);expect(result.sent[0]).toMatchObject({signal:true,priority:'low',keepalive:true});expect(result.encodingStarted).toBe(true);expect(result.encodingBefore).toBe(2);expect(result.sent[2].body).toBe("fixture-rich-encoding");expect(result.liveValues).toEqual([1,2]);expect(result.statuses).toEqual(["connected","connected","closed","closed"]);expect(result.closed).toEqual([true,true]);expect(result.liveAddresses).toEqual(["/fixture/live/standing","/fixture/live/standing"]);expect(result.initialFailures).toEqual([400,404,408,425,429,500].map(status=>({status,calls:1,errorStatus:status})));expect(errors).toEqual([]);
 }finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}
},30000);
