import { OBSERVE } from 'solid-js'
import { createServerReference, configureServerFunctionsClient } from '@solidjs/web/server-functions/client'
// RFC 08 L855/L869: public request/call records, controlled fetch rather than private emitter calls.
export async function requestCases(){
 const rows:any[]=[]
 for(const scenario of ['bodies','no-bodies','fetch-throw','prepare-throw','serialize-throw','request-only','listener-unsubscribe','listener-throw','handler-claimed','uncloneable','reconstruction-failed','after-await','late-listener','duplicate-listener','pending-row']){
  const seen:any[]=[],handles:any[]=[],errors:unknown[]=[];let sends=0,resolve!: (r:Response)=>void
  const originalError=console.error;console.error=(...args)=>errors.push(args)
  const observer=(type:string)=>(event:any,live:any)=>{let identity=handles.indexOf(live);if(identity<0){identity=handles.length;handles.push(live)}seen.push({type,event,live,identity,atSend:{request:!!live.request,response:!!live.response,result:live.result}})}
  const offRequest=OBSERVE?.records.subscribe('request',observer('request'),{bodies:scenario!=='no-bodies'})
  let offCall:undefined|(()=>void)
  if(scenario!=='request-only'&&scenario!=='late-listener')offCall=OBSERVE?.records.subscribe('call',observer('call'),{bodies:scenario!=='no-bodies'})
  let extra:undefined|(()=>void),duplicate:undefined|(()=>void)
  if(scenario==='listener-throw')extra=OBSERVE?.records.subscribe('request',()=>{throw new Error('listener fixture')})
  if(scenario==='duplicate-listener'){const callback=observer('duplicate');extra=OBSERVE?.records.subscribe('call',callback);duplicate=OBSERVE?.records.subscribe('call',callback,{bodies:true})}
  configureServerFunctionsClient({
   fetch:(_address,init)=>{sends++;if(scenario==='fetch-throw')throw new Error('fetch fixture');if(scenario==='listener-unsubscribe')offRequest?.();if(scenario==='pending-row')return new Promise(r=>resolve=r);const response=Response.json(7,{headers:{"X-Server-Function-Format":"8"}});if(scenario==='uncloneable')response.clone=()=>{throw new Error('clone fixture')};return response},
   prepareRequest:(init):RequestInit=>{if(scenario==='prepare-throw')throw new Error('prepare fixture');if(scenario==='reconstruction-failed')return {...init,headers:{'invalid header':'tolerated by fake fetch'}};return {...init,headers:{...Object.fromEntries(new Headers(init.headers)),'x-records':'final'}}},
   responseHandler:scenario==='handler-claimed'?{handle:()=>9}:null as any,
   serializeArgs:scenario==='serialize-throw'?()=>{throw new Error('serialize fixture')}:undefined,
  })
  let result:unknown,error=''
  try{
   if(scenario==='after-await')await Promise.resolve()
   const fn=createServerReference('request-fixture')
   const pending=fn(...(scenario==='serialize-throw'?[new Map()]:[3]))
   if(scenario==='late-listener')offCall=OBSERVE?.records.subscribe('call',observer('call'))
   let pendingSnapshot:unknown
   if(scenario==='pending-row'){for(let i=0;i<20&&!resolve;i++)await Promise.resolve();pendingSnapshot=seen.map(r=>({type:r.type,response:r.atSend.response}));resolve(Response.json(7,{headers:{"X-Server-Function-Format":"8"}}))}
   try{result=await pending}catch(e){error=String(e)}
   const output=[]
   for(const r of seen){let requestBody:string|undefined,responseBody:string|undefined;try{requestBody=await r.live.request?.clone().text()}catch{}try{if(!r.live.response?.bodyUsed)responseBody=await r.live.response?.clone().text()}catch{}output.push({type:r.type,event:r.event,identity:r.identity,atSend:r.atSend,request:!!r.live.request,response:!!r.live.response,result:r.live.result,error:r.live.error?String(r.live.error):undefined,bodyUsed:r.live.response?.bodyUsed,header:r.live.request?.headers.get('x-records'),requestBody,responseBody})}
   rows.push({scenario,result,error,sends,errors:errors.length,records:output,pendingSnapshot})
  }finally{offRequest?.();offCall?.();extra?.();duplicate?.();console.error=originalError;configureServerFunctionsClient({fetch:null,prepareRequest:null as any,responseHandler:null as any,serializeArgs:null as any})}
 }
 return rows
}
