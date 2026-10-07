import {Loading,flush,createMemo,createSignal} from 'solid-js'
import {dynamic,isServer} from '@solidjs/web'
import * as sf from '@solidjs/web/server-functions'
import {createRouter,memoryHistory,query,action,useAction,useNavigate,usePreloadRoute,useParams} from '@solidjs/router'
import {Counter} from './counter'
const api = sf as any
export const read = query((id:number)=>isServer ? controls.serverRead(id) : api.GET(api.createServerReference('wave3-router-frame'))(id),'wave3-frame-query')
const mutate=action(isServer?(()=>Promise.resolve(0)):api.createServerReference('wave3-router-frame-mutate'));mutate.onSettled(submission=>{controls.result=submission.result})
export const controls:any={}
function Region(props:{name:string}) {const params=useParams();const value=createMemo(()=>read(Number(params.id)));const Frame=dynamic(()=>value() as any);return <section data-region={props.name}><Loading fallback='frame-pending'><Frame counter={Counter}/></Loading></section>}
const Router=createRouter({history:memoryHistory('/story/1'),routes:[{path:'/story/:id',preload:p=>read(Number(p.params.id)),component:()=> <><Region name='first'/><Region name='second'/></>},{path:'/empty',component:()=> <aside>empty</aside>}]})
export function App(){return <Router>{p=>{controls.actionURL=mutate.url;controls.navigate=useNavigate();controls.preload=usePreloadRoute();controls.mutate=useAction(mutate);const[n,setN]=createSignal(0);controls.incOutside=()=>{setN(n=>n+1);flush()};return <><output>{n()}</output>{p.children}</>}}</Router>}
