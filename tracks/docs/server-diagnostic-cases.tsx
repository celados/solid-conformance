import {OBSERVE,createSignal,createStore,createOptimistic,createOptimisticStore,createMemo,Loading,Errored,Reveal,lazy} from 'solid-js'
import {isServer,isDev,render,renderToString,renderToStream,dynamic,useHead,type JSX} from '@solidjs/web'
import {equal,ok,type DocCase} from './registry'
import {ticks,deferred} from '../../harness/timing'
const cases: DocCase[] = []
function doc(id:string,statement:string,run:DocCase['run']) {cases.push({id:'08/server-diagnostic-'+id,file:'08-dev-diagnostics.md',statement,run})}
async function capture(code:string,positive:boolean,run:()=>unknown|Promise<unknown>,count=1) {
  const session = OBSERVE?.diagnostics.capture()
  const warn=console.warn,error=console.error,info=console.info
  const messages:string[]=[]
  console.warn=console.error=console.info=(...args:unknown[])=>{messages.push(args.map(String).join(' '))}
  try {await run(); await ticks(2); const found=session?.events.filter(e=>e.code===code) ?? []; equal(found.length,isDev&&positive?count:0); if(isDev&&positive&&code!=='SSR_BOUNDARY_WATERFALL') ok(messages.some(m=>m.includes('['+code+']')),code+' had no console face'); if(isDev&&positive&&code==='SSR_BOUNDARY_WATERFALL') {for(const e of found) {ok(Number(e.data?.passes)>=3); equal(e.severity,Number(e.data?.passes)>=4?'warn':'info'); equal(messages.some(m=>m.includes('[SSR_BOUNDARY_WATERFALL]')),Number(e.data?.passes)>=4)}} return found}
  finally {session?.stop(); console.warn=warn;console.error=error;console.info=info}
}
if(isServer) {
  doc('write-categories','Check (`warn`, dev only; once per process per `data.category`). A setter ran during a server render.',async()=>{
    await capture('SERVER_WRITE',false,()=>renderToString(()=>{createSignal(0);createStore({n:0});createOptimistic(0);return <span/>}))
    const writes=await capture('SERVER_WRITE',true,()=>renderToString(()=>{const [,signal]=createSignal(0);const [,store]=createStore({n:0});const [,optimistic]=createOptimistic(0);const [,optimisticStore]=createOptimisticStore({n:0});signal(1);signal(2);store(d=>{d.n=1});store(d=>{d.n=2});optimistic(1);optimisticStore(d=>{d.n=1});return <span/>}),3)
    if(isDev) equal(writes.map(e=>e.data?.category).sort(),['optimistic','signal','store'])
    await capture('SERVER_WRITE',false,()=>renderToString(()=>{const [,write]=createSignal(0);write(1);return <span/>}))
  })
  doc('reveal-sync','Check (`warn`, dev only). renderToString has no stream to coordinate reveal order on.',async()=>{
    await capture('REVEAL_IN_RENDER_TO_STRING',true,()=>renderToString(()=><Reveal><Reveal order='together'><span/></Reveal></Reveal>))
    await capture('REVEAL_IN_RENDER_TO_STRING',false,()=>renderToString(()=><Reveal><Reveal order='natural'><span/></Reveal></Reveal>))
  })
  doc('waterfall','Same thresholds: two waits (`passes: 3`) are info, structured-channel only; three or more earn the console warn.',async()=>{
    await capture('SSR_BOUNDARY_WATERFALL',true,async()=>{function Part(){const a=createMemo(()=>Promise.resolve(1));const b=createMemo(()=>Promise.resolve(a()+1));const c=createMemo(()=>Promise.resolve(b()+1));return <span>{c()}</span>}await renderToStream(()=><Loading fallback={<i/>}><Part/></Loading> )})
    await capture('SSR_BOUNDARY_WATERFALL',false,async()=>{function Part(){const a=createMemo(()=>Promise.resolve(1));return <span>{a()}</span>}await renderToStream(()=><Loading fallback={<i/>}><Part/></Loading>)})
  })
  doc('client-masked','A client-only read found on the first pass is the well-behaved case — the boundary hands off with the shell, nothing extra is paid, no finding.',async()=>{
    function Part(props:{masked:boolean}){const server=createMemo(()=>Promise.resolve(1));const client=createMemo(()=>Promise.resolve(2),{ssrSource:'client'});if(props.masked) {server(); return <span>{client()}</span>} client(); return <span>{server()}</span>}
    await capture('SSR_CLIENT_CONTENT_MASKED',true,async()=>{await renderToStream(()=><Loading fallback={<i/>}><Part masked/></Loading>)})
    await capture('SSR_CLIENT_CONTENT_MASKED',false,async()=>{await renderToStream(()=><Loading fallback={<i/>}><Part masked={false}/></Loading>)})
  })
  doc('stream-abandoned','The response stream was abandoned mid-render; the render was torn down.',async()=>{
    await capture('SSR_STREAM_ABANDONED',true,async()=>{function Part(){const n=createMemo(()=>new Promise<number>(()=>{}));return <span>{n()}</span>}const reader=renderToStream(()=><Loading fallback={<i/>}><Part/></Loading>).readable.getReader();await reader.read();await reader.cancel()})
    await capture('SSR_STREAM_ABANDONED',false,async()=>{await renderToStream(()=><span>finished</span>)})
  })
  doc('subtree-abandoned','A failed fragment discarded its still-pending subtree.',async()=>{
    function Stuck(){const n=createMemo(()=>new Promise<number>(()=>{}));return <p>{n()}</p>}
    async function run(nested:boolean){const gate=deferred<number>();function Child(){const bad=createMemo(()=>gate.promise);return <div>{bad()}{nested&&<Loading fallback={<i>nested</i>}><Stuck/></Loading>}</div>};const out=renderToStream(()=><Errored fallback={(_e)=><b>caught</b>}><Loading fallback={<i/>}><Child/></Loading></Errored>,{onError(){}}); const done=Promise.resolve(out);await ticks(2);gate.reject(new Error('fragment-failed'));await done}
    await capture('SSR_SUBTREE_ABANDONED',true,()=>run(true))
    await capture('SSR_SUBTREE_ABANDONED',false,()=>run(false))
  })
  doc('lazy-unmapped','Check (`warn`, dev only). Client assets for a lazy() component could not be mapped.',async()=>{
    await capture('LAZY_ASSET_UNMAPPED',true,async()=>{const Part=lazy(async()=>({default:()=> <span/>}));await renderToStream(()=><Loading fallback={<i/>}><Part/></Loading>,{manifest:{}})})
    await capture('LAZY_ASSET_UNMAPPED',false,async()=>{const Part=lazy(async()=>({default:()=> <span/>}),undefined,'mapped.tsx');await renderToStream(()=><Loading fallback={<i/>}><Part/></Loading>,{manifest:{'mapped.tsx':{file:'mapped.js'}}})})
  })
  doc('preload-descriptor','registerAsset("preload") requires an as destination. (and the other field rules)',async()=>{
    async function run(invalid:boolean){const Part=lazy(async()=>({default:()=> <span/>}),undefined,'preload.tsx');await renderToStream(()=><Part/>,{manifest:()=>({js:[],css:[],preloads:invalid?[{as:'script'},{as:'video',href:'/v.mp4'}]:[{as:'script',href:'/valid.js'}]}) as any})}
    await capture('PRELOAD_DESCRIPTOR_INVALID',true,()=>run(true),2);await capture('PRELOAD_DESCRIPTOR_INVALID',false,()=>run(false))
  })
  doc('head-invalid','Check (`warn`, dev only). The render could not honor a useHead registration.',async()=>{
    await capture('HEAD_TAG_INVALID',true,()=>renderToString(()=>{useHead({tag:'div',props:{}} as any);return <span/>}))
    await capture('HEAD_TAG_INVALID',true,()=>renderToString(()=>{useHead({tag:'meta',props:{'bad name':'x'}} as any);return <span/>}))
    await capture('HEAD_TAG_INVALID',true,()=>renderToString(()=>{useHead([{tag:'title',props:{children:'one'}},{tag:'title',props:{children:'two'}}]);return <span/>}))
    await capture('HEAD_TAG_INVALID',false,()=>renderToString(()=>{useHead({tag:'title',props:{children:'valid'}});return <span/>}))
  })
  doc('dynamic-async','A source may stay async when it resolves to a server component or a serializable value (a tag name).',async()=>{
    await capture('DYNAMIC_ASYNC_COMPONENT',true,async()=>{const Part=dynamic(()=>Promise.resolve(()=> <b>forbidden</b>));const errors:unknown[]=[];const html=await renderToStream(()=><Loading fallback={<i/>}><Errored fallback={(_e)=><b>caught</b>}><Part/></Errored></Loading>,{onError(e){errors.push(e)}});ok(!html.includes('forbidden'));ok(errors.some(e=>String(e).includes('DYNAMIC_ASYNC_COMPONENT')))})
    await capture('DYNAMIC_ASYNC_COMPONENT',false,async()=>{const Part=dynamic(()=>Promise.resolve('article'));const html=await renderToStream(()=><Loading fallback={<i/>}><Part>valid</Part></Loading>);ok(html.includes('article'))})
  })
  doc('unscoped-hole','Unscoped allocation alone is not the finding: a function hole with nothing scoped after it in its template lands on the same ids on both sides and stays silent.',async()=>{
    function Bad(props:any){const renderHead=()=>props.header;return <div><header>{renderHead as unknown as JSX.Element}</header><main>{props.children}</main></div>}
    function Good(props:any){const renderHead=()=>props.header;return <div><header>{renderHead()}</header><main>{props.children}</main></div>}
    await capture('UNSCOPED_HOLE_ALLOCATED_IDS',true,()=>renderToString(()=><Bad header={<span>header</span>}><b>child</b></Bad>))
    function NoFollowingScope(props:any){const renderHead=()=>props.header;return <header>{renderHead as unknown as JSX.Element}</header>}
    await capture('UNSCOPED_HOLE_ALLOCATED_IDS',false,()=>renderToString(()=><NoFollowingScope header={<span>header</span>}/>))
    await capture('UNSCOPED_HOLE_ALLOCATED_IDS',false,()=>renderToString(()=><Good header={<span>header</span>}><b>child</b></Good>))
  })
}
doc('unrecognized-value','Value at an insert position the renderer cannot render; skipped (dev; server and client)',async()=>{
  async function view(invalid:boolean){const App=()=> <div>{invalid?({bad:true} as any):'valid'}</div>;if(isServer){renderToString(App);return}const el=document.createElement('div');const dispose=render(App,el);dispose()}
  await capture('UNRECOGNIZED_INSERT_VALUE',true,()=>view(true));await capture('UNRECOGNIZED_INSERT_VALUE',false,()=>view(false))
})
if(!isServer) doc('lowercase-event','Check (`warn`, dev only; kind render; client, once per attribute name).',async()=>{
  await capture('LOWERCASE_EVENT_ATTRIBUTE',true,()=>{const el=document.createElement('div');const dispose=render(()=><button {...{onclick:()=>{}} as any}/>,el);dispose()})
  await capture('LOWERCASE_EVENT_ATTRIBUTE',false,()=>{const el=document.createElement('div');const dispose=render(()=><button onClick={()=>{}}/>,el);dispose()})
})
export const serverDiagnosticCases=cases
