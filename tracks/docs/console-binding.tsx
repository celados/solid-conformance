import {createSignal,flush,OBSERVE} from 'solid-js'
import {render} from '@solidjs/web'
export function run(){
 const reports:any[]=[],events:any[]=[],original=console.warn
 console.warn=(...args)=>reports.push({message:String(args[0]),element:args[1] instanceof Element?args[1].getAttribute('data-binding'):undefined})
 const off=OBSERVE?.diagnostics.subscribe(event=>{if(event.code==='HUGE_FAN_IN')events.push(event)})
 let close=()=>{},activate!:(v:boolean)=>void
 try{function App(){const[warm,setWarm]=createSignal(false);activate=setWarm;const sources=Array.from({length:2000},()=>createSignal(0)[0]);const read=()=>warm()?sources.reduce((n,r)=>n+r(),0):0;return <><div data-binding="attribute" title={String(read())}/><div data-binding="class" class={String(read())}/><div data-binding="style" style={{opacity:read()}}/><div data-binding="classMap" class={read()===0?{active:true}:{active:false}}/><div data-binding="spread" {...{title:String(read())}}/><div data-binding="insert">{read()}</div></>};close=render(()=><App/>,document.querySelector('#root')!);activate(true);flush();return {reports,events}}finally{close();off?.();console.warn=original}
}
;(window as any).bindingConsole={run}
