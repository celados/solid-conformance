import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {resolve} from 'node:path'
import {build} from '../../scripts/build'

test('03-control-flow.md L165: explicitly named client thrower/boundary owner paths exist in the observe artifact',async()=>{
 const dir=resolve('.build/owner-path-observe')
 await build(dir,'observe',{client:['tracks/docs/owner-path-observe-client.ts'],server:[]})
 const server=Bun.serve({hostname:'127.0.0.1',port:0,fetch(request){return new URL(request.url).pathname==='/client.js'?new Response(Bun.file(dir+'/owner-path-observe-client.js'),{headers:{'content-type':'text/javascript'}}):new Response('<!doctype html><script type="module" src="/client.js"></script>',{headers:{'content-type':'text/html'}})}})
 const browser=await chromium.launch({channel:'chrome',headless:true})
 try{const page=await browser.newPage();const messages:string[]=[];page.on('pageerror',error=>messages.push(String(error)));page.on('console',message=>{if(['warning','error'].includes(message.type()))messages.push(message.text())});await page.goto(String(server.url));await page.waitForFunction(()=>typeof(window as unknown as {ownerPathCheck?:unknown}).ownerPathCheck==='function');expect(await page.evaluate(()=>(window as unknown as {ownerPathCheck:()=>Promise<string>}).ownerPathCheck())).toBe('passed');expect(messages).toEqual([])}finally{await browser.close();server.stop(true)}
},30000)
