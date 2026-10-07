import {createMemo,Loading} from 'solid-js'
import {hydrate} from '@solidjs/web'
import {createServerReference,configureServerFunctionsClient} from '@solidjs/web/server-functions/client'
import {enableRichArguments} from '@solidjs/web/server-functions/rich-args'
const mode=(window as unknown as {rpcMode:string}).rpcMode,arg=mode==='rich'?new Date(0):'arg',landings:number[]=[]
configureServerFunctionsClient({fetch:(url,init)=>fetch(url,init),...(mode==='prepare'?{prepareRequest:(init:RequestInit)=>init}:{})})
if(mode==='rich')enableRichArguments()
const fn=createServerReference('tracking-read') as (arg:unknown)=>Promise<number>
function App(){const read=createMemo(()=>fn(arg).then(value=>{landings.push(value);return value}));return<Loading fallback={<b>waiting</b>}><span>{read()}</span></Loading>}
hydrate(App,document.getElementById('root')!,{renderId:'app'})
Object.assign(window,{rpcTracking:{landings,control:()=>fn(arg),content:()=>document.querySelector('#root span')?.textContent}})
