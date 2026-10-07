import { OBSERVE } from 'solid-js'
import { attribution } from 'solid-js/attribution'
import { createServerReference, configureServerFunctionsClient, withMeta } from '@solidjs/web/server-functions/client'
// RFC 08 L855/L869: public request/call records, controlled fetch rather than private emitter calls.
export async function requestCases(){
 const rows:any[]=[]
 for(const scenario of ['bodies','no-bodies','fetch-throw','prepare-throw','serialize-throw','request-only','listener-unsubscribe','listener-throw','handler-claimed','uncloneable','reconstruction-failed','after-await','late-listener','duplicate-listener','pending-row','origin','origin-async-prepare','body-string','body-search','body-form','body-blob','body-buffer','body-view','body-stream','body-iterable']){
  const seen:any[]=[],handles:any[]=[],errors:unknown[]=[];let sends=0,resolve!: (r:Response)=>void
  const release=attribution.enable({log:false,checks:false,holds:false});let origin:unknown,iterated=0
  const stream=new ReadableStream({start(controller){controller.enqueue(new Uint8Array([1]));controller.close()}})
  const body=scenario==='body-string'?'fixture':scenario==='body-search'?new URLSearchParams('a=b'):scenario==='body-form'?Object.assign(new FormData(),{}):scenario==='body-blob'?new Blob(['fixture']):scenario==='body-buffer'?new Uint8Array([65,66]).buffer:scenario==='body-view'?new Uint8Array([65,66]):scenario==='body-stream'?stream:scenario==='body-iterable'?{async *[Symbol.asyncIterator](){iterated++;yield new Uint8Array([1])}}:undefined
  if(body instanceof FormData)body.set('a','b')
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
   prepareRequest:async(init):Promise<RequestInit>=>{if(scenario==='prepare-throw')throw new Error('prepare fixture');if(scenario==='reconstruction-failed')return {...init,headers:{'invalid header':'tolerated by fake fetch'}};if(scenario==='origin-async-prepare')await Promise.resolve();return {...init,...(body?{body:body as BodyInit}:{}),headers:{...Object.fromEntries(new Headers(init.headers)),'x-records':'final'}}},
   responseHandler:scenario==='handler-claimed'?{handle:()=>9}:null as any,
   serializeArgs:scenario==='serialize-throw'?()=>{throw new Error('serialize fixture')}:undefined,
  })
  let result:unknown,error=''
  try{
   const fn=createServerReference('request-fixture')
   const invoke=()=>fn(...(scenario==='serialize-throw'?[new Map()]:[3]))
   const active=()=>{origin=OBSERVE?.attribution.currentOrigin();return invoke()}
   const pending=OBSERVE?OBSERVE.attribution.withInteraction({type:'click',target:'button#request'},()=>scenario==='after-await'?Promise.resolve().then(invoke):active()):invoke()
   if(scenario==='late-listener')offCall=OBSERVE?.records.subscribe('call',observer('call'))
   let pendingSnapshot:unknown
   if(scenario==='pending-row'){for(let i=0;i<20&&!resolve;i++)await Promise.resolve();pendingSnapshot=seen.map(r=>({type:r.type,response:r.atSend.response}));resolve(Response.json(7,{headers:{"X-Server-Function-Format":"8"}}))}
   try{result=await pending}catch(e){error=String(e)}
   const output=[]
   for(const r of seen){let requestBody:string|undefined,responseBody:string|undefined;try{requestBody=await r.live.request?.clone().text()}catch{}try{if(!r.live.response?.bodyUsed)responseBody=await r.live.response?.clone().text()}catch{}output.push({type:r.type,event:r.event,identity:r.identity,originIdentity:r.event.origin===origin,atSend:r.atSend,request:!!r.live.request,response:!!r.live.response,result:r.live.result,error:r.live.error?String(r.live.error):undefined,bodyUsed:r.live.response?.bodyUsed,header:r.live.request?.headers.get('x-records'),requestBody,responseBody})}
   rows.push({scenario,result,error,sends,errors:errors.length,records:output,pendingSnapshot,iterated,streamLocked:stream.locked})
  }finally{offRequest?.();offCall?.();extra?.();duplicate?.();release();console.error=originalError;configureServerFunctionsClient({fetch:null,prepareRequest:null as any,responseHandler:null as any,serializeArgs:null as any})}
 }
 return rows
}

// RFC08 L853/L855/L869: gates open at dispatch, delivery occurs at send/settle;
// request observers run synchronously and CallLive is the same mutable object.
export async function requestGateCases(){
 const rows:any[]=[]
 for(const scenario of ['intercept','late-request','late-call','mixed-bodies','shared-request','slow-listener','clock-off','explicit-name','anonymous']){
  let send=0,clocks=0,now=10,prepare!:()=>void,finish!:(response:Response)=>void
  const seen:any[]=[],handles:any[]=[],offs:(()=>void)[]=[]
  const descriptor=Object.getOwnPropertyDescriptor(performance,'now')
  Object.defineProperty(performance,'now',{configurable:true,value:()=>{clocks++;return now}})
  const observe=(type:string)=>(event:any,live:any)=>{seen.push({type,event,live});handles.push(live);if(scenario==='slow-listener'&&type==='request')now+=25;if(scenario==='shared-request'&&type==='request')live.fixture='from request'}
  const on=(type:'call'|'request',bodies=false)=>{const off=OBSERVE?.records.subscribe(type,observe(type),{bodies});if(off)offs.push(off)}
  if(scenario!=='intercept'&&scenario!=='clock-off'){
   if(scenario==='late-request')on('request')
   else if(scenario==='late-call')on('call')
   else{on('request',scenario==='mixed-bodies'||scenario==='shared-request');on('call',false)}
  }
  let sentAt=-1
  configureServerFunctionsClient({fetch:()=>{send++;sentAt=now;return new Promise(resolve=>finish=resolve)},prepareRequest:()=>new Promise(resolve=>prepare=()=>resolve({method:'POST',body:'body-fixture'})),responseHandler:scenario==='intercept'?{intercept:()=>({value:11})} as any:null as any})
  try{
   const fn=createServerReference('gate-fixture',scenario==='explicit-name'?'stable label':undefined)
   const pending=fn(3)
   if(scenario==='intercept'){rows.push({scenario,result:await pending,send,clocks,records:seen});continue}
   for(let i=0;i<20&&!prepare;i++)await Promise.resolve()
   if(scenario==='late-request'){offs.forEach(off=>off());on('request');on('call')}
   prepare();for(let i=0;i<20&&!finish;i++)await Promise.resolve()
   if(scenario==='late-call'){offs.forEach(off=>off());on('call')}
   now+=5;finish(Response.json(7,{headers:{'X-Server-Function-Format':'8'}}));const result=await pending
   let sharedBody:string|undefined,afterDirectUsed:boolean|undefined
   const request=seen.find(r=>r.type==='request')?.live.request
   if(scenario==='shared-request'&&request){sharedBody=await request.text();afterDirectUsed=seen.find(r=>r.type==='call')?.live.request.bodyUsed}
   rows.push({scenario,result,send,clocks,sentAt,sharedBody,afterDirectUsed,identity:handles.every(h=>h===handles[0]),records:seen.map(r=>({type:r.type,event:r.event,request:!!r.live.request,response:!!r.live.response,bodyUsed:r.live.response?.bodyUsed,fixture:r.live.fixture}))})
  }finally{offs.forEach(off=>off());configureServerFunctionsClient({fetch:null,prepareRequest:null as any,responseHandler:null as any});if(descriptor)Object.defineProperty(performance,'now',descriptor);else delete (performance as any).now}
 }
 return rows
}
