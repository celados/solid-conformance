import { OBSERVE } from 'solid-js'
import { createRequestEvent, getTraceContext, createSSRResponse, renderToString, getRequestEvent } from '@solidjs/web'
import { provideRequestEvent } from '@solidjs/web/storage'
// RFC 08 L902/L923: global provider, once/request, merge, replacement, throwing isolation and browser wire.
export async function traceCases(){
 const cases:any[]=[]
 const slot=OBSERVE?.server.trace
 for(const scenario of ['merge','replacement','throw','absent','no-request']){
  let calls=0,previous=0;const errors:unknown[]=[];const original=console.error;console.error=(...args)=>errors.push(args)
  const old=slot?.provide(()=>{previous++;return {traceId:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}})
  const release=slot?.provide(request=>{calls++;if(scenario==='throw')throw new Error('trace fixture');if(scenario==='absent')return undefined;return {traceId:'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',spanId:'cccccccccccccccc',parentId:'dddddddddddddddd',sampled:true,entries:{vendor:'vendor-entry'}}})
  try{
   if(scenario==='no-request'){
    const html=renderToString(()=> <span>{getTraceContext()?.traceId}</span>);cases.push({scenario,calls,previous,errors:errors.length,html});continue
   }
   const event=createRequestEvent(new Request('http://trace.test/',{headers:{traceparent:'00-11111111111111111111111111111111-2222222222222222-01'}}))
   await provideRequestEvent(event,async()=>{
    const trace=getTraceContext()!,again=getTraceContext();const response=createSSRResponse(renderToString(()=> <span>trace</span>),getRequestEvent()!);cases.push({scenario,calls,previous,errors:errors.length,trace,same:trace===again,header:response.headers.get('server-timing'),html:await response.text()})
   })
  }finally{old?.();release?.();console.error=original}
 }
 return {cases,slotRegistered:!!slot&&OBSERVE?.server===(globalThis as any)[Symbol.for('solid-js/observe/server')],channelRegistered:!!OBSERVE&&OBSERVE.records===(globalThis as any)[Symbol.for('@solidjs/signals/observe/records')]}
}

import {createMemo,Loading} from 'solid-js'
import {renderToStream,commitEventResponse} from '@solidjs/web'
export async function traceWireCases(){
 const rows:any[]=[]
 for(const listener of [false,true])for(const deferred of [false,true]){
  const event=createRequestEvent(new Request('http://trace.test/',{headers:{traceparent:'00-11111111111111111111111111111111-2222222222222222-01',tracestate:'vendor=upstream',baggage:'private=upstream'}}))
  const seen:any[]=[];const offs=listener?['render','boundary'].map(type=>OBSERVE?.records.subscribe(type as any,e=>seen.push({type,event:e}))):[]
  try{await provideRequestEvent(event,async()=>{
   event.response.headers.set('Server-Timing','app;dur=1')
   function Métric(){const value=createMemo(()=>new Promise<string>(resolve=>setTimeout(()=>resolve('ready'),5)),{deferStream:deferred});return <b>{value()}</b>}
   const stream=renderToStream(()=> <html><head/><body><Loading fallback={<i>pending</i>}><Métric/></Loading></body></html>)
   const response=await createSSRResponse(stream,event),html=await response.text()
   rows.push({listener,deferred,html,header:response.headers.get('server-timing'),records:seen})
  })}finally{offs.forEach(off=>off?.())}
 }
 const event=createRequestEvent(new Request('http://trace.test/',{headers:{traceparent:'00-11111111111111111111111111111111-2222222222222222-01'}}))
 await provideRequestEvent(event,()=>{event.response.headers.set('Server-Timing','app;dur=1, traceparent;desc="application"');const response=commitEventResponse(new Response(null,{status:302,headers:{location:'/next'}}),event);rows.push({scenario:'redirect',header:response.headers.get('server-timing')})})
 return {outside:getTraceContext(),rows}
}
export function channel(){return OBSERVE?.records}
export function serverSlot(){return OBSERVE?.server}
