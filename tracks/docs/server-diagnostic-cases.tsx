import {OBSERVE,createSignal,createStore,createOptimistic,createOptimisticStore,createMemo,flush,Loading,Errored,Reveal,lazy} from 'solid-js'
import {isServer,isDev,render,hydrate,renderToString,renderToStream,dynamic,useHead,type JSX} from '@solidjs/web'
import {equal,ok,type DocCase} from './registry'
import {ticks,deferred} from '../../harness/timing'
const cases: DocCase[] = []
function doc(id:string,statement:string,run:DocCase['run']) {cases.push({id:'08/server-diagnostic-'+id,file:'08-dev-diagnostics.md',statement,run})}
async function capture(code:string,positive:boolean,run:()=>unknown|Promise<unknown>,count=1) {
  const session = OBSERVE?.diagnostics.capture()
  const warn=console.warn,error=console.error,info=console.info
  const messages:string[]=[]
  console.warn=console.error=console.info=(...args:unknown[])=>{messages.push(args.map(String).join(' '))}
  try {await run(); await ticks(2); const found=session?.events.filter(e=>e.code===code) ?? []; equal(found.length,(positive&&(isDev||!!OBSERVE&&['SSR_SUBTREE_ABANDONED','SSR_STREAM_ABANDONED','DYNAMIC_ASYNC_COMPONENT'].includes(code)))?count:0); for(const event of found){equal(event.kind,code==='SERVER_WRITE'?'write':['PRELOAD_DESCRIPTOR_INVALID','HEAD_TAG_INVALID'].includes(code)?'head':['UNRECOGNIZED_INSERT_VALUE','UNSCOPED_HOLE_ALLOCATED_IDS','LOWERCASE_EVENT_ATTRIBUTE'].includes(code)?'render':'ssr');if(code==='REVEAL_IN_RENDER_TO_STRING'){equal(event.data?.order,'together');equal(event.data?.collapsed,false)};if(code==='LAZY_ASSET_UNMAPPED')ok(['no-module-url','resolution-failed'].includes(String(event.data?.reason)));if(code==='SSR_CLIENT_CONTENT_MASKED'){ok(typeof event.data?.boundary==='string');ok(Number(event.data?.passes)>=2);ok(Number(event.data?.durationMs)>=0)};if(code!=='SSR_BOUNDARY_WATERFALL')equal(event.severity,code==='DYNAMIC_ASYNC_COMPONENT'?'error':'warn')};if(isDev&&positive&&code!=='SSR_BOUNDARY_WATERFALL') ok(messages.some(m=>m.includes('['+code+']')),code+' had no console face'); if(isDev&&positive&&code==='SSR_BOUNDARY_WATERFALL') {for(const e of found) {ok(Number(e.data?.passes)>=3);ok(typeof e.data?.boundary==='string');ok(Number(e.data?.sequentialMs)>=0); equal(e.severity,Number(e.data?.passes)>=4?'warn':'info'); equal(messages.some(m=>m.includes('[SSR_BOUNDARY_WATERFALL]')),Number(e.data?.passes)>=4)}} return found}
  finally {session?.stop(); console.warn=warn;console.error=error;console.info=info}
}
if(isServer) {
  doc('head-outside','L686: outside-render ignored registrations outside any server render.',async()=>{const events=await capture('HEAD_TAG_INVALID',true,()=>useHead({tag:'title',props:{children:'ignored'}}));if(isDev){equal(events[0]!.data?.reason,'outside-render');equal(events[0]!.data?.detail,undefined)}})
  doc('write-categories','Check (`warn`, dev only; once per process per `data.category`). A setter ran during a server render.',async()=>{
    await capture('SERVER_WRITE',false,()=>renderToString(()=>{createSignal(0);createStore({n:0});createOptimistic(0);return <span/>}))
    const writes=await capture('SERVER_WRITE',true,()=>renderToString(()=>{const [,signal]=createSignal(0);const [,store]=createStore({n:0});const [,optimistic]=createOptimistic(0);const [,optimisticStore]=createOptimisticStore({n:0});signal(1);signal(2);store(d=>{d.n=1});store(d=>{d.n=2});optimistic(1);optimisticStore(d=>{d.n=1});return <span/>}),3)
    if(isDev) equal(writes.map(e=>e.data?.category).sort(),['optimistic','signal','store'])
    await capture('SERVER_WRITE',false,()=>renderToString(()=>{const [,write]=createSignal(0);write(1);return <span/>}))
  })
  doc('write-inert-values','L635: Server setters mutate inert data without re-rendering the component.',async()=>{for(const family of ['signal','store','optimistic','optimistic-store']){let runs=0;function Part(){runs++;if(family==='signal'||family==='optimistic'){const[r,w]=family==='signal'?createSignal(0):createOptimistic(0);w(1);w(2);return <span>{r()}</span>};const[r,w]=family==='store'?createStore({n:0}):createOptimisticStore({n:0});w(d=>{d.n=1});w(d=>{d.n=2});return <span>{r.n}</span>};const html=renderToString(()=><Part/>);equal(runs,1);ok(html.includes(family.startsWith('optimistic')?'0':'2'),family+' '+html)}})
  doc('client-source-outside-error','L641: Server client-only pending reads without Loading throw in every tier and expose side:server alongside containment.',async()=>{function Part(){const value=createMemo(()=>Promise.resolve(1),{ssrSource:'client'});return <span>{value()}</span>};const capture=OBSERVE?.diagnostics.capture();try{let caught:unknown;try{renderToString(()=><Part/>)}catch(e){caught=e};ok(String(caught).includes('ASYNC_OUTSIDE_LOADING_BOUNDARY'),String(caught));const events=capture?.events.filter(e=>e.code==='ASYNC_OUTSIDE_LOADING_BOUNDARY')??[];equal(events.length,OBSERVE?1:0);for(const e of events){equal(e.kind,'async');equal(e.severity,'error');equal(e.data?.side,'server')};const html=renderToString(()=><Errored fallback={<b>contained</b>}><Part/></Errored>);ok(html.includes('contained'));const contained=capture?.events.filter(e=>e.code==='SSR_RENDER_ERROR_CONTAINED')??[];equal(contained.length,OBSERVE?1:0)}finally{capture?.stop()}})
  doc('waterfall-record-identity','L653: Discovery and sequential passes identify the same boundary as its record, duration and component location.',async()=>{const records:any[]=[];const off=OBSERVE?.records.subscribe('boundary',e=>records.push(e));function TraceApp(){return <Loading fallback='loading'><Child/></Loading>};function Child(){const a=createMemo(()=>Promise.resolve(1)),b=createMemo(()=>Promise.resolve(a()+1)),c=createMemo(()=>Promise.resolve(b()+1));return <span>{c()}</span>};try{const events=await capture('SSR_BOUNDARY_WATERFALL',true,async()=>{await renderToStream(()=><TraceApp/>)});if(isDev){equal(events[0]!.data?.passes,3);const record=records.find(e=>e.id===events[0]!.data?.boundary);ok(record,JSON.stringify(records));equal(record.passes,3);equal(record.durationMs,events[0]!.data?.sequentialMs);ok(events[0]!.ownerPath?.includes('<TraceApp>'),JSON.stringify(events[0]));ok(events[0]!.ownerPath?.includes('<Loading>'),JSON.stringify(events[0]))}}finally{off?.()}})
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

  doc('preload-all-fields','L680: PRELOAD_DESCRIPTOR_INVALID names invalid fields and values; links drop or fields filter according to rule.',async()=>{
    const rows:[unknown,string[],unknown,boolean,string?][]=[
      [null,['descriptor'],null,false], [{href:'/asset.js'},['as'],undefined,false], [{as:'video',href:'/asset.mp4'},['as'],'video',false], [{as:'script',href:''},['href','href'],'',false], [{as:'script',href:42},['href','href'],42,false],
      [{as:'script',href:'/asset.js',imagesrcset:'a.png 1x'},['imagesrcset'],undefined,true,'imagesrcset'], [{as:'image',href:'/asset.png',imagesrcset:42},['imagesrcset'],42,true,'imagesrcset'],[{as:'image',href:'/asset.png',imagesizes:42},['imagesizes'],42,true,'imagesizes'],[{as:'image',href:'/asset.png',imagesrcset:'a.png 640w'},['imagesizes'],'a.png 640w',true], [{as:'font',href:'/asset.woff2'},['crossorigin'],undefined,true], [{as:'fetch',href:'/asset.json'},['crossorigin'],undefined,true]
    ];
    for(const [descriptor,fields,value,ships,filtered] of rows){let html='';const events=await capture('PRELOAD_DESCRIPTOR_INVALID',true,async()=>{const Part=lazy(async()=>({default:()=> <span>rendered</span>}),undefined,'allpreloads.tsx');html=await renderToStream(()=><html><head/><body><Part/></body></html>,{manifest:()=>({js:[],css:[],preloads:[descriptor]}) as any})},fields.length);ok(html.includes('rendered'));ok(html.includes('rel="preload"')===ships,JSON.stringify(descriptor)+' output '+html.slice(0,700));if(filtered)ok(!html.includes(filtered+'='));if(isDev){equal(events.map(e=>e.data?.field),fields);equal(events[0]!.data?.value,value)}}
    for(const descriptor of [{as:'script',href:'/asset.js'},{as:'image',imagesrcset:'a.png 640w',imagesizes:'100vw'},{as:'font',href:'/asset.woff2',crossorigin:'anonymous'},{as:'fetch',href:'/asset.json',crossorigin:'use-credentials'}])await capture('PRELOAD_DESCRIPTOR_INVALID',false,async()=>{const Part=lazy(async()=>({default:()=> <span/>}),undefined,'validpreloads.tsx');await renderToStream(()=><Part/>,{manifest:()=>({js:[],css:[],preloads:[descriptor]}) as any})})
  })
  doc('lazy-resolution-metadata','L674: resolution-failed carries module id and original resolver error; missing mapping never prevents server component markup.',async()=>{const error=new Error('asset-resolver');let html='';const events=await capture('LAZY_ASSET_UNMAPPED',true,async()=>{const Part=lazy(async()=>({default:()=> <span>available</span>}),undefined,'badassets.tsx');html=await renderToStream(()=><Part/>,{manifest:()=>Promise.reject(error)})});ok(html.includes('available'));if(isDev){equal(events[0]!.data?.reason,'resolution-failed');equal(events[0]!.data?.id,'badassets.tsx');ok(events[0]!.data?.error===error)}})
  doc('head-invalid','Check (`warn`, dev only). The render could not honor a useHead registration.',async()=>{
    await capture('HEAD_TAG_INVALID',true,()=>renderToString(()=>{useHead({tag:'div',props:{}} as any);return <span/>}))
    await capture('HEAD_TAG_INVALID',true,()=>renderToString(()=>{useHead({tag:'meta',props:{'bad name':'x'}} as any);return <span/>}))
    await capture('HEAD_TAG_INVALID',true,()=>renderToString(()=>{useHead([{tag:'title',props:{children:'one'}},{tag:'title',props:{children:'two'}}]);return <span/>}))
    await capture('HEAD_TAG_INVALID',false,()=>renderToString(()=>{useHead({tag:'title',props:{children:'valid'}});return <span/>}))
  })
  doc('head-reasons','L686: HEAD_TAG_INVALID supplies each reason and offending detail; ignored registrations leave valid HTML.',async()=>{
    const propsError=new Error('head-props'),groupError=new Error('head-group');
    const rows:[string,unknown,()=>unknown][]=[
      ['non-head-tag',{tag:'div',props:{}},()=>renderToString(()=>{useHead({tag:'div',props:{}} as any);return <html><head/><body>valid</body></html>})],
      ['invalid-attribute','bad name',()=>renderToString(()=>{useHead({tag:'meta',props:{'bad name':'x'}} as any);return <html><head/><body>valid</body></html>})],
      ['props-error',propsError,()=>renderToString(()=>{useHead({tag:'title',props:{children:()=>{throw propsError}}});return <html><head/><body>valid</body></html>})],
      ['group-error',groupError,()=>renderToString(()=>{useHead(()=>{throw groupError});return <html><head/><body>valid</body></html>})],
      ['duplicate-title',2,()=>renderToString(()=>{useHead([{tag:'title',props:{children:'first'}},{tag:'title',props:{children:'last'}}]);return <html><head/><body>valid</body></html>})]

    ];
    for(const [reason,detail,run] of rows){let output:unknown;let events:Awaited<ReturnType<typeof capture>>;try{events=await capture('HEAD_TAG_INVALID',true,()=>{output=run()})}catch(e){throw new Error(reason+': '+String(e))};if(isDev){equal(events[0]!.data?.reason,reason);equal(events[0]!.data?.detail,detail)};if(typeof output==='string'){ok(output.includes('valid'));if(reason==='duplicate-title'){ok(/<title[^>]*>last<\/title>/.test(output),output);ok(!/<title[^>]*>first<\/title>/.test(output),output)}}}
    let html='';const events=await capture('HEAD_TAG_INVALID',true,async()=>{const gate=deferred<number>();function Delayed(){const value=createMemo(()=>gate.promise);const settled=value();useHead({tag:'base',props:{href:'/base-'+settled}});return <span>{settled}</span>};const out=renderToStream(()=><html><head/><body><Loading fallback={<i>waiting</i>}><Delayed/></Loading></body></html>);const reader=out.readable.getReader();const decoder=new TextDecoder();const first=await reader.read();html=decoder.decode(first.value);gate.resolve(1);for(;;){const chunk=await reader.read();if(chunk.done)break;html+=decoder.decode(chunk.value)}});ok(html.includes('1'));ok(!html.includes('<base'),html);if(isDev){equal(events[0]!.data?.reason,'after-shell-flush');equal(events[0]!.data?.detail,'base')}
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
doc('unrecognized-value','L692: plain object and symbol insertions are skipped on both faces with type/value metadata.',async()=>{
  for(const value of [{bad:true},Symbol('bad')]){let html='';const App=()=> <div>{value as any}</div>;const events=await capture('UNRECOGNIZED_INSERT_VALUE',!(isServer&&typeof value==='symbol'),()=>{if(isServer){html=renderToString(App);return}const el=document.createElement('div');const dispose=render(App,el);html=el.innerHTML;dispose()});ok(!html.includes('[object Object]'));if(isDev&&!(isServer&&typeof value==='symbol')){equal(events[0]!.data?.type,typeof value);equal(events[0]!.data?.value,value)}}
  await capture('UNRECOGNIZED_INSERT_VALUE',false,()=>{const App=()=> <div>valid{42}{false}{null}</div>;if(isServer){renderToString(App);return}const el=document.createElement('div');const dispose=render(App,el);dispose()})
})
if(!isServer) doc('head-duplicate-client','L686: Client head resolution diagnoses duplicate titles and keeps the last one.',async()=>{const target=document.createElement('div'),original=document.title;let title='';try{const events=await capture('HEAD_TAG_INVALID',true,async()=>{const close=render(()=>{useHead([{tag:'title',props:{children:'first-title'}},{tag:'title',props:{children:'last-title'}}]);return <span>body</span>},target);flush();await ticks(3);title=document.title;close()});equal(title,'last-title');if(isDev){equal(events[0]!.data?.reason,'duplicate-title');equal(events[0]!.data?.detail,2)}}finally{document.title=original}})
if(!isServer) doc('lowercase-event','L708: compiled, spread and hydrated lowercase callback attributes stringify rather than bind; warn once per name.',async()=>{
  // @ts-expect-error Deliberate documented JavaScript-only lowercase JSX attribute misuse.
  for(const [name,App] of [['onclick',()=> <button {...{onclick:()=>{throw new Error('not an event')}} as any}/>],['onmousedown',()=> <button onmousedown={(()=>{throw new Error('not an event')}) as any}/>],['on:click',()=> <button {...{'on:click':()=>{throw new Error('not an event')}} as any}/>]] as const){const el=document.createElement('div');const events=await capture('LOWERCASE_EVENT_ATTRIBUTE',true,()=>{const dispose=render(App,el);const button=el.firstElementChild!;ok(button.getAttribute(name)?.includes('not an event'));button.dispatchEvent(new Event(name.includes('mousedown')?'mousedown':'click'));dispose()});if(isDev){equal(events[0]!.data?.name,name);equal(events[0]!.data?.handler,name==='onmousedown'?'onMousedown':'onClick');equal(events[0]!.data?.tag,'button')}}
  await capture('LOWERCASE_EVENT_ATTRIBUTE',false,()=>{const el=document.createElement('div');const dispose=render(()=><button {...{onclick:()=>{}} as any}/>,el);dispose()})
  await capture('LOWERCASE_EVENT_ATTRIBUTE',false,()=>{let ran=0;const el=document.createElement('div');const dispose=render(()=><button onClick={()=>ran++}/>,el);el.querySelector('button')!.click();equal(ran,1);dispose()})
  await capture('LOWERCASE_EVENT_ATTRIBUTE',false,()=>{const el=document.createElement('div');const dispose=render(()=><button {...{onkeyup:'void 0'} as any}/>,el);equal(el.firstElementChild!.getAttribute('onkeyup'),'void 0');dispose()})
})
export const serverDiagnosticCases=cases
