import {
	createRoot, createSignal, createMemo, createEffect, createRenderEffect, onCleanup, onSettled,
	flush, untrack, runWithOwner, createContext, useContext, createStore, createProjection,
	deep, snapshot, merge, omit, reconcile, action, createOptimistic, createOptimisticStore,
	resolve, until, refresh, affects, isPending, latest,
} from 'solid-js'
import * as Solid from 'solid-js'
const storePath = (Solid as unknown as { storePath: typeof import('@solidjs/signals').storePath }).storePath
import { isDev } from '@solidjs/web'
import { deferred, controlledIterable, ticks } from '../../harness/timing'
import { equal, ok, throws, type DocCase } from './registry'

async function root<T>(setup: () => T, check: (state: T) => unknown | Promise<unknown>) {
	let dispose!: () => void
	const state = createRoot(d => { dispose = d; return setup() })
	let timer: ReturnType<typeof setTimeout> | undefined
	try { await Promise.race([check(state), new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Statement did not settle within 1500ms')),1500)})]) }
	finally { clearTimeout(timer); dispose(); await ticks(2) }
}
const files = {
	'01': '01-reactivity-batching-effects.md', '02': '02-signals-derived-ownership.md',
	'04': '04-stores.md', '05': '05-async-data.md', '06': '06-actions-optimistic.md', '08': '08-dev-diagnostics.md',
} as const
const cases: DocCase[] = []
function doc(chapter: keyof typeof files, name: string, statement: string, run: DocCase['run']) {
	cases.push({ id: `${chapter}/${name}`, file: files[chapter], statement, run })
}

doc('01', 'flush-reads', 'After calling a setter, reads continue to return the last committed value until the batch is flushed.', () => root(() => createSignal(0), ([read, write]) => { write(1); equal(read(), 0); flush(); equal(read(), 1) }))
doc('01', 'microtask', 'Updates are applied on the next microtask by default.', () => root(() => createSignal(0), async ([read, write]) => { write(1); await ticks(1); equal(read(), 1) }))
doc('01', 'flush-callback', "The callback's return value is preserved, and nested flush(fn) calls drain at each level.", () => root(() => createSignal(0), ([read, write]) => { const result = flush(() => { write(1); flush(() => write(2)); equal(read(), 2); return 7 }); equal(result, 7); equal(read(), 2) }))
doc('01', 'effects-order', 'Running all tracking halves of effects before any effect halves gives a clear dependency picture before side effects run.', async () => {
	const log: string[] = []
	await root(() => { const pair = createSignal(0); for (const label of ['a','b']) createEffect(() => { log.push('compute-' + label); return pair[0]() }, () => { log.push('apply-' + label) }); return pair }, ([, write]) => { flush(); log.length = 0; write(1); flush(); equal(log, ['compute-a','compute-b','apply-a','apply-b']) })
})
doc('01', 'effect-prev-cleanup', 'The compute function receives prev as its argument (undefined on first run).', async () => {
	const computed: unknown[] = [], applied: unknown[] = [], cleanup: number[] = []
	await root(() => { const pair = createSignal(0); createEffect<number>(prev => { computed.push(prev); return pair[0]() }, (v,p) => { applied.push([v,p]); return () => { cleanup.push(v) } }); return pair }, ([, write]) => { flush(); write(1); flush(); equal(computed, [undefined,0]); equal(applied, [[0,undefined],[1,0]]); equal(cleanup,[0]) }); equal(cleanup,[0,1])
})
doc('01', 'effect-defer', 'Run on next change only (skip initial).', () => root(() => { const pair = createSignal(0); const seen: number[] = []; createEffect(pair[0], v => { seen.push(v) }, { defer: true }); return { pair, seen } }, s => { flush(); equal(s.seen, []); s.pair[1](2); flush(); equal(s.seen,[2]) }))
doc('01', 'lazy-memo', 'The lazy option defers the initial computation until the value is first read.', () => root(() => { let runs = 0; const read = createMemo(() => ++runs, { lazy: true }); return { read, runs: () => runs } }, s => { equal(s.runs(),0); equal(s.read(),1) }))
doc('01', 'eager-memo', 'Without lazy, memos compute eagerly on creation.', () => root(() => { let runs=0; createMemo(() => ++runs); return () => runs }, read => equal(read(),1)))
doc('01', 'render-effect', 'createRenderEffect runs during the render phase synchronously as DOM elements are created.', () => root(() => { let count=0; createRenderEffect(() => 7, v => { count=v }); return count }, value => equal(value,7)))
doc('01', 'settled-cleanup', 'onSettled replaces onMount: run logic when the current activity is settled.', async () => { const log: string[]=[]; await root(() => { onSettled(() => { log.push('settled'); return () => { log.push('cleanup') } }) }, async () => { await ticks(2); equal(log,['settled']) }); equal(log,['settled','cleanup']) })
doc('01', 'unobserved', 'An unobserved callback fires when the signal/memo loses all subscribers.', async () => { let times=0; await root(() => { const [read]=createSignal(0,{unobserved:()=>{times++}}); createEffect(read,()=>{}); }, () => { flush(); equal(times,0) }); equal(times,1) })

doc('02', 'owned-roots', 'A root created inside an existing owned scope is itself owned by that parent.', async () => { const log: string[]=[]; await root(() => { onCleanup(()=>{log.push('parent')}); createRoot(()=> { onCleanup(()=>{log.push('child')}) }) },()=>{}); equal(log,['child','parent']) })
doc('02', 'cleanup-lifo', 'Within one owner later registrations run before earlier ones.', async () => { const log:number[]=[]; await root(() => { onCleanup(()=>{log.push(1)}); onCleanup(()=>{log.push(2)}) },()=>{}); equal(log,[2,1]) })
doc('02', 'detached-root', 'Detach explicitly with runWithOwner(null, ...).', async () => { let disposed=false, close!:()=>void; await root(() => { runWithOwner(null,()=>createRoot(d=>{close=d; onCleanup(()=>{disposed=true})})) },()=>{}); equal(disposed,false); close(); equal(disposed,true) })
doc('02', 'context-missing', 'useContext throws ContextNotFoundError at runtime if no Provider is mounted.', () => root(() => { const ctx=createContext<number>(); return equal((throws(()=>useContext(ctx)) as Error).constructor.name, 'ContextNotFoundError') }, () => {}))
doc('02', 'context-default', 'useContext falls back to defaultValue outside any Provider.', () => root(()=>useContext(createContext('light')),v=>equal(v,'light')))
doc('02', 'writable-derived', 'A write on its own never re-runs the function.', () => root(() => { const [source,setSource]=createSignal(1); let calls=0; const [read,write]=createSignal((prev=0)=>{calls++; return source()+prev}); return {read,write,setSource,calls:()=>calls} }, s=> { s.write(10); flush(); equal(s.calls(),1); equal(s.read(),10); s.setSource(2); flush(); equal(s.calls(),2); equal(s.read(),12) }))
doc('02', 'derived-store', 'createStore(fn, seed) creates a derived store driven by mutation in fn(draft).', () => root(() => { const [read,write]=createSignal(1); const [s,set]=createStore(d=>{d.value=read()},{value:0,local:false}); return {s,set,write} }, x=>{equal(snapshot(x.s),{value:1,local:false});x.set(d=>{d.local=true});flush();x.write(2);flush();equal(snapshot(x.s),{value:2,local:true})}))

doc('04', 'draft-first', 'The primary store update form is a setter that receives a mutable draft.', () => root(()=>createStore({value:1,list:[1]}), ([s,set])=>{set(d=>{d.value=2;d.list.push(2)});flush();equal(snapshot(s),{value:2,list:[1,2]})}))
doc('04', 'object-return', 'Returning a value performs a shallow replacement/diff.', () => root(()=>createStore({a:1,b:{value:2}}),([s,set])=>{set(()=>({a:3,b:{value:4}}));flush();equal(snapshot(s),{a:3,b:{value:4}})}))
doc('04', 'array-return', 'Returning a value performs a shallow replacement/diff.', () => root(()=>createStore([1,2,3]),([s,set])=>{set(d=>d.filter(v=>v!==2));flush();equal(snapshot(s),[1,3])}))
doc('04', 'merge-undefined', 'undefined is a value, not missing.',()=>equal(merge({a:1},{a:undefined}).a,undefined))
doc('04', 'omit-view', 'Use omit to create a view without the listed keys.',()=>{const v=omit({a:1,b:2,c:3},'a','b');equal(v.c,3);equal('a' in v,false);equal(Object.keys(v),['c'])})
doc('04', 'keyed-reconcile', 'reconcile preserves identity for unchanged entries.', () => root(()=>createStore([{id:1,v:1},{id:2,v:2}]),([s,set])=>{const first=s[0];set(d=>{reconcile([{id:2,v:3},{id:1,v:1}],'id')(d)});flush();equal(s[1]===first,true);equal(snapshot(s),[{id:2,v:3},{id:1,v:1}])}))
doc('04', 'positional-reconcile', 'Pass null for positional matching.', () => root(()=>createStore([{id:1,v:1}]),([s,set])=>{const first=s[0];set(d=>{reconcile([{id:2,v:3}],null)(d)});flush();equal(s[0]===first,true);equal(snapshot(s),[{id:2,v:3}])}))
doc('04', 'readonly-projection', 'createProjection returns only the store.', () => root(()=>createProjection(()=>({a:1}),{a:0}),s=>equal(snapshot(s),{a:1})))
doc('04', 'projection-late-write', 'The draft stays valid until the next run or disposal.', () => root(()=>{let draft!:{a:number};const s=createProjection(d=>{draft=d},{a:0});return {s,write:(v:number)=>{draft.a=v}}},async x=>{x.write(2);await ticks(2);equal(snapshot(x.s),{a:2})}))
doc('04', 'stale-draft', 'Writes through a superseded or disposed draft are dropped silently.',async()=>{const drafts:{a:number}[]=[];let late!:()=>void;await root(()=>{const [id,set]=createSignal(0);const s=createProjection(d=>{d.a=id();drafts.push(d)},{a:0});return {s,set}},x=>{x.set(1);flush();drafts[0]!.a=99;flush();equal(snapshot(x.s),{a:1});late=()=>{drafts.at(-1)!.a=77}});late()})
doc('04', 'shallow-references', 'Values under root keys are plain records replaced by reference.',()=>root(()=>{const item={n:1};const pair=createStore([item],{shallow:true});return {pair,item}},x=>{const [s,set]=x.pair;equal(s[0]===x.item,true);set(d=>{d[0]={n:2}});flush();equal(s[0]!.n,2)}))
doc('04', 'deep-snapshot', 'deep subscribes to every nested property and returns a plain snapshot.',()=>root(()=>{const pair=createStore({child:{n:1}});const seen:unknown[]=[];createEffect(()=>deep(pair[0]),v=>{seen.push(v)});return {pair,seen}},x=>{flush();x.pair[1](d=>{d.child.n=2});flush();equal(x.seen,[{child:{n:1}},{child:{n:2}}])}))
doc('04', 'snapshot-untracked', 'snapshot produces a non-reactive plain value suitable for serialization.',()=>root(()=>{const pair=createStore({n:1});const seen:unknown[]=[];createEffect(()=>snapshot(pair[0]),v=>{seen.push(v)});return {pair,seen}},x=>{flush();x.pair[1](d=>{d.n=2});flush();equal(x.seen,[{n:1}]);equal(JSON.stringify(snapshot(x.pair[0])), '{"n":2}')}))
doc('04', 'store-path', 'storePath supports indices, filters, ranges and a delete sentinel.',()=>root(()=>createStore({items:[0,0,0],nickname:'x'}),([s,set])=>{set(storePath('items',{from:0,to:2,by:2},9));set(storePath('nickname',storePath.DELETE));flush();equal(snapshot(s),{items:[9,0,9]})}))

doc('05', 'promise-resolution', 'Consumers read the accessor as usual if it is not ready the read follows Loading.',()=>root(()=>{const gate=deferred<number>();const read=createMemo(()=>gate.promise);return {gate,read}},async s=>{const pending=resolve(s.read);s.gate.resolve(7);equal(await pending,7)}))
doc('05', 'iterable-values', 'Computations can return AsyncIterables.',()=>root(()=>{const stream=controlledIterable<number>();const read=createMemo(()=>stream.iterable);return {read,stream}},async s=>{s.stream.push(1);equal(await resolve(s.read),1);s.stream.push(2);await ticks(2);equal(untrack(s.read),2)}))
doc('05', 'loading-value', 'The node is born committed with the declared value.',()=>root(()=>{const gate=deferred<number>();const read=createMemo(()=>gate.promise,{loadingValue:3});return {gate,read}},async s=>{equal(untrack(s.read),3);equal(isPending(s.read),false);s.gate.resolve(7);await ticks(2);equal(untrack(s.read),7)}))
doc('05', 'seed-loading-value', 'Store-family sources declare seedLoadingValue true.',()=>root(()=>{const gate=deferred<{value:number}>();const s=createProjection(()=>gate.promise,{value:3},{seedLoadingValue:true});return {gate,s}},async x=>{equal(snapshot(x.s),{value:3});x.gate.resolve({value:7});await ticks(2);equal(snapshot(x.s),{value:7})}))
doc('05', 'refresh-delivery', 'Accessor targets resolve with the settled value.',()=>root(()=>{let calls=0;const read=createMemo(()=>Promise.resolve(++calls));return {read}},async x=>{equal(await resolve(x.read),1);equal(await refresh(x.read),2)}))
doc('05', 'refresh-quiet', 'A bare refresh is quiet: isPending stays false.',()=>root(()=>{const gates=[deferred<number>(),deferred<number>()];let n=0;const read=createMemo(()=>gates[n++]!.promise);return {read,gates}},async x=>{x.gates[0]!.resolve(1);await resolve(x.read);const pending=refresh(x.read);flush();equal(isPending(x.read),false);x.gates[1]!.resolve(2);equal(await pending,2)}))
doc('05', 'refresh-quiescence', 'If a second refresh supersedes this one mid-flight the promise waits for whatever finally lands.',()=>root(()=>{const gates=[deferred<number>(),deferred<number>(),deferred<number>()];let n=0;const read=createMemo(()=>gates[n++]!.promise);return {read,gates}},async x=>{x.gates[0]!.resolve(0);await resolve(x.read);const first=refresh(x.read);await ticks(2);const second=refresh(x.read);await ticks(2);x.gates[2]!.resolve(2);equal(await first,2);equal(await second,2);x.gates[1]!.resolve(99);await ticks(2);equal(untrack(x.read),2)}))
doc('05', 'resolve-rejection', 'Async errors propagate through the reactive graph.',()=>root(()=>{const gate=deferred<number>();const read=createMemo(()=>gate.promise);return {read,gate}},async x=>{const result=resolve(x.read).then(()=>false,e=>String(e).includes('expected'));x.gate.reject(new Error('expected'));equal(await result,true)}))
doc('05', 'effect-error', 'createEffect accepts an EffectBundle with effect and error handlers.',()=>root(()=>{const gate=deferred<number>();let errors=0;createEffect(()=>gate.promise,{effect:()=>{},error:()=>{errors++}});return {gate,errors:()=>errors}},async x=>{x.gate.reject(new Error('expected'));await ticks(3);equal(x.errors(),1)}))

doc('06', 'action-return', 'action wraps a generator and returns an async function.',()=>root(()=>action(function*(){yield Promise.resolve();return 7}),async run=>equal(await run(),7)))
doc('06', 'action-rejection', 'Failure throws back at the yield point.',()=>root(()=>action(function*(){yield Promise.reject(new Error('expected'))}),async run=>equal(await run().then(()=>false,e=>String(e).includes('expected')),true)))
for(const primitive of ['signal','store'] as const) for(const fail of [false,true]) doc('06',`overlay-${primitive}-${fail?'failure':'success'}`,'Optimistic primitives reset to their source when the transition completes.',()=>root(()=>{const gate=deferred<void>();const [value,set]=createOptimistic(0);const [store,write]=createOptimisticStore({n:0});const run=action(function*(){if(primitive==='signal')set(7);else write(d=>{d.n=7});yield gate.promise});return {value,store,gate,run}},async x=>{const done=x.run().catch(e=>e);await ticks(2);equal(untrack(x.value)+(snapshot(x.store).n),7);if(fail)x.gate.reject(new Error('expected'));else x.gate.resolve();await done;await ticks(2);equal(untrack(x.value)+snapshot(x.store).n,0)}))
doc('06', 'until-truthy', 'Falsy results keep waiting; until resolves the first truthy settle.',()=>root(()=>createSignal(0),async ([read,write])=>{let done=false;const wait=until(read,{timeout:500}).then(v=>{done=true;return v});flush();equal(done,false);write(2);flush();equal(await wait,2)}))
doc('06', 'until-timeout', 'until rejects on timeout with TimeoutError.',()=>root(()=>createSignal(false),async ([read])=>{const e=await until(read,{timeout:10}).catch(e=>e);equal(e.name,'TimeoutError')}))
doc('06', 'until-abort', 'until rejects on signal abort with the signal reason.',()=>root(()=>createSignal(false),async ([read])=>{const controller=new AbortController();const wait=until(read,{signal:controller.signal}).catch(e=>e);controller.abort('stop');equal(await wait,'stop')}))
doc('06', 'until-authority', 'Your own tentative write can never satisfy your own ack.',()=>root(()=>{const [read,set]=createOptimistic(0);let confirmed=false;const run=action(function*(){set(7);yield until(()=>read()===7,{timeout:20});confirmed=true});return {read,run,confirmed:()=>confirmed}},async x=>{await x.run().catch(()=>{});equal(x.confirmed(),false);equal(untrack(x.read),0)}))
doc('06', 'affects-readability', 'Marked data reads pending while values themselves stay readable throughout.',()=>root(()=>{const [read]=createSignal(1);const gate=deferred<void>();const run=action(function*(){affects(read);yield gate.promise});return {read,gate,run}},async x=>{const done=x.run();await ticks(2);equal(isPending(x.read),true);equal(untrack(x.read),1);x.gate.resolve();await done;equal(isPending(x.read),false)}))

// Diagnostic errors throw without console-warning side channels.
doc('08', 'owned-write', 'Writing inside owned scope throws in dev.',()=>{if(!isDev)return;throws(()=>createRoot(()=>{const [,set]=createSignal(0);set(1)}),'REACTIVE_WRITE_IN_OWNED_SCOPE')})
doc('08', 'owned-write-opt-in', 'ownedWrite is the narrow opt-in for internal state.',()=>root(()=>{const [read,set]=createSignal(0,{ownedWrite:true});set(1);return read}, read=>{flush();equal(untrack(read),1)}))
export const coreCases = cases
