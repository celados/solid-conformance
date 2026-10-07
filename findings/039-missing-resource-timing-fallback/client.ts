import {OBSERVE} from 'solid-js'
import {enablePerformanceTracks} from '@solidjs/web/performance-tracks'
import {createServerReference,configureServerFunctionsClient} from '@solidjs/web/server-functions/client'
;(window as any).serverPerformance={async cache(observer:boolean){
 const native=globalThis.PerformanceObserver
 if(!observer)(globalThis as any).PerformanceObserver=undefined
 const release=enablePerformanceTracks({rich:true,minMs:0}),calls:any[]=[],off=OBSERVE?.records.subscribe('call',e=>calls.push(e))
 configureServerFunctionsClient({fetch:()=>Response.json(17,{headers:{'X-Server-Function-Format':'8','Server-Timing':'solid-invocation;dur=4;desc="performance-cache"'}})})
 const result=await createServerReference('performance-cache')()
 return {result,calls,snapshot:()=>performance.getEntriesByType('measure').map(e=>({name:e.name,start:e.startTime,duration:e.duration,detail:(e as PerformanceMeasure).detail})).filter(e=>e.name==='performance-cache · server'),close(){off?.();release();configureServerFunctionsClient({fetch:null});globalThis.PerformanceObserver=native}}
}}
