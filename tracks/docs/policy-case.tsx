import {dynamicTrackingCase} from '../../findings/041-dynamic-source-tracking/component'
import { createMemo, createSignal, createStore, createProjection, createOptimistic, createOptimisticStore, createEffect, createRoot, getOwner, runWithOwner, untrack, Show, isHydrating, isPending, Loading, onCleanup, flush } from 'solid-js'
import { isServer, clientOnly, dynamic, takeHydrationValue, getHydrationWriter } from '@solidjs/web'
import type { Spec } from '../../harness/tree'
import { controlledIterable, deferred, ticks } from '../../harness/timing'
import { equal, type DocResult } from './registry'

const NativePromise=Promise
export function policyCase(spec:Spec){
 const kind=spec.scenario!.split(':')[1]!
 if(kind==='dynamic-count-only')return dynamicTrackingCase()
 if(kind.startsWith('client-only'))return clientOnlyPolicy(kind)
 if(kind.startsWith('dynamic-native'))return dynamicNativePolicy(kind)
 if(kind.startsWith('primitive-'))return primitivePolicy(kind)
 const iterable=kind==='hybrid-iterable'
 const policy=kind==='client'||kind==='declared-client'?'client':kind.startsWith('hybrid')?'hybrid':'server'
 const gates=[deferred<number>(),deferred<number>()]
 const streams=[controlledIterable<number>(),controlledIterable<number>()]
 const iterables=streams.map(stream=>({[Symbol.asyncIterator]:()=>stream.iterable[Symbol.asyncIterator]()}))
 const docs:(DocResult & {observations:Record<string,unknown>})[]=[]
 let showExtra!:(v:boolean)=>void,write!:(v:number)=>void,read!:()=>number,requests=0,calls=0,cached:Promise<number>|undefined
 const cache=new Map<number,Promise<number>>()
 const fetchKinds=['tracking-fetch','tracking-await','cached-fake','cached-safe','cached-safe-seed']
 let closeIsolated=()=>{};const isolatedOwner=!isServer&&kind==='idless-auto'?createRoot(close=>{closeIsolated=close;return getOwner()}):null
 const originalFetch=globalThis.fetch
 if(!isServer&&fetchKinds.includes(kind))globalThis.fetch=((input:RequestInfo|URL,init?:RequestInit)=>{
  if(String(input).includes('/doc-policy-source')){requests++;return Promise.resolve(new Response(window.mode==='hydrate'?'99':'7'))}
  return originalFetch(input,init)
 }) as typeof fetch
 function App(){
  onCleanup(()=>{closeIsolated();if(!isServer&&fetchKinds.includes(kind))globalThis.fetch=originalFetch})
  if(!isServer&&kind==='transparent')createMemo(()=>42,{transparent:true})
  if(!isServer&&['unowned-auto','idless-auto'].includes(kind)){const logged:string[]=[];const previous=console.warn;console.warn=(...args)=>{logged.push(args.map(String).join(' '))};let extra:()=>number;try{extra=kind==='unowned-auto'?runWithOwner(null,()=>createMemo(()=>42)):runWithOwner(isolatedOwner,()=>createMemo(()=>42));equal(untrack(extra),42);for(const message of logged)equal(message.includes('PRIMITIVE_WITHOUT_OWNER'),true)}finally{console.warn=previous}}
  const [argument,setArgument]=createSignal(0),[extra,setExtra]=createSignal(false);write=setArgument;showExtra=setExtra
  read=createMemo(()=>{
   const id=argument();calls++
   if(isServer){if(kind==='cached-safe-seed')getHydrationWriter()!.write('mylib:'+id,gates[id]!.promise);return iterable?iterables[id]!:gates[id]!.promise}
   if(kind==='tracking-fetch')return fetch('/doc-policy-source').then(response=>response.json()) as Promise<number>
   if(kind==='tracking-await')return(async()=>{await 0;return(await fetch('/doc-policy-source')).json() as Promise<number>})()
   if(kind.startsWith('cached-safe')){const fetcher=()=>fetch('/doc-policy-source').then(response=>response.json())as Promise<number>;if(!cache.has(id)){const seed=takeHydrationValue<number>('mylib:'+id);if(seed?.status==='resolved')cache.set(id,NativePromise.resolve(seed.value));else if(seed?.status==='pending')cache.set(id,seed.promise);else if(isHydrating())return fetcher();else cache.set(id,fetcher())}return cache.get(id)!}
   if(kind==='cached-fake')return cached??=(fetch('/doc-policy-source').then(response=>response.json()) as Promise<number>)
   return iterable?iterables[id]!:gates[id]!.promise
  },{ssrSource:policy,...(kind==='declared-client'?{loadingValue:3}: {})})
  return<><Loading fallback={<b>fallback</b>}><span>{read()}</span></Loading><Show when={extra()}><Loading fallback={<i>extra-fallback</i>}><span>{read()}</span></Loading></Show></>
 }
 const content=()=>document.getElementById('root')!.textContent
 const statements:Record<string,string>={'unowned-auto':'An ownerless node created during hydration consumes no positional slot; its following async sibling adopts the server answer.', 'idless-auto':'A node created during hydration under an id-less root consumes no positional slot; its following async sibling adopts the server answer.',server:'The client adopts the serialized initial server value and recomputes on a dependency change.', 'hybrid-promise':'For promise computes hybrid is identical to server.', 'hybrid-iterable':'The server consumes one yield; hybrid continues the client iterable and discards its duplicate first yield.', client:'The client source never computes on the server and mounts fresh after hydration.', 'declared-client':'A declared client loadingValue renders the same first paint during SSR and hydration.', transparent:'A transparent client-only memo consumes no hydration ID slot.', 'tracking-fetch':'The fake fetch sends nothing during the tracking run.', 'tracking-await':'A non-fake await before fetch resumes after the tracking window and sends a duplicate.', 'cached-fake':'A fake fetch promise cached during the tracking run never settles for later readers.'}
 const record=(name:string)=>docs.push({id:'05/policy-'+name,file:'05-async-data.md',statement:statements[name]??'A NativePromise cache uses server hydration seeds and does not retain fake promises from a seedless tracking run.',observations:{kind,calls,requests,policy,dom:isServer?null:content()}})
 return{App,streams:iterable?streams:[],docs,async settle(){
  if(isServer){equal(calls,policy==='client'?0:1);if(policy!=='client'){if(iterable)streams[0]!.push(7);else gates[0]!.resolve(7);await ticks(8)}return}
  const hydrating=window.mode==='hydrate'
  if(fetchKinds.includes(kind)){
   await ticks(8);equal(content(),'7');equal(requests,hydrating?(kind==='tracking-await'?1:0):1)
   if(kind.startsWith('cached-safe')){write(1);flush();await ticks(8);equal(requests,hydrating?1:2);equal(content(),hydrating?'99':'7');equal(isPending(read),false)}
   if(kind==='cached-fake'&&hydrating){write(1);flush();await ticks(8);equal(requests,0);equal(content(),'7');equal(isPending(read),true)}
   record(kind);return
  }
  if(hydrating&&iterable){equal(isPending(read),false);showExtra(true);flush();await ticks(4);equal(content(),'77');equal(isPending(read),false);showExtra(false);flush()}
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

function primitivePolicy(kind:string){
 const [,primitive,policy]=kind.split('-')as [string,string,'server'|'hybrid'|'client'];const gates=[deferred<number>(),deferred<number>()],observed:number[]=[];let calls=0,write!:(n:number)=>void,read!:()=>number,element:HTMLSpanElement|undefined;const effects=primitive==='effect';const docs:DocResult[]=[];
 function App(){const [id,setId]=createSignal(0);write=setId;const compute=()=>{calls++;return gates[id()]!.promise};const options={ssrSource:policy};switch(primitive){case'memo':read=createMemo(compute,options);break;case'signal':read=createSignal(compute,options)[0];break;case'optimistic':read=createOptimistic(compute,options)[0];break;case'store':{const [state]=createStore(()=>compute().then(n=>({n})),{n:0},options);read=()=>state.n;break}case'projection':{const state=createProjection(()=>compute().then(n=>({n})),{n:0},options);read=()=>state.n;break}case'optimisticstore':{const [state]=createOptimisticStore(()=>compute().then(n=>({n})),{n:0},options);read=()=>state.n;break}case'effect':createEffect(compute,n=>{observed.push(n);if(element)element.textContent=String(n)},options);read=()=>7;break;default:throw new Error('Unknown primitive '+primitive)}return<Loading fallback={<b>fallback</b>}><span ref={(node:HTMLSpanElement)=>{element=node}}>{read()}</span></Loading>}
 return{App,streams:[],docs,async settle(){if(isServer){equal(calls,policy==='client'?0:1);gates[0]!.resolve(7);await ticks(8);equal(observed,[]);return}const hydrate=window.mode==='hydrate';await ticks(4);const content=()=>document.getElementById('root')!.textContent;if(hydrate&&policy!=='client')equal(content(),'7');else equal(content(),effects?'7':'fallback');gates[0]!.resolve(hydrate&&policy!=='client'?99:7);await ticks(8);equal(content(),'7');if(effects)equal(observed,[7]);write(1);flush();gates[1]!.resolve(8);await ticks(8);equal(content(),'8');if(effects)equal(observed,[7,8]);docs.push({id:'05/'+kind,file:'05-async-data.md',statement:'ssrSource is accepted by each documented primitive; server/hybrid adopt, client skips SSR compute, and every source responds to new arguments.'})}}
}
