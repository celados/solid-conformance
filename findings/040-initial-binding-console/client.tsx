import {createSignal,flush,OBSERVE} from 'solid-js'
import {attribution} from 'solid-js/attribution'
import {render} from '@solidjs/web'
export function run(initial:boolean){
 const release=attribution.enable({log:false,wideDeps:2,holds:false}),reports:any[]=[],events:any[]=[],warn=console.warn
 console.warn=(...args)=>{if(String(args[0]).includes('[WIDE_SCOPE_DEPS]'))reports.push({message:String(args[0]),element:args[1] instanceof Element})}
 const off=OBSERVE?.diagnostics.subscribe(e=>{if(e.code==='WIDE_SCOPE_DEPS')events.push(e)})
 let close=()=>{},set!:(value:boolean)=>void
 try{function App(){const[ready,write]=createSignal(initial);set=write;const[a]=createSignal(1);return <div title={String(ready()?a():0)}/>};close=render(()=><App/>,document.querySelector('#root')!);if(!initial){set(true);flush()};return {reports,events}}finally{close();off?.();release();console.warn=warn}
}
;(window as any).bindingRepro={run}
