import { OBSERVE, createRoot, createSignal, createMemo, createEffect, createRenderEffect, onCleanup, flush, untrack, getOwner, runWithOwner, refresh, affects, action, onSettled, createComponent } from 'solid-js'
import { isDev, isServer } from '@solidjs/web'
import { equal, ok, type DocCase } from './registry'
import { ticks } from '../../harness/timing'

const cases: DocCase[] = []
const file = '08-dev-diagnostics.md'
const observe = OBSERVE!
async function settled(run:()=>unknown){let dispose!:()=>void;let caught:unknown;createRoot(d=>{dispose=d;onSettled(()=>{try{return run() as (()=>void)|undefined}catch(e){caught=e}})});await ticks(8);dispose();if(caught)throw caught}
function owned(run: () => unknown) { let dispose!:()=>void; try { return createRoot(d => { dispose=d; return run() }) } finally { dispose?.() } }
async function observed(run: () => unknown | Promise<unknown>) {
 const events: Parameters<Parameters<typeof observe.diagnostics.subscribe>[0]>[0][]=[]
 const printed: string[]=[]
 const warn=console.warn, error=console.error
 console.warn=(...args:unknown[])=>{printed.push('warn:'+String(args[0]))}
 console.error=(...args:unknown[])=>{printed.push('error:'+String(args[0]))}
 const capture=observe?.diagnostics.capture() ?? {events:[],stop:()=>[],clear:()=>{}}
 const off=observe?.diagnostics.subscribe(event=>{events.push(event)}) ?? (()=>{})
 let caught:unknown
 try { try { await run() } catch(e){caught=e} await ticks(8); return { events:[...events], captured:capture.stop(),printed,caught } }
 finally {off();capture.stop();console.warn=warn;console.error=error}
}
function check(code:string,severity:'warn'|'error', bad:()=>unknown, good:()=>unknown) {
 cases.push({id:'08/diagnostic-'+code.toLowerCase(),file,statement:`${code}: the documented trigger emits ${severity}; the repaired control does not emit that code.`,async run(){
  const negative=await observed(good)
  equal(negative.events.filter(e=>e.code===code),[])
  const positive=await observed(bad)
  const relevant=positive.events.filter(e=>e.code===code)
  if(isDev){equal(relevant.length,1);equal(relevant[0]!.severity,severity);ok(relevant[0]!.message.length>0);equal(positive.captured,relevant.length===positive.events.length?relevant:positive.events);if(severity==='warn')ok(positive.printed.some(m=>m.includes('['+code+']')),JSON.stringify(positive.events));if(severity==='error')ok(positive.caught,JSON.stringify(positive.events))}
  else {equal(relevant,[]);ok(!positive.printed.some(m=>m.includes('['+code+']')))}
 }})
}
if(!isServer){
 check('CLEANUP_IN_FORBIDDEN_SCOPE','error',()=>settled(()=>onCleanup(()=>{})),()=>settled(()=>()=>{}))
 check('PRIMITIVE_IN_FORBIDDEN_SCOPE','error',()=>settled(()=>{createMemo(()=>0)}),()=>settled(()=>{}))
 check('PENDING_ASYNC_UNTRACKED_READ','error',()=>owned(()=>createComponent(()=>{const read=createMemo(()=>new Promise<number>(()=>{}));return read()},{})),()=>owned(()=>{const read=createMemo(()=>Promise.resolve(1),{loadingValue:0});untrack(read)}))
 check('REACTIVE_WRITE_IN_OWNED_SCOPE','error',()=>owned(()=>{const [,write]=createSignal(0);write(1)}),()=>{let write!:(v:number)=>void;owned(()=>{[,write]=createSignal(0)});write(1);flush()})
 check('ASYNC_STORE_SETTER','error',()=>storeSetter(set=>set((async(d:{n:number})=>{d.n=1}) as (d:{n:number})=>void)),()=>storeSetter(set=>set(d=>{d.n=1})))
 check('MISSING_EFFECT_FN','error',()=>owned(()=>{(createEffect as unknown as (f:()=>number)=>void)(()=>1)}),()=>owned(()=>{createEffect(()=>1,()=>{});flush()}))
 check('INVALID_REFRESH_TARGET','error',()=> (refresh as unknown as (f:()=>number)=>unknown)(()=>1),()=>{let read!:ReturnType<typeof createMemo<number>>;owned(()=>{read=createMemo(()=>1)});refresh(read).catch(()=>{})})
 check('INVALID_AFFECTS_TARGET','error',()=>{let read!:()=>number;owned(()=>{[read]=createSignal(0)});(affects as unknown as (r:()=>number,key:string)=>void)(read,'n')},()=>{let read!:()=>number;owned(()=>{[read]=createSignal(0)});affects(read)})
 check('ACTION_CALLED_IN_OWNED_SCOPE','error',()=>owned(()=>{const fn=action(function*(){return 1});return fn()}),()=>{let fn!:()=>Promise<number>;owned(()=>{fn=action(function*(){return 1})});return fn()})
 check('NO_OWNER_EFFECT','warn',()=>{createEffect(()=>1,()=>{});flush()},()=>owned(()=>{createEffect(()=>1,()=>{});flush()}))
 check('NO_OWNER_CLEANUP','warn',()=>onCleanup(()=>{}),()=>owned(()=>onCleanup(()=>{})))
 check('RUN_WITH_DISPOSED_OWNER','warn',()=>{let owner!:ReturnType<typeof getOwner>;owned(()=>{owner=getOwner()});runWithOwner(owner,()=>{})},()=>owned(()=>runWithOwner(getOwner(),()=>{})))
 check('FLUSH_IN_EFFECT_CALLBACK','warn',()=>owned(()=>{createEffect(()=>1,()=>{flush()});flush()}),()=>owned(()=>{createEffect(()=>1,()=>{});flush()}))
 check('STRICT_READ_UNTRACKED','warn',()=>owned(()=>{const [read]=createSignal(0);createEffect(()=>0,()=>{read()});flush()}),()=>owned(()=>{const [read]=createSignal(0);createEffect(()=>0,()=>{untrack(read)});flush()}))
 check('SYNC_NODE_RECEIVED_ASYNC','error',()=>owned(()=>untrack(createMemo(()=>Promise.resolve(1),{sync:true}))),()=>owned(()=>createMemo(()=>1,{sync:true})))
 cases.push({id:'08/exclude-include',file,statement:'Diagnostics in an excluded owner subtree are suppressed; include overrides exclusion at the nearest marked ancestor.',async run(){
  if(!isDev){equal(OBSERVE,undefined);return}
  const result=await observed(()=>owned(()=>{const outer=getOwner()!;observe.exclude(outer);equal(observe.isExcluded(outer),true);observe.diagnostics.emit({code:'NO_OWNER_CLEANUP',kind:'lifecycle',severity:'info',message:'excluded'},outer);createRoot(()=>{const inner=getOwner()!;observe.include(inner);equal(observe.isExcluded(inner),false);observe.diagnostics.emit({code:'NO_OWNER_CLEANUP',kind:'lifecycle',severity:'info',message:'included'},inner)})}));equal(result.events.map(e=>e.message),['included'])
 }})
 cases.push({id:'08/records-listener-lifecycle',file,statement:'records.observed checks active listeners; unsubscribe is idempotent and subscribers receive serializable records beside live handles.',run(){if(!isDev){equal(OBSERVE,undefined);return}equal(observe.records.observed('boundary'),false);const off=observe.records.subscribe('boundary',()=>{});equal(observe.records.observed('boundary'),true);off();off();equal(observe.records.observed('boundary'),false);equal(observe.ownerPath(null),undefined)}})
 cases.push({id:'08/channel-capture',file,statement:'capture returns events in emission order; clear resets its array; stop unsubscribes; subscribe receives a live subject separately.',async run(){
  if(!isDev){equal(OBSERVE,undefined);return}
  const first=observe.diagnostics.capture(),second=observe.diagnostics.capture();const entries:unknown[]=[];const off=observe.diagnostics.subscribe((e,subject)=>entries.push([e,subject]));const warn=console.warn;console.warn=()=>{}
  try {observe.diagnostics.emit({code:'NO_OWNER_CLEANUP',kind:'lifecycle',severity:'info',message:'capture fixture'});if(isDev){equal(first.events.length,1);equal(second.events.length,1);equal(entries.length,1);ok(Number.isInteger(first.events[0]!.sequence));ok(JSON.stringify(first.events[0]).includes('capture fixture'))}else equal(first.events.length,0);first.clear();equal(first.events,[]);first.stop();off();observe.diagnostics.emit({code:'NO_OWNER_CLEANUP',kind:'lifecycle',severity:'info',message:'after stop'});equal(first.events,[]);equal(entries.length,isDev?1:0);equal(second.events.length,isDev?2:0)}finally{console.warn=warn;off();first.stop();second.stop()}
 }})
 cases.push({id:'08/channel-info-console',file,statement:'Info events reach the structured channel only; warn emits console.warn, and events are monotonically sequenced.',async run(){if(!isDev){equal(OBSERVE,undefined);return}const result=await observed(()=>{observe.diagnostics.emit({code:'NO_OWNER_CLEANUP',kind:'lifecycle',severity:'info',message:'advisory'});observe.diagnostics.emit({code:'NO_OWNER_EFFECT',kind:'lifecycle',severity:'warn',message:'[NO_OWNER_EFFECT] warning'})});if(isDev){equal(result.events.length,2);ok(result.events[1]!.sequence>result.events[0]!.sequence);equal(result.printed.filter(p=>p.includes('advisory')),[])}else equal(result.events,[])}})
}
import { createStore } from 'solid-js'
function storeSetter(run:(setter:ReturnType<typeof createStore<{n:number}>>[1])=>unknown){let dispose!:()=>void;const [,set]=createRoot(d=>{dispose=d;return createStore({n:0})});try{return run(set)}finally{dispose()}}
export const diagnosticCases=cases
