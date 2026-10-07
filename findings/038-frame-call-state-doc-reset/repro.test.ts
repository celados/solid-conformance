import {test,expect} from "bun:test";
import {chromium} from "playwright";
import {resolve} from "node:path";
import {rm} from "node:fs/promises";
import {build,type BuildMode} from "../../scripts/build";
test("RFC11 state inside a boundary resets for new call arguments",async()=>{
 const dir=resolve(".build","finding038-"+process.pid);
 await build(dir,(process.env.BUILD_MODE??"development") as BuildMode,{client:["findings/038-frame-call-state-doc-reset/client.tsx"],server:["findings/038-frame-call-state-doc-reset/server.tsx"],serverComponents:true});
 const ssr=await import(dir+"/server.js");const server=Bun.serve({hostname:"127.0.0.1",port:0,fetch(request){const url=new URL(request.url);return url.pathname.startsWith("/_server")?ssr.handle(request):url.pathname.endsWith(".js")?new Response(Bun.file(dir+url.pathname),{headers:{"content-type":"text/javascript"}}):new Response('<div id="root"></div><script type="module" src="/client.js"></script>',{headers:{"content-type":"text/html"}})}});
 const browser=await chromium.launch({channel:"chrome",headless:true});
 try{const page=await browser.newPage();await page.goto(String(server.url));await page.waitForFunction(()=>document.querySelector("h1")?.textContent==="1");expect(await page.locator("[data-inside]").textContent()).toBe("0");await page.locator("[data-inside]").click();await page.locator("[data-outside]").click();expect(await page.locator("[data-inside]").textContent()).toBe("1");await page.evaluate(()=>(window as any).change());await page.waitForFunction(()=>document.querySelector("h1")?.textContent==="2");expect(await page.locator("[data-outside]").textContent()).toBe("1");expect(await page.locator("[data-inside]").textContent()).toBe("0");
 }finally{await browser.close();server.stop(true);await rm(dir,{recursive:true,force:true})}
},30000);
