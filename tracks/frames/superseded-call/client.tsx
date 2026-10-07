import {createSignal,createMemo,createEffect,Loading} from 'solid-js';
import {render} from '@solidjs/web';
import {configureServerFunctionsClient,createServerReference} from '@solidjs/web/server-functions/client';
const requests:{key:number;signal?:AbortSignal;resolve:()=>void}[]=[],cache:Record<number,number>={},history:number[]=[];
configureServerFunctionsClient({fetch:(_address,init)=>{const key=JSON.parse(String(init?.body))[0];let release!:()=>void;const pending=new Promise<void>(r=>release=r);requests.push({key,signal:init?.signal??undefined,resolve:release});return pending.then(()=>{cache[key]=key;return Response.json(key,{headers:{"X-Server-Function-Format":"8"}})})}});
const fn=createServerReference('superseded');const [argument,setArgument]=createSignal(1);
function App(){const value=createMemo(()=>fn(argument()));createEffect(value,value=>{history.push(value)});return <Loading fallback={<i>pending</i>}><b>{value()}</b></Loading>}
const close=render(()=> <App/>,document.getElementById('root')!);
(window as any).superseded={set:setArgument,settle:(key:number)=>requests.find(r=>r.key===key)!.resolve(),snapshot:()=>({requests:requests.map(r=>({key:r.key,aborted:r.signal?.aborted??false})),cache,history,text:document.getElementById('root')!.textContent}),close};
