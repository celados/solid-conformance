import {createRoot,createSignal,createMemo,createRenderEffect,createEffect,isPending,latest,flush,OBSERVE} from 'solid-js'
import {attribution,feedback} from 'solid-js/attribution'
import {isDev,isServer} from '@solidjs/web'
import {deferred,ticks} from '../../harness/timing'
import {observed} from './diagnostic-cases'
import {equal,ok,type DocCase} from './registry'
const cases:DocCase[]=[]
async function hold(wait:number,ack:'none'|'pending'|'latest'|'memo-only'='none',long=true){
 const descriptor=Object.getOwnPropertyDescriptor(performance,'now'),native=performance.now.bind(performance);let clock=native()
 Object.defineProperty(performance,'now',{configurable:true,value:()=>clock})
 const release=attribution.enable({log:false,checks:false,graphGrowth:false,...(long?{}:{longHolds:false}),waterfalls:false,stackedHolds:false,abandonedFlights:false,fallbackFlashes:false,optimisticReverts:false})
 let dispose!:()=>void;const gate=deferred<number>(),records:any[]=[]
 const off=OBSERVE!.records.subscribe('hold',e=>records.push(e))
 try{
  const result=await observed(async()=>{
   const [write]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0,{name:'page'});const data=createMemo(()=>r()?gate.promise:0,{name:'posts'});createRenderEffect(data,()=>{});if(ack==='pending'){const companion=createMemo(()=>isPending(data));createEffect(companion,()=>{},{name:'spinner'})}if(ack==='latest')createEffect(()=>latest(data),()=>{},{name:'preview'});if(ack==='memo-only')createMemo(()=>isPending(data));flush();return[w] as const})
   OBSERVE!.attribution.withInteraction({type:'click',target:'button#next'},()=>OBSERVE!.attribution.withOrigin({kind:'navigation',name:'/posts/:id',to:'/posts/1',params:{id:'1'}},()=>write(1)))
   flush();await ticks(4);clock+=wait;gate.resolve(2);await ticks(8);flush()
  })
  return {events:result.events,record:records.at(-1),rows:feedback().sources}
 }finally{dispose();off();release();if(descriptor)Object.defineProperty(performance,'now',descriptor);else delete (performance as any).now}
}
function doc(id:string,statement:string,run:DocCase['run']){cases.push({id:'08/'+id,file:'08-dev-diagnostics.md',statement,run})}
if(!isServer){
 doc('hold-default-thresholds','L525/L531: silent default 100ms info/200ms warn, acknowledged long 500ms info/1000ms warn; a silent long hold reports only SILENT_HOLD.',async()=>{
  if(!isDev)return
  for(const [duration,ack,code,severity] of [[99,'none',null,null],[100,'none','SILENT_HOLD','info'],[199,'none','SILENT_HOLD','info'],[200,'none','SILENT_HOLD','warn'],[499,'pending',null,null],[500,'pending','LONG_HOLD','info'],[1000,'pending','LONG_HOLD','warn'],[1000,'none','SILENT_HOLD','warn']] as const){const result=await hold(duration,ack);const events=result.events.filter(e=>['SILENT_HOLD','LONG_HOLD'].includes(e.code));equal({duration,ack,codes:events.map(e=>e.code)}, {duration,ack,codes:code?[code]:[]});if(code){equal(events[0]!.code,code);equal(events[0]!.kind,'responsiveness');equal(events[0]!.severity,severity)}equal(result.record.silent,ack==='none');equal(result.record.long,duration>=500);equal(result.record.holdMs,duration);equal(result.record.tailMs,duration);if(duration===1000&&ack==='none')equal((events[0]!.data as any).long,true)}
 })
 doc('hold-acknowledgement-paths','L525/L527: a companion counts through memo chains only when an effect reads it; hold records retain reader path, origins, blockers and write previews.',async()=>{
  if(!isDev)return
  for(const ack of ['none','memo-only','pending','latest'] as const){const result=await hold(250,ack),r=result.record;equal(r.silent,ack==='none'||ack==='memo-only');equal(r.origin.kind,'navigation');equal(r.origin.name,'/posts/:id');equal(r.interaction.kind,'interaction');equal(r.interaction.target,'button#next');ok(r.blockers.length>0,JSON.stringify(r));ok(r.heldWrites.length>0,JSON.stringify(r));if(ack==='pending'||ack==='latest'){ok(r.acknowledgements.some((a:any)=>a.kind===(ack==='pending'?'isPending':'latest')&&a.source==='posts'),JSON.stringify(r.acknowledgements));ok(r.acknowledgements.some((a:any)=>a.reader?.some((p:string)=>p=== (ack==='pending'?'spinner':'preview'))));ok(result.rows.some((row:any)=>row.acknowledgedBy.some((a:any)=>String(a.by).includes(ack==='pending'?'isPending':'latest'))))}}
 })
}
export const holdDiagnosticCases=cases
