import { createSignal, createMemo, createEffect, createRenderEffect, Show, Loading, flush, OBSERVE, getOwner, DEV } from 'solid-js'
import { render } from '@solidjs/web'
import { enablePerformanceTracks } from '@solidjs/web/performance-tracks'
import { attribution } from 'solid-js/attribution'
export async function performanceCases(){
 performance.clearMeasures();const tasks:string[]=[];const originalTask=(console as any).createTask
 ;(console as any).createTask=(name:string)=>{tasks.push(name);return typeof originalTask==='function'?originalTask.call(console,name):{run:(fn:()=>unknown)=>fn()}}
 function Unobserved(){const[r]=createSignal(0);return <em>{r()}</em>}
 const beforeEngine=render(()=> <Unobserved/>,document.createElement('div'));beforeEngine();const tasksWithoutEngine=tasks.length
 const release=enablePerformanceTracks({rich:true,minMs:0});const extra=enablePerformanceTracks({rich:false,minMs:999999})
 let set!:(n:number)=>void,resolve!:(n:number)=>void;const pending=new Promise<number>(r=>resolve=r)
 function Card(){const[r,w]=createSignal(0,{name:'count'});set=w;const m=createMemo(()=>r()*2,{name:'double'});const composed=createMemo(()=>r()+1,{name:'createDebounced.value'});createEffect(composed,()=>{});createEffect(m,()=>{},{name:'paint'});const data=createMemo(()=>r()===0?0:pending,{name:'remote'});createRenderEffect(data,()=>{});return <section><span>{m()}</span><Show when={r()>=0}><small>{composed()}</small></Show><Loading fallback={<i>pending</i>}><b>{data()}</b></Loading></section>}
 function Outer(){return <Card/>}
 const close=render(()=> <Outer/>,document.querySelector('#root')!)
 try{
  flush();OBSERVE?.attribution.withInteraction({type:'click',target:'button#next "Control Secret"',at:performance.now()-1},()=>OBSERVE?.attribution.withOrigin({kind:'navigation',name:'/items/:id',to:'/items/2'},()=>set(1)))
  flush();resolve(7);for(let i=0;i<20;i++)await new Promise(r=>setTimeout(r,1));flush()
  OBSERVE?.diagnostics.emit({code:'NO_OWNER_CLEANUP',kind:'lifecycle',severity:'warn',message:'[NO_OWNER_CLEANUP] marker fixture'},null)
  const entries=[...performance.getEntriesByType('measure'),...performance.getEntriesByType('mark')].map(e=>({name:e.name,start:e.startTime,duration:e.duration,detail:(e as PerformanceMeasure).detail})).filter(e=>e.detail?.devtools?.trackGroup==='Solid'||e.detail?.devtools?.dataType==='marker')
  release();const before=performance.getEntriesByType('measure').length;set(2);flush();for(let i=0;i<8;i++)await new Promise(r=>setTimeout(r,1));flush();const after=performance.getEntriesByType('measure').length
  extra();const cleared=performance.getEntriesByType('measure').length
  const native=performance.measure.bind(performance),warn=console.warn;let warnings=0
  Object.defineProperty(performance,'measure',{configurable:true,value:()=>{throw new Error('host fixture')}});console.warn=()=>{warnings++}
  const failing=enablePerformanceTracks({rich:true,minMs:0})
  try{set(3);flush();set(4);flush();for(let i=0;i<8;i++)await new Promise(r=>setTimeout(r,1));flush()}finally{failing();Object.defineProperty(performance,'measure',{configurable:true,value:native});console.warn=warn}
  const privacy:any[]=[]
  for(const level of ['labels','none'] as const){const stop=enablePerformanceTracks({rich:true,minMs:0,attribution:{values:level}});try{for(const [n,target] of [[5,'button#save "Control Label"'],[6,'div#cell "Private Cell"']] as const){OBSERVE?.attribution.withInteraction({type:'click',target},()=>set(n));flush();for(let i=0;i<8;i++)await new Promise(r=>setTimeout(r,1));flush()};privacy.push({level,text:JSON.stringify([...performance.getEntriesByType('measure'),...performance.getEntriesByType('mark')].map(e=>(e as PerformanceMeasure).detail))})}finally{stop()}}
  set(4);flush();for(let i=0;i<8;i++)await new Promise(r=>setTimeout(r,1));flush()
  return {guide:DEV?.guideUrl('NO_OWNER_CLEANUP'),entries,tasks,privacy,tasksWithoutEngine,before,after,cleared,warnings,value:document.querySelector('span')?.textContent,serverSlotKeys:OBSERVE?Object.keys(OBSERVE.server):[]}
 }finally{close();release();extra();(console as any).createTask=originalTask}
}
;(window as any).performanceHarness={run:performanceCases}
