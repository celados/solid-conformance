import {createMemo,Loading} from 'solid-js'
import {render} from '@solidjs/web'
import {createServerReference,GET,withMeta,configureServerFunctionsClient} from '@solidjs/web/server-functions/client'
import {createRouter,memoryHistory,query,action,useAction,useSubmissions} from '@solidjs/router'
import {ticks} from '../../harness/timing'
const requests:any[]=[];configureServerFunctionsClient({prepareRequest:(init,ctx)=>{requests.push({method:init.method,meta:ctx.meta});return init}})
const ref=withMeta(createServerReference('router-meta-read') as (n:number)=>Promise<number>,{requiresAuth:true});const prepared=GET(ref);Object.defineProperty(prepared,'GET',{get(){throw new Error('obsolete GET property sniff')}})
const read=query(prepared as (n:number)=>Promise<number>,'router-meta'),save=action(createServerReference('router-contract-save') as (data:FormData)=>Promise<string>);let invoke!:(data:FormData)=>Promise<unknown>
const target=document.createElement('div');document.body.append(target);let submissions:any
function Page(){invoke=useAction(save) as any;submissions=useSubmissions(save);const left=createMemo(()=>read(3)),right=createMemo(()=>read(3));return <Loading><b>{left()}:{right()}</b></Loading>}
const Router=createRouter({history:memoryHistory('/'),routes:[{path:'/',component:Page}]});const close=render(()=><Router/>,target)
;(window as any).metadataResult=(async()=>{try{await ticks(25);const before=target.textContent;const data=new FormData();data.set('label','success');const result=await invoke(data);await ticks(25);const after=target.textContent;const failure=new FormData();failure.set('label','fail');let caught='';try{await invoke(failure)}catch(e){caught=String(e)}await ticks(25);return{before,after,result,caught,submissions:submissions.map((s:any)=>({error:s.error?String(s.error):null,result:s.result})),requests,key:read.keyFor(3)}}finally{close();target.remove()}})()
