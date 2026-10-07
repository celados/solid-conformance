import { createRoot, createSignal, createMemo, createEffect, createRenderEffect, createStore, createOptimistic, action, mapArray, isPending, latest, OBSERVE, DEV, flush, getOwner, untrack } from 'solid-js'
import { attribution, costs, feedback, why, subscriptions, graphSize, formatRerun, formatOrigin, type AttributionOptions } from 'solid-js/attribution'
import { isDev, isServer } from '@solidjs/web'
import { equal, ok, type DocCase } from './registry'
import { observed } from './diagnostic-cases'
import { deferred, ticks } from '../../harness/timing'
const file='08-dev-diagnostics.md'
const cases:DocCase[]=[]
function add(id:string,statement:string,run:DocCase['run']){cases.push({id:'08/'+id,file,statement,run})}
function root(run:()=>unknown){let dispose!:()=>void;try{return createRoot(d=>{dispose=d;return run()})}finally{dispose?.()}}
const quiet:AttributionOptions={log:false,hotRuns:false,hotTime:false,wideDeps:false,unstableMemos:false,fanOut:false,wastedRecompute:false,graphGrowth:false,holds:false,longHolds:false,waterfalls:false,abandonedFlights:false,stackedHolds:false,fallbackFlashes:false,optimisticReverts:false}
if(!isServer){
add('attribution-prod-inert','The import is legal in every tier — the prod tier resolves an inert engine with the same surface.',()=>{
 const release=attribution.enable(quiet);try{if(isDev)ok(OBSERVE!.attribution.installed);else{equal(OBSERVE,undefined);equal(attribution.history('rerun'),[]);equal(costs(),{scopes:[],writes:[]})}}finally{release();release();attribution.disable()}
})
add('attribution-holds','Each enable() is a hold and returns its release; the last release uninstalls; disable resets all holders.',()=>{
 if(!isDev)return
 const a=attribution.enable(quiet),b=attribution.enable(quiet);try{ok(OBSERVE!.attribution.installed);a();a();ok(OBSERVE!.attribution.installed);b();ok(!OBSERVE!.attribution.installed);const c=attribution.enable(quiet);attribution.disable();ok(!OBSERVE!.attribution.installed);c()}finally{a();b();attribution.disable()}
})
add('attribution-records-queries','Re-run records contain serializable timings, causes and stable node ids; history is bounded oldest first; named queries return current dependencies.',()=>{
 if(!isDev)return
 const release=attribution.enable({...quiet,historyLimit:2});const entries:unknown[]=[];const off=OBSERVE!.records.subscribe('rerun',(e,node)=>{entries.push(node);ok(JSON.stringify(e).includes('nodeId'))})
 let dispose!:()=>void
 try{const [read,write,memo]=createRoot(d=>{dispose=d;const [r,w]=createSignal(0,{name:'source'});const m=createMemo(()=>r()*2,{name:'double'});createEffect(m,()=>{});flush();return [r,w,m] as const});for(let i=1;i<=3;i++){write(i);flush()}equal(untrack(read),3);equal(untrack(memo),6);const history=attribution.history('rerun');equal(history.length,2);ok(history[0]!.at<=history[1]!.at);ok(history.every(e=>e.at>=0&&e.selfMs>=0&&e.totalMs>=e.selfMs));ok(entries.length>=6);ok(why(memo).every(e=>e.nodeName==='double'));equal(subscriptions(memo),['source']);ok(formatRerun(history[1]!).includes('[why-run]'));ok(costs().scopes.length>0);ok(graphSize().computations>0)}finally{dispose();off();release()}
})
add('records-reentrant-listeners','Delivery finishes over the listener array it started with; unsubscription mid-delivery cannot skip or double-call anyone.',()=>{
 if(!isDev)return
 const calls:string[]=[];let second=()=>{};const first=OBSERVE!.records.subscribe('graph',()=>{calls.push('a');second()});second=OBSERVE!.records.subscribe('graph',()=>calls.push('b'));const third=OBSERVE!.records.subscribe('graph',()=>calls.push('c'));const emit=()=>OBSERVE!.records.emit('graph',{at:0,route:'/',owners:0,computations:0,signals:0,edges:0,roots:0,navigation:{at:0,writes:0,origin:{kind:"navigation",name:"/",at:0}}},undefined);try{emit();equal(calls,['a','b','c']);calls.length=0;emit();equal(calls,['a','c'])}finally{first();second();third()}
})
add('records-body-facet','A bodies subscription sets the emitter second gate; unsubscribe is idempotent and the ordinary gate remains for other listeners.',()=>{
 if(!isDev)return
 const a=OBSERVE!.records.subscribe('call',()=>{}),b=OBSERVE!.records.subscribe('call',()=>{},{bodies:true});try{equal(OBSERVE!.records.observed('call'),true);equal(OBSERVE!.records.observed('call','bodies'),true);b();b();equal(OBSERVE!.records.observed('call','bodies'),false);equal(OBSERVE!.records.observed('call'),true)}finally{a();b()}
})
add('diagnostic-guide-owner-path','DEV.guideUrl builds a stable URL anchored by code; ownerPath is root first and unnamed ownerPath(null) is undefined.',()=>{
 if(!isDev)return
 ok(DEV!.guideUrl('NO_OWNER_EFFECT').includes('#no_owner_effect'));root(()=>{const path=OBSERVE!.ownerPath(getOwner());equal(OBSERVE!.ownerPath(null),undefined);ok(path===undefined||Array.isArray(path))})
})
for(const level of ['full','labels','none'] as const)add('values-'+level,'Records govern user previews and element text at the source under values: '+level,()=>{
 if(!isDev)return
 const release=attribution.enable({...quiet,values:level});let dispose!:()=>void
 try{const [write]=createRoot(d=>{dispose=d;const[r,w]=createSignal('secret',{name:'private'});createMemo(()=>r());return [w] as const});OBSERVE!.attribution.withInteraction({type:'click',target:'div#card "Personal note"'},()=>{write('changed');flush()});const event=attribution.history('rerun').at(-1)!;ok(event);const cause=event.causes[0]!;const origin=cause.origin!;equal('prev'in cause,level==='full');equal(origin.target,level==='full'?'div#card "Personal note"':'div#card');ok(!formatOrigin(origin).includes('Personal note')||level==='full');const navigation=feedback().interactions;ok(navigation.length>0)}finally{dispose();release()}
})
add('values-least-permissive','Across holds the least permissive values level wins until its holder releases.',()=>{
 if(!isDev)return
 const full=attribution.enable({...quiet,values:'full'}),none=attribution.enable({...quiet,values:'none'});let dispose!:()=>void
 try{const [write]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0);createMemo(()=>r());return[w] as const});write(1);flush();equal('value'in attribution.history('rerun').at(-1)!.causes[0]!,false);none();write(2);flush();equal('value'in attribution.history('rerun').at(-1)!.causes[0]!,true)}finally{dispose();none();full()}
})
function warning(code:string,opts:AttributionOptions,work:(positive:boolean)=>unknown){add('attribution-warning-'+code.toLowerCase(),code+': the documented workload emits the code; repaired control and production do not.',async()=>{
 for(const positive of [false,true]){const result=await observed(async()=>{const release=attribution.enable({...quiet,...opts});try{await work(positive)}finally{release()}});equal(result.events.some(e=>e.code===code),isDev&&positive)}
})}
warning('HOT_SCOPE_RERUNS',{hotRuns:{count:3,windowMs:10000}},positive=>{let dispose!:()=>void;try{const [write]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0);createMemo(()=>r());return[w] as const});for(let i=1;i<=(positive?4:1);i++){write(i);flush()}}finally{dispose()}})
warning('WIDE_SCOPE_DEPS',{wideDeps:3},positive=>root(()=>{const sources=Array.from({length:positive?4:1},()=>createSignal(0)[0]);createMemo(()=>sources.reduce((n,s)=>n+s(),0))}))
warning('UNSTABLE_MEMO_OUTPUT',{unstableMemos:2},positive=>{let dispose!:()=>void;try{const[write]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0);const stable={n:1};createMemo(()=>{r();return positive?{n:1}:stable});return[w] as const});for(let i=1;i<=4;i++){write(i);flush()}}finally{dispose()}})
warning('HUGE_FAN_OUT',{fanOut:3},positive=>{let dispose!:()=>void;try{const[write]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0);for(let i=0;i<(positive?4:1);i++)createMemo(()=>r());return[w] as const});write(1);flush()}finally{dispose()}})
warning('HUGE_FAN_IN',{},positive=>root(()=>{const sources=Array.from({length:positive?2000:4},()=>createSignal(0)[0]);createMemo(()=>sources.reduce((n,s)=>n+s()+s(),0))}))
warning('HOT_SCOPE_FANOUT',{hotRuns:{count:3,windowMs:10000}},positive=>{let dispose!:()=>void;try{const[write]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0);for(let i=0;i<(positive?6:1);i++)createMemo(r);return[w] as const});for(let i=1;i<=4;i++){write(i);flush()}}finally{dispose()}})
warning('ABANDONED_FLIGHTS',{abandonedFlights:{count:2,windowMs:10000}},async positive=>{let dispose!:()=>void;try{const[write]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0);createMemo(()=>{r();return new Promise<number>(()=>{})});return[w] as const});for(let i=1;i<=(positive?3:0);i++){write(i);flush();await ticks(2)}}finally{dispose()}})
warning('HOT_SCOPE_TIME',{hotTime:{budgetMs:2,windowMs:10000}},positive=>{let dispose!:()=>void;try{const[write]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0);createMemo(()=>{r();if(positive){const end=performance.now()+4;while(performance.now()<end){}}return 0});return[w] as const});write(1);flush()}finally{dispose()}})
warning('WASTED_RECOMPUTE',{wastedRecompute:{minRuns:3,ratio:0.5,budgetMs:0,windowMs:10000}},positive=>{let dispose!:()=>void;try{const[write]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0);createMemo(()=>positive?(r(),0):r());return[w] as const});for(let i=1;i<=5;i++){write(i);flush()}}finally{dispose()}})
warning('EFFECT_WRITES_OWN_SOURCE',{},positive=>{let dispose!:()=>void;try{const[write]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0);const[,other]=createSignal(0);createEffect(r,n=>{if(n%2)(positive?w:other)(n+1)});flush();return[w] as const});write(3);flush()}finally{dispose()}})
warning('IMMUTABLE_UPDATE_IN_STORE',{},positive=>{let dispose!:()=>void;try{const[set]=createRoot(d=>{dispose=d;const[s,w]=createStore({user:{a:1,b:2,c:3,d:4}});createMemo(()=>s.user);return[w] as const});set(s=>{if(positive)s.user={...s.user,a:2};else s.user.a=2});flush()}finally{dispose()}})
warning('UNSTABLE_LIST_IDENTITY',{},positive=>{let dispose!:()=>void;try{const[write,items]=createRoot(d=>{dispose=d;const[r,w]=createSignal(Array.from({length:10},(_,id)=>({id,n:0})));const mapped=mapArray(r,item=>item.id);createMemo(mapped);return[w,r] as const});const old=untrack(items);write(positive?old.map(i=>({...i})):old);flush()}finally{dispose()}})
warning('UNTRACKED_ASYNC_HANDLER',{holds:{infoMs:0,warnMs:0}},async positive=>{let dispose!:()=>void;const completion=deferred<void>();try{const[write]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0);createMemo(r);return[w] as const});const returned=OBSERVE?OBSERVE.attribution.withInteraction({type:'click',target:'button#save'},()=>{if(!positive)write(1);return completion.promise}):completion.promise;await ticks(4);completion.resolve();await returned;await ticks(4);flush()}finally{dispose()}})
warning('SILENT_HOLD',{holds:{infoMs:0,warnMs:0},longHolds:{infoMs:10000,warnMs:10000}},async positive=>{let dispose!:()=>void;const flight=deferred<number>();try{const[write]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0,{name:'page'});const data=createMemo(()=>r()?flight.promise:0,{name:'fetch'});createRenderEffect(data,()=>{});if(!positive)createEffect(()=>isPending(data),()=>{});flush();return[w] as const});write(1);flush();await ticks(4);flight.resolve(1);await ticks(4);flush()}finally{dispose()}})
warning('LONG_HOLD',{holds:{infoMs:0,warnMs:0},longHolds:{infoMs:0,warnMs:0}},async positive=>{let dispose!:()=>void;const flight=deferred<number>();try{const[write]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0);const data=createMemo(()=>r()?flight.promise:0);createRenderEffect(data,()=>{});createEffect(()=>isPending(data),()=>{});flush();return[w] as const});if(positive){write(1);flush();await ticks(4)}flight.resolve(1);await ticks(4);flush()}finally{dispose()}})
warning('STACKED_HOLDS',{holds:{infoMs:10000,warnMs:10000},stackedHolds:{count:3}},async positive=>{let dispose!:()=>void;const flight=deferred<number>();try{const[write]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0);const data=createMemo(()=>r()?flight.promise:0);createRenderEffect(data,()=>{});flush();return[w] as const});for(let i=1;i<=(positive?3:1);i++){if(OBSERVE)OBSERVE.attribution.withInteraction({type:'click',target:'button#next'},()=>{write(i);flush()});else{write(i);flush()}}await ticks(4);flight.resolve(1);await ticks(4);flush()}finally{dispose()}})
warning('OPTIMISTIC_REVERTED',{optimisticReverts:true},async positive=>{let dispose!:()=>void;const flight=deferred<void>();try{const[run]=createRoot(d=>{dispose=d;const[r,w]=createOptimistic('idle',{name:'status'});createEffect(r,()=>{});const mutate=action(async function*(){w('saved');await flight.promise;yield});flush();return[mutate] as const});if(positive){const pending=run();flush();await ticks(4);flight.resolve();await pending}else flight.resolve();await ticks(4);flush()}finally{dispose()}})
warning('ASYNC_WATERFALL',{waterfalls:{minFlightMs:0}},async positive=>{let dispose!:()=>void;const first=deferred<number>();const preloaded=Promise.resolve(2);attribution.markFlight(preloaded,performance.now()-100);try{createRoot(d=>{dispose=d;const a=createMemo(()=>first.promise);const b=createMemo(()=>{a();return positive?Promise.resolve(2):preloaded});const c=createMemo(()=>{b();return positive?Promise.resolve(3):preloaded});createEffect(c,()=>{});flush()});first.resolve(1);await ticks(10);flush()}finally{dispose()}})
add('navigation-identity-and-redirect','The navigation ref is re-read at settle; redirects are destinations abandoned in order; origin joins records by identity.',()=>{
 if(!isDev)return
 const release=attribution.enable(quiet);let dispose!:()=>void
 try{const[write]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0);createMemo(r);return[w] as const});const ref={kind:'navigation' as const,name:'/a',to:'/a',params:{id:'1'}};OBSERVE!.attribution.withOrigin(ref,()=>{write(1);OBSERVE!.attribution.withOrigin({kind:'navigation',redirect:1,name:'/b',to:'/b',params:{id:'2'}},()=>write(2));ref.name='/b';ref.to='/b';ref.params.id='2'});flush();const nav=attribution.history('navigation').at(-1)!;equal(nav.name,'/b');equal(nav.to,'/b');equal(nav.params,{id:'2'});equal(nav.outcome,'committed');ok(nav.writes>=1);ok(nav.redirects?.some(h=>h.to==='/a'));const run=attribution.history('rerun').at(-1)!;equal(run.causes[0]!.origin,nav.origin)}finally{dispose();release()}
})
add('graph-initial-and-visits','Initial navigations emit graph records but do not count toward growth; graphSize walks live roots and graph edges.',()=>{
 if(!isDev)return
 const release=attribution.enable({...quiet,graphGrowth:{visits:3,ratio:1.1}});const records:unknown[]=[];const off=OBSERVE!.records.subscribe('graph',e=>records.push(e));let dispose!:()=>void
 try{createRoot(d=>{dispose=d;const[r]=createSignal(0);createMemo(r)});const size=graphSize();ok(size.owners>0&&size.computations>0&&size.signals>0&&size.edges>0);OBSERVE!.attribution.withOrigin({kind:'navigation',initial:true,name:'/root',to:'/root'},()=>{});equal(records.length,1);equal(attribution.history('navigation').at(-1)!.initial,true);dispose();const smaller=graphSize();ok(smaller.owners<size.owners)}finally{dispose();off();release()}
})
}
export const attributionCases=cases
