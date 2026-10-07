import { OBSERVE, Loading } from 'solid-js'
import { render, dynamic } from '@solidjs/web'
import { attribution } from 'solid-js/attribution'
import { installServerComponents } from '@solidjs/web/frames'
import { createServerReference, GET, configureServerFunctionsClient } from '@solidjs/web/server-functions/client'
import { Counter } from '../frames/counter'
import { requestCases } from './request-cases'
const records:{type:string;event:any;live:any}[]=[]
const handles:any[]=[]
const offs=['request','call','frame','recovery'].map(type=>OBSERVE?.records.subscribe(type as any,(event,live:any)=>{
 const index=handles.indexOf(live);if(index<0)handles.push(live)
 records.push({type,event,live:{identity:index<0?handles.length-1:index,request:!!live?.request,response:!!live?.response,args:live?.args,result:live?.result,error:live?.error?String(live.error):undefined,bodyUsed:live?.response?.bodyUsed}})
},{bodies:true}))
installServerComponents()
configureServerFunctionsClient({prepareRequest:(init)=>{const headers=new Headers(init.headers);headers.set('traceparent','00-11111111111111111111111111111111-2222222222222222-01');return {...init,headers}}})
const release=attribution.enable({log:false,checks:false})
const echo=createServerReference('records-echo'),failing=createServerReference('records-fail')
const Story=dynamic(()=>GET(createServerReference('wave3-story'))(1) as any)
let close=()=>{}
;(window as any).recordsHarness={async run(){
 const returned=OBSERVE?OBSERVE.attribution.withInteraction({type:'click',target:'button#records'},()=>echo('private-argument')):echo('private-argument')
 const response=await returned
 const failure=await failing().then(()=>'',error=>String(error))
 close=render(()=> <Loading fallback={<i>pending</i>}><Story counter={Counter}><small>footer</small></Story></Loading>,document.querySelector('#root')!)
 for(let i=0;i<100&&!document.querySelector('h1');i++)await new Promise(r=>setTimeout(r,5))
 return {response,failure,records,dom:document.querySelector('#root')!.textContent}
},close(){close();offs.forEach(off=>off?.());release()},requestCases}
