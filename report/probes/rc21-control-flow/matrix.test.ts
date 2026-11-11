import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {build} from './build'
test('control-flow accessor matrix',async()=>{
 await build({client:['app.tsx'],server:[]})
 const server=Bun.serve({hostname:'127.0.0.1',port:0,fetch(req){return new URL(req.url).pathname==='/app.js'?new Response(Bun.file('.build/app.js'),{headers:{'content-type':'text/javascript'}}):new Response('<div id="root"></div><script type="module" src="/app.js"></script>',{headers:{'content-type':'text/html'}})}})
 const browser=await chromium.launch({channel:'chrome',headless:true})
 const failures:any[]=[]; let count=0
 try {
  const page=await browser.newPage()
  for(const api of ['show','match','for','repeat']) for(const read of ['plain','spread','effect','memo','children','ref']) for(const write of ['plain','action','optimistic','transition']) for(const timing of ['sync','after-settle']) for(const nested of [false,true]) for(const boundary of ['none','loading','errored']) {
   const args=[api,read,write,timing,nested,boundary];const errors:string[]=[]
   const onerror=(e:Error)=>errors.push(e.message); const onconsole=(m:any)=>{if(m.type()==='error')errors.push(m.text())}
   page.on('pageerror',onerror);page.on('console',onconsole)
   try {await page.goto(String(server.url));await page.waitForFunction(()=>typeof (window as any).probe==='function');const result=await page.evaluate(args=>(window as any).probe(...args),args);if(errors.length || result.html.includes('error')) failures.push({args,errors,result})}catch(e){failures.push({args,errors,exception:String(e)})}finally{page.off('pageerror',onerror);page.off('console',onconsole)}
   count++
  }
  console.log(JSON.stringify({count,failures},null,2));expect(failures).toEqual([])
 }finally{await browser.close();server.stop(true)}
},300000)
