import {OBSERVE,createRoot,createSignal,createStore,createMemo,createEffect,createTrackedEffect,createReaction,flush,onSettled,untrack,Loading,Errored} from 'solid-js'
import {enablePerformanceTracks} from '@solidjs/web/performance-tracks'
import {attribution} from 'solid-js/attribution'
import {resetErrorHalt} from '@solidjs/signals'
import {isServer,isDev,render} from '@solidjs/web'
import {equal,ok,throws,type DocCase} from './registry'
import {ticks,deferred} from '../../harness/timing'
const cases:DocCase[]=[]
function doc(id:string,statement:string,run:DocCase['run']) {cases.push({id:'08/client-diagnostic-'+id,file:'08-dev-diagnostics.md',statement,run})}
async function capture(code:string,run:()=>unknown|Promise<unknown>,positive=true,count=1) {
  const session=OBSERVE?.diagnostics.capture(), warn=console.warn,error=console.error
  console.warn=console.error=()=>{}
  try {await run();await ticks(2);const events=session?.events.filter(e=>e.code===code)??[];equal(events.length,isDev&&positive?count:0);for(const event of events){equal(event.kind,['UNTRACKED_READ_AFTER_AWAIT','LOADING_ON_OUTSIDE_HOLD','PENDING_ASYNC_FORBIDDEN_SCOPE'].includes(code)?'async':'lifecycle');equal(event.severity,code==='SETTLED_CLEANUP_UNOWNED'?'error':'warn')}return events}
  finally {session?.stop();console.warn=warn;console.error=error;resetErrorHalt()}
}
function root(fn:()=>void) {let close!:()=>void;createRoot(dispose=>{close=dispose;fn()});return close}
if(!isServer){
  doc('after-await','Each computation warns once per signal or memo, and once per store (naming the first untracked property it reads, at any depth).',async()=>{
    // Run this in system Chrome: Bun's JavaScriptCore does not provide V8 async stacks.
    for(const shape of ['signal','store','before','untrack'] as const) {
      await capture('UNTRACKED_READ_AFTER_AWAIT',async()=>{
        let result!:()=>number,set!:()=>void,runs=0
        const gate=deferred<void>()
        const close=root(()=>{
          const [signal,write]=createSignal(1,{name:'late-signal'})
          const [store,writeStore]=createStore({first:1,nested:{second:2},rows:[{n:3},{n:4}]},{name:'late-store'})
          set=()=>{write(2);writeStore(d=>{d.first=2})}
          result=createMemo(async()=>{runs++;const before=shape==='before'?signal():0;await gate.promise;return shape==='store'?store.first+store.nested.second+store.rows.map(r=>r.n).reduce((a,b)=>a+b,0):shape==='untrack'?untrack(signal):before+signal()},{name:'after-await'})
          try{result()}catch{}
        })
        try{gate.resolve();await ticks(8);equal(result(),shape==='store'?10:shape==='before'?2:1);set();await ticks(8);equal(runs,shape==='before'?2:1);if(shape==='signal')equal(result(),1)}finally{close()}
      },shape==='signal'||shape==='store')
    }
  })
  doc('loading-outside','The diagnostic fires once, at the change, and data.source names the source.',async()=>{
    for(const outside of [true,false]) await capture('LOADING_ON_OUTSIDE_HOLD',async()=>{
      const gates=[deferred<number>(),deferred<number>()];let change!:(n:number)=>void
      const el=document.createElement('div')
      const dispose=render(()=>{const [id,set]=createSignal(0);change=set;const data=createMemo(()=>gates[id()]!.promise,{name:'held-data'});return <><Loading on={id()} fallback={<i>A</i>}><span>{data()}</span>{!outside&&<b>{data()}</b>}</Loading>{outside&&<Loading fallback={<i>B</i>}><b>{data()}</b></Loading>}</>},el)
      try{gates[0]!.resolve(1);await ticks(8);change(1);flush();await ticks(2);if(outside)ok(!el.textContent!.includes('A'));gates[1]!.resolve(2);await ticks(8);equal(el.textContent,'22')}finally{dispose()}
    },outside)
  })
  doc('pending-forbidden','Warns that an async value read inside createTrackedEffect or onSettled will throw if it is ever pending, because these scopes cannot route not-ready reads through Loading.',async()=>{
    for(const pending of [true,false]) await capture('PENDING_ASYNC_FORBIDDEN_SCOPE',()=>{
      let errors=0;const gate=deferred<number>();const close=root(()=>{const source=createMemo(()=>pending?gate.promise:1);createTrackedEffect(()=>{try{source()}catch{errors++}})});try{flush();equal(errors,pending?1:0)}finally{gate.resolve(1);close()}
    },pending)
  })
  doc('no-owner-boundary','A Loading or Errored boundary was created without a parent owner.',async()=>{
    for(const kind of ['loading','errored']) {
      await capture('NO_OWNER_BOUNDARY',()=>{kind==='loading'?Loading({children:'ready',fallback:'fallback'}):Errored({children:'ready',fallback:'fallback'})})
      await capture('NO_OWNER_BOUNDARY',()=>{const close=root(()=>{kind==='loading'?Loading({children:'ready',fallback:'fallback'}):Errored({children:'ready',fallback:'fallback'})});close()},false)
    }
  })
  doc('settled-unowned','Returning one is a dev-mode error (the cleanup is dropped in production); the out-of-band fire itself is fine for one-shot work.',async()=>{
    await capture('SETTLED_CLEANUP_UNOWNED',()=>{let cleaned=0;onSettled(()=>()=>{cleaned++});if(isDev)throws(flush,'SETTLED_CLEANUP_UNOWNED');else flush();equal(cleaned,0)})
    await capture('SETTLED_CLEANUP_UNOWNED',()=>{let cleaned=0;const close=root(()=>{onSettled(()=>()=>{cleaned++})});flush();close();equal(cleaned,1)},false)
    await capture('SETTLED_CLEANUP_UNOWNED',()=>{let ran=0;onSettled(()=>{ran++});flush();equal(ran,1)},false)
  })
  doc('invalid-cleanup','Effect, tracked effect, reaction, and onSettled callbacks must return either a cleanup function or undefined. Returning anything else throws.',async()=>{
    for(const kind of ['effect','tracked','reaction','settled'] as const) {
      if(isDev) {
      const warn=console.warn,error=console.error, report=globalThis.reportError;const reported:unknown[]=[];console.warn=console.error=()=>{};globalThis.reportError=(e:unknown)=>{reported.push(e)}
      let close!:()=>void
      try {
        let invalidate!:(v:number)=>void
        close=root(()=>{const [n,set]=createSignal(0);invalidate=set;const bad=()=>123 as any; if(kind==='effect')createEffect(n,bad);else if(kind==='tracked')createTrackedEffect(bad);else if(kind==='settled')onSettled(bad);else {const track=createReaction(bad);track(n)}})
        if(kind==='reaction'){flush();invalidate(1)}
        throws(flush,'invalid cleanup value')
      } finally {close?.();resetErrorHalt();await ticks(2);console.warn=warn;console.error=error;globalThis.reportError=report}
      }
      let cleaned=0,changeGood:((v:number)=>void)|undefined;const good=root(()=>{const callback=()=>()=>{cleaned++};if(kind==='effect')createEffect(()=>1,callback);else if(kind==='tracked')createTrackedEffect(callback);else if(kind==='settled')onSettled(callback);else {const [n,set]=createSignal(0);changeGood=set;const track=createReaction(callback);track(n)}});flush();if(changeGood){changeGood(1);flush()}good();equal(cleaned,1)
    }
  })
  doc('binding-address','A compiled binding effect reads as what it writes when sourceNames.bindings is on; a console diagnostic about it prints that element as a second argument.',async()=>{
    const warn=console.warn;const calls:unknown[][]=[];console.warn=(...args:unknown[])=>{calls.push(args)}
    const release=attribution.enable({log:false,hotTime:false,waterfalls:false,wideDeps:false,unstableMemos:false,fanOut:false,wastedRecompute:false,hotRuns:{count:5,windowMs:60000}})
    const session=OBSERVE?.diagnostics.capture(),el=document.createElement('div');let change!:(n:string)=>void
    const dispose=render(()=>{const [cls,set]=createSignal('a');change=set;return <div id='binding-target' class={cls()}/>},el)
    try{flush();for(let i=0;i<6;i++){change('c'+i);flush()}await ticks(2);const found=session?.events.filter(e=>e.code==='HOT_SCOPE_RERUNS')??[];if(isDev){ok(found.some(e=>e.ownerPath?.some(p=>p.includes('div.class'))));const hot=calls.find(args=>String(args[0]).includes('[HOT_SCOPE_RERUNS]'));ok(hot);equal(hot![1]===el.firstElementChild,true)}else equal(found.length,0)}finally{dispose();session?.stop();release();console.warn=warn}
  })
  doc('performance-records','Rich mode performance.measure carries detail.devtools tooltips and properties; the spans use the underlying records own clocks.',()=>{
    const release=enablePerformanceTracks({rich:true,minMs:0});const records:{at:number;totalMs:number}[]=[]
    const off=OBSERVE?.records.subscribe('rerun',e=>{records.push(e)})
    let change!:(v:number)=>void;const close=root(()=>{const [n,set]=createSignal(0);change=set;const doubled=createMemo(()=>n()*2,{name:'perf-doubled'});createEffect(doubled,()=>{},{name:'perf-paint'})})
    try{flush();change(1);flush();const entries=(performance.getEntriesByType('measure') as PerformanceMeasure[]).filter(e=>e.detail?.devtools?.trackGroup==='Solid');if(isDev){ok(entries.length>0);ok(entries.some(e=>e.detail.devtools.dataType==='track-entry'));ok(records.length>0);for(const r of records)ok(entries.some(e=>Math.abs(e.startTime-r.at)<0.001&&Math.abs(e.duration-r.totalMs)<0.001));ok(entries.some(e=>e.detail.devtools.properties))}else {equal(entries.length,0);equal(records.length,0)}}finally{close();off?.();release()}
  })
  doc('performance-holds','A second enablePerformanceTracks joins the instance and returns its own release; the instance is torn down when every release has been called.',()=>{
    const name='conformance-app-measure';performance.measure(name,{start:performance.now(),duration:0})
    const first=enablePerformanceTracks({rich:true,minMs:0}),second=enablePerformanceTracks({rich:true,minMs:100000})
    let change!:(v:number)=>void;const close=root(()=>{const [n,set]=createSignal(0);change=set;createEffect(n,()=>{})})
    const entries=()=>performance.getEntriesByType('measure').filter(e=>(e as PerformanceMeasure).detail?.devtools?.trackGroup==='Solid').length
    try{flush();first();const before=entries();change(1);flush();if(isDev)ok(entries()>before);else equal(entries(),0);second();equal(entries(),0);change(2);flush();equal(entries(),0);equal(performance.getEntriesByName(name,'measure').length,1)}finally{close();first();second();performance.clearMeasures(name)}
  })
  doc('flush-forbidden','Calling flush() from inside createTrackedEffect or onSettled would cause re-entrancy.',()=>{
    for(const kind of ['tracked','settled']) {let attempted=0;const close=root(()=>{const run=()=>{attempted++;if(isDev)throws(flush,'not reentrant');else flush()};kind==='tracked'?createTrackedEffect(run):onSettled(run)});try{flush();equal(attempted,1)}finally{close()}}
    flush()
  })
}
export const clientDiagnosticCases=cases
