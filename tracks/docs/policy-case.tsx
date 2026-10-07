import { createMemo, createSignal, isPending, Loading, onCleanup, flush } from 'solid-js'
import { isServer } from '@solidjs/web'
import type { Spec } from '../../harness/tree'
import { controlledIterable, deferred, ticks } from '../../harness/timing'
import { equal, type DocResult } from './registry'

export function policyCase(spec:Spec){
 const kind=spec.scenario!.split(':')[1]!
 const iterable=kind==='hybrid-iterable'
 const policy=kind==='client'||kind==='declared-client'?'client':kind.startsWith('hybrid')?'hybrid':'server'
 const gates=[deferred<number>(),deferred<number>()]
 const streams=[controlledIterable<number>(),controlledIterable<number>()]
 const docs:(DocResult & {observations:Record<string,unknown>})[]=[]
 let write!:(v:number)=>void,read!:()=>number,requests=0,calls=0,cached:Promise<number>|undefined
 const fetchKinds=['tracking-fetch','tracking-await','cached-fake']
 const originalFetch=globalThis.fetch
 if(!isServer&&fetchKinds.includes(kind))globalThis.fetch=((input:RequestInfo|URL,init?:RequestInit)=>{
  if(String(input).includes('/doc-policy-source')){requests++;return Promise.resolve(new Response('7'))}
  return originalFetch(input,init)
 }) as typeof fetch
 function App(){
  onCleanup(()=>{if(!isServer&&fetchKinds.includes(kind))globalThis.fetch=originalFetch})
  if(!isServer&&kind==='transparent')createMemo(()=>42,{transparent:true})
  const [argument,setArgument]=createSignal(0);write=setArgument
  read=createMemo(()=>{
   const id=argument();calls++
   if(isServer)return iterable?streams[id]!.iterable:gates[id]!.promise
   if(kind==='tracking-fetch')return fetch('/doc-policy-source').then(response=>response.json()) as Promise<number>
   if(kind==='tracking-await')return(async()=>{await 0;return(await fetch('/doc-policy-source')).json() as Promise<number>})()
   if(kind==='cached-fake')return cached??=(fetch('/doc-policy-source').then(response=>response.json()) as Promise<number>)
   return iterable?streams[id]!.iterable:gates[id]!.promise
  },{ssrSource:policy,...(kind==='declared-client'?{loadingValue:3}: {})})
  return<Loading fallback={<b>fallback</b>}><span>{read()}</span></Loading>
 }
 const content=()=>document.getElementById('root')!.textContent
 const statements:Record<string,string>={server:'The client adopts the serialized initial server value and recomputes on a dependency change.', 'hybrid-promise':'For promise computes hybrid is identical to server.', 'hybrid-iterable':'The server consumes one yield; hybrid continues the client iterable and discards its duplicate first yield.', client:'The client source never computes on the server and mounts fresh after hydration.', 'declared-client':'A declared client loadingValue renders the same first paint during SSR and hydration.', transparent:'A transparent client-only memo consumes no hydration ID slot.', 'tracking-fetch':'The fake fetch sends nothing during the tracking run.', 'tracking-await':'A non-fake await before fetch resumes after the tracking window and sends a duplicate.', 'cached-fake':'A fake fetch promise cached during the tracking run never settles for later readers.'}
 const record=(name:string)=>docs.push({id:'05/policy-'+name,file:'05-async-data.md',statement:statements[name]!,observations:{kind,calls,requests,policy,dom:isServer?null:content()}})
 return{App,streams:iterable?streams:[],docs,async settle(){
  if(isServer){equal(calls,policy==='client'?0:1);if(policy!=='client'){if(iterable)streams[0]!.push(7);else gates[0]!.resolve(7);await ticks(8)}return}
  const hydrating=window.mode==='hydrate'
  if(fetchKinds.includes(kind)){
   await ticks(8);equal(content(),'7');equal(requests,hydrating?(kind==='tracking-await'?1:0):1)
   if(kind==='cached-fake'&&hydrating){write(1);flush();await ticks(8);equal(requests,0);equal(content(),'7');equal(isPending(read),true)}
   record(kind);return
  }
  if(hydrating&&policy!=='client')equal(content(),'7')
  else if(kind==='declared-client')equal(content(),'3')
  else equal(content(),'fallback')
  if(iterable)streams[0]!.push(7);else gates[0]!.resolve(7)
  await ticks(8);equal(content(),'7')
  if(iterable){streams[0]!.push(8);await ticks(8);equal(content(),'8')}
  else if(policy==='server'||policy==='hybrid'){
   // Resolving the client trace's first promise must not replace an adopted value.
   if(hydrating)equal(content(),'7')
   write(1);flush();gates[1]!.resolve(8);await ticks(8);equal(content(),'8')
  }
  record(kind)
 }}
}
