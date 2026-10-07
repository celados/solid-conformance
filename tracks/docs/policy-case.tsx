import {dynamicTrackingCase} from '../../findings/041-dynamic-source-tracking/component'
import { createMemo, createSignal, isPending, Loading, onCleanup, flush } from 'solid-js'
import { isServer, clientOnly, dynamic } from '@solidjs/web'
import type { Spec } from '../../harness/tree'
import { controlledIterable, deferred, ticks } from '../../harness/timing'
import { equal, type DocResult } from './registry'

export function policyCase(spec:Spec){
 const kind=spec.scenario!.split(':')[1]!
 if(kind==='dynamic-count-only')return dynamicTrackingCase()
 if(kind.startsWith('client-only'))return clientOnlyPolicy(kind)
 if(kind.startsWith('dynamic-native'))return dynamicNativePolicy(kind)
 const iterable=kind==='hybrid-iterable'
 const policy=kind==='client'||kind==='declared-client'?'client':kind.startsWith('hybrid')?'hybrid':'server'
 const gates=[deferred<number>(),deferred<number>()]
 const streams=[controlledIterable<number>(),controlledIterable<number>()]
 const iterables=streams.map(stream=>({[Symbol.asyncIterator]:()=>stream.iterable[Symbol.asyncIterator]()}))
 const docs:(DocResult & {observations:Record<string,unknown>})[]=[]
 let write!:(v:number)=>void,read!:()=>number,requests=0,calls=0,cached:Promise<number>|undefined
 const fetchKinds=['tracking-fetch','tracking-await','cached-fake']
 const originalFetch=globalThis.fetch
 if(!isServer&&fetchKinds.includes(kind))globalThis.fetch=((input:RequestInfo|URL,init?:RequestInit)=>{
  if(String(input).includes('/doc-policy-source')){requests++;return Promise.resolve(new Response(window.mode==='hydrate'?'99':'7'))}
  return originalFetch(input,init)
 }) as typeof fetch
 function App(){
  onCleanup(()=>{if(!isServer&&fetchKinds.includes(kind))globalThis.fetch=originalFetch})
  if(!isServer&&kind==='transparent')createMemo(()=>42,{transparent:true})
  const [argument,setArgument]=createSignal(0);write=setArgument
  read=createMemo(()=>{
   const id=argument();calls++
   if(isServer)return iterable?iterables[id]!:gates[id]!.promise
   if(kind==='tracking-fetch')return fetch('/doc-policy-source').then(response=>response.json()) as Promise<number>
   if(kind==='tracking-await')return(async()=>{await 0;return(await fetch('/doc-policy-source')).json() as Promise<number>})()
   if(kind==='cached-fake')return cached??=(fetch('/doc-policy-source').then(response=>response.json()) as Promise<number>)
   return iterable?iterables[id]!:gates[id]!.promise
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
  if(iterable)streams[0]!.push(hydrating?99:7);else gates[0]!.resolve(hydrating&&policy!=='client'?99:7)
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

function clientOnlyPolicy(kind:string){
 const gate=deferred<{default:()=>any}>();let imports=0;const claims:boolean[]=[]
 const original=!isServer&&window.mode==='hydrate'?document.querySelector('#root [data-fallback]'):undefined
 const Only=clientOnly(()=>{imports++;return gate.promise},{lazy:kind==='client-only-lazy'})
 const docs:DocResult[]=[]
 function App(){return<><Only fallback={<b data-fallback ref={(node:Element)=>{claims.push(!original||node===original)}}>fallback</b>}/><i>stable sibling</i></>}
 return{App,streams:[],docs,async settle(){if(isServer){equal(imports,0);return}equal(imports,1);equal(document.querySelectorAll('#root [data-fallback]').length,1);if(original)equal(claims[0],true);gate.resolve({default:()=><span>loaded</span>});await ticks(8);equal(document.getElementById('root')!.textContent,'loadedstable sibling');equal(document.querySelectorAll('#root [data-fallback]').length,0);equal(document.querySelectorAll('#root i').length,1);docs.push({id:'03/client-only-hydration-'+kind,file:'03-control-flow.md',statement:'The clientOnly hydration gate claims the server fallback DOM without duplication and swaps only after load, without Loading.'})}}
}

function dynamicNativePolicy(kind:string){
 const sync=kind.endsWith('sync');const gates=[deferred<'article'|'section'>(),deferred<'article'|'section'>()];let write!:(n:number)=>void,calls=0;const claims:boolean[]=[]
 const original=!isServer&&window.mode==='hydrate'?document.querySelector('#root article'):undefined
 const docs:(DocResult&{observations:Record<string,unknown>})[]=[]
 function App(){const [id,setId]=createSignal(0);write=setId;const Tag=dynamic(()=>{calls++;const argument=id();return sync?(argument?'section':'article'):gates[argument]!.promise},{deferStream:kind.endsWith('defer')});return<Loading fallback={<b>fallback</b>}><Tag id="chosen" ref={(node:Element)=>{claims.push(!original||node===original)}}>chosen</Tag></Loading>}
 return{App,streams:[],docs,async settle(){if(isServer){equal(calls,1);gates[0]!.resolve('article');await ticks(8);return}if(window.mode==='hydrate'){equal(document.querySelector('#root article')===original,true);equal(document.getElementById('root')!.textContent,'chosen');equal(claims[0],true)}else equal(document.getElementById('root')!.textContent,sync?'chosen':'fallback');gates[0]!.resolve(window.mode==='hydrate'?'section':'article');await ticks(8);equal(document.querySelector('#root article')?.id,'chosen');write(1);flush();await ticks(4);if(!sync)equal(document.querySelector('#root article')?.id,'chosen');gates[1]!.resolve('section');await ticks(8);equal(document.querySelector('#root section')?.id,'chosen');equal(document.getElementById('root')!.textContent,'chosen');docs.push({id:'03/dynamic-native-hydration-'+kind,file:'03-control-flow.md',statement:'An async dynamic native tag composes with Loading, adopts its serialized tag and DOM without re-entering Loading, and updates after an argument change.',observations:{calls,claims}})}}
}
