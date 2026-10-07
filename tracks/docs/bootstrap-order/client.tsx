import {hydrate,takeHydrationValue} from '@solidjs/web'
const root=document.getElementById('root'),original=root?.firstElementChild,seed=takeHydrationValue<number>('boot:value');let error:string|undefined
try{hydrate(()=> <span>{seed?.status==='resolved'?seed.value:-1}</span>,root!,{renderId:'app'})}catch(value){error=String(value)}
Object.assign(window,{bootstrapCheck:{rootPresent:!!root,seed:seed?.status==='resolved'?seed.value:undefined,error,claimed:root?.firstElementChild===original,text:root?.firstElementChild?.textContent}})
