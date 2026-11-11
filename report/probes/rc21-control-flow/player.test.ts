import {test,expect} from 'bun:test'
import {chromium} from 'playwright'
import {build} from './build'
test('player condition withdrawal while work is pending',async()=>{
 await build({client:['player.tsx'],server:[]})
 const server=Bun.serve({hostname:'127.0.0.1',port:0,fetch(req){return new URL(req.url).pathname==='/player.js'?new Response(Bun.file('.build/player.js'),{headers:{'content-type':'text/javascript'}}):new Response('<div id="root"></div><script type="module" src="/player.js"></script>',{headers:{'content-type':'text/html'}})}})
 const browser=await chromium.launch({channel:'chrome',headless:true});const failures:any[]=[];let count=0
 try{const page=await browser.newPage()
 for(const nested of [false,true])for(const spread of [false,true])for(const waitingChanges of [false,true])for(const mode of ['plain','write-action','pending-action','pending-async'])for(const after of [false,true]){
  const args=[nested,spread,waitingChanges,mode,after],errors:string[]=[]
  const err=(e:Error)=>errors.push(e.message);const con=(m:any)=>{if(m.type()==='error')errors.push(m.text())};page.on('pageerror',err);page.on('console',con)
  try{await page.goto(String(server.url));await page.waitForFunction(()=>typeof (window as any).playerProbe==='function');const html=await page.evaluate(args=>(window as any).playerProbe(...args),args);if(errors.length||html.includes('<img'))failures.push({args,errors,html})}catch(e){failures.push({args,errors,exception:String(e)})}finally{page.off('pageerror',err);page.off('console',con)};count++
 }
 console.log(JSON.stringify({count,failures},null,2));expect(failures).toEqual([])
 }finally{await browser.close();server.stop(true)}
},60000)
