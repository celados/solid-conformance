import {OBSERVE,createRoot,createSignal,createMemo,flush,action} from 'solid-js'
import {attribution} from 'solid-js/attribution'
const host=window as any
host.interactionProtocol={start(kind:string){
 const events:any[]=[],records:any[]=[],live:any[]=[];const release=attribution.enable({log:false,checks:false,graphGrowth:false});const warn=console.warn;console.warn=()=>{}
 const offs=[OBSERVE?.diagnostics.subscribe((e,s)=>{events.push(e);live.push(!!s)}),OBSERVE?.records.subscribe('interaction',e=>records.push(e))]
 let resolve!:()=>void,reject!:(e:unknown)=>void,dispose!:()=>void;const pending=new Promise<void>((a,b)=>{resolve=a;reject=b})
 const[write,run]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0);createMemo(r);const mutate=action(async function*(){await pending;yield});return[w,mutate] as const})
 const returned=OBSERVE?OBSERVE.attribution.withInteraction({type:'click',target:'button#save'},()=>{if(kind==='write')write(1);if(kind==='action')return run();return pending}):pending
 Promise.resolve(returned).catch(()=>{});flush()
 host.active={snapshot:()=>({events,records,live}),resolve:()=>{resolve();flush()},reject:()=>{reject(new Error('expected fixture'));flush()},close:()=>{resolve();dispose();offs.forEach(off=>off?.());release();console.warn=warn}}
}}
