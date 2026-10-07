import {OBSERVE,DEV,createRoot,createSignal,createMemo,flush,onCleanup} from 'solid-js'
import {attribution} from 'solid-js/attribution'
export function run(){
 const lines:any[]=[],events:any[]=[],methods=['warn','error','info','log','groupCollapsed','groupEnd'] as const
 const original=methods.map(method=>console[method]);methods.forEach(method=>(console as any)[method]=(...args:any[])=>lines.push({method,args:args.map(arg=>typeof arg==='string'?arg:String(arg))}))
 const off=OBSERVE?.diagnostics.subscribe(event=>events.push(event))
 try{
  onCleanup(()=>{});onCleanup(()=>{})
  OBSERVE?.diagnostics.emit({code:'NO_OWNER_EFFECT',kind:'lifecycle',severity:'info',message:'advisory-only'})
  let dispose!:()=>void;const release=attribution.enable({checks:false,holds:false,log:true})
  try{const write=createRoot(d=>{dispose=d;const[r,w]=createSignal(0,{name:'console-count'});createMemo(()=>r()*2,{name:'console-double'});return w});write(1);flush()}finally{dispose();release()}
  return {lines,events,guide:DEV?.guideUrl('NO_OWNER_CLEANUP')}
 }finally{off?.();methods.forEach((method,i)=>(console as any)[method]=original[i])}
}
