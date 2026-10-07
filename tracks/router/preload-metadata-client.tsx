import {createMemo,Loading} from 'solid-js'
import {render} from '@solidjs/web'
import {createServerReference,GET,withMeta,serverFunctionUrl} from '@solidjs/web/server-functions/client'
import {createRouter,memoryHistory,query,useNavigate,usePreloadRoute,useParams,revalidate} from '@solidjs/router'
import {ticks} from '../../harness/timing'
// RFC10 L186: GET metadata supplies a cacheable URL; route preloading warms the same query.
const bare=createServerReference('router-meta-read') as ReturnType<typeof createServerReference> & ((n:number)=>Promise<number>)
const readRef=GET(withMeta(bare,{requiresAuth:true}))
Object.defineProperty(readRef,'GET',{get(){throw new Error('obsolete GET property sniff')}})
let postHasURL=true
try{serverFunctionUrl(bare,7)}catch{postHasURL=false}
const url=serverFunctionUrl(readRef,7),read=query(readRef as (n:number)=>Promise<number>,'router-preload-metadata')
let navigate!:ReturnType<typeof useNavigate>,preload!:ReturnType<typeof usePreloadRoute>
const intents:string[]=[]
function Data(){const p=useParams(),value=createMemo(()=>read(Number(p.n)));return <Loading fallback='pending'><b>{value()}</b></Loading>}
const Router=createRouter({history:memoryHistory('/'),routes:[{path:'/',component:()=> <i>home</i>},{path:'/data/:n',component:Data,preload:p=>{intents.push(p.intent);return read(Number(p.params.n))}}]})
const target=document.createElement('div');document.body.append(target)
const close=render(()=><Router>{p=>{navigate=useNavigate();preload=usePreloadRoute();return p.children}}</Router>,target)
;(window as any).preloadMetadataResult=(async()=>{try{preload('/data/7',{preloadData:true});await ticks(25);const before=target.textContent;navigate('/data/7');await ticks(25);const after=target.textContent;const first=performance.getEntriesByType('resource').filter(e=>e.name.includes('/_server/')).length;await revalidate(read.keyFor(7));await ticks(25);return{postHasURL,url,before,after,final:target.textContent,intents,first}}finally{close();target.remove()}})()
