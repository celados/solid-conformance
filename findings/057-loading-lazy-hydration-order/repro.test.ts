import {test,expect} from 'bun:test'
import {build,type BuildMode} from '../../scripts/build'
import {resolve} from 'node:path'
import {rm} from 'node:fs/promises'
import {chromium} from 'playwright'
test('Loading preserves static and lazy child rendering order during hydration',async()=>{
 const directory = resolve('.build','finding057-'+process.pid)
 await build(directory,(process.env.BUILD_MODE ?? 'development') as BuildMode,{client:['findings/057-loading-lazy-hydration-order/client.tsx','findings/057-loading-lazy-hydration-order/part.tsx'],server:['findings/057-loading-lazy-hydration-order/server.tsx']})
 const ssr = await import(directory+'/server.js') as typeof import('./server')
 const server = Bun.serve({hostname:'127.0.0.1',port:0,fetch(request){
  const url=new URL(request.url)
  if(url.pathname.endsWith('.js'))return new Response(Bun.file(directory+url.pathname),{headers:{'content-type':'text/javascript'}})
  return url.searchParams.has('hydrate') ? new Response(ssr.stream().readable,{headers:{'content-type':'text/html'}}) : new Response('<div id="root"></div><script type="module" src="/client.js"></script>',{headers:{'content-type':'text/html'}})
 }})
 try {
  const browser = await chromium.launch({channel:'chrome',headless:true})
  try {
   const results=[]
   for(const hydration of [false,true]) {
    const page = await browser.newPage(), messages:string[]=[]
    page.on('pageerror',error=>messages.push(error.message))
    page.on('console',message=>{if(['warning','error'].includes(message.type()))messages.push(message.text())})
    try {
     await page.goto(String(server.url)+(hydration?'?hydrate':''))
     await page.getByText('C',{exact:true}).waitFor()
     await page.waitForTimeout(50)
     results.push({hydration,order:await page.locator('#root span').allTextContents(),messages})
    } finally {await page.close()}
   }
   console.log(JSON.stringify(results))
   expect(results.map(result=>result.messages)).toEqual([[],[]])
   expect(results[0]!.order).toEqual(['A','B','C'])
   expect(results[1]!.order).toEqual(['A','B','C'])
  } finally {await browser.close()}
 } finally {server.stop(true);await rm(directory,{recursive:true,force:true})}
},30000)
