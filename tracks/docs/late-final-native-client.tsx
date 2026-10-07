import {performanceCases} from '../records/performance-client'
import {OBSERVE,createRoot,createSignal,createMemo,createEffect,createRenderEffect,Loading,flush} from 'solid-js'
import {enablePerformanceTracks} from '@solidjs/web/performance-tracks'
import {render} from '@solidjs/web'
import {deferred,ticks} from '../../harness/timing'
;(window as any).lateNative=async()=>{
 const base=await performanceCases();let clock=performance.now()+10
 const descriptor=Object.getOwnPropertyDescriptor(performance,'now');Object.defineProperty(performance,'now',{configurable:true,value:()=>clock})
 const stop=enablePerformanceTracks({rich:true,minMs:0,attribution:{holds:{infoMs:100000,warnMs:100000},longHolds:{infoMs:500,warnMs:100000},checks:false,log:false}})
 const rows:any[]=[];const offs=['rerun','create','effect','flush','flight','fallback','hold','navigation','interaction'].map(type=>OBSERVE?.records.subscribe(type as any,event=>rows.push({type,event})))
 const warn=console.warn;console.warn=()=>{}
 try{
  for(const [name,delay] of [['short',50],['long',600]] as const){let close!:()=>void,write!:(n:number)=>void;const a=deferred<number>(),b=deferred<number>()
   createRoot(d=>{close=d;const[r,w]=createSignal(0,{name:'native-'+name});write=w;const equalMemo=createMemo(()=>{const value=r();clock+=2;return value===0?0:1},{name:'equal-'+name});createEffect(equalMemo,()=>{clock+=3},{name:'paint-'+name});const data=createMemo(()=>r()===0?0:r()===1?a.promise:b.promise,{name:'remote-'+name});createRenderEffect(data,()=>{})})
   try{flush();OBSERVE?.attribution.withInteraction({type:'click',target:'button#'+name,at:clock-5},()=>OBSERVE?.attribution.withOrigin({kind:'navigation',name:'/native/'+name,to:'/native/'+name},()=>write(1)));flush();await ticks(4);clock+=10;write(2);flush();await ticks(4);clock+=delay;b.resolve(2);await ticks(8);flush();a.resolve(1);await ticks(4)}finally{a.resolve(1);b.resolve(2);close()}
  }
  const gate=deferred<number>(),target=document.createElement('div');function NativeFallback(){const data=createMemo(()=>gate.promise,{name:'fallback-data'});return <Loading fallback='pending'><b>{data()}</b></Loading>};const close=render(()=><NativeFallback/>,target)
  try{flush();await ticks(4);clock+=100;gate.resolve(1);await ticks(8);flush()}finally{gate.resolve(1);close()}
  const entries=performance.getEntriesByType('measure').map(e=>({name:e.name,start:e.startTime,duration:e.duration,detail:(e as PerformanceMeasure).detail})).filter(e=>e.detail?.devtools?.trackGroup==='Solid')
  return{base,entries,rows}
 }finally{offs.forEach(f=>f?.());stop();console.warn=warn;if(descriptor)Object.defineProperty(performance,'now',descriptor);else delete(performance as any).now}
}
