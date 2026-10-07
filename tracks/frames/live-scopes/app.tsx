import {createMemo,Loading,createEffect} from 'solid-js';
import {createServerReference,GET,live} from '@solidjs/web/server-functions';
import {isServer} from '@solidjs/web';
let release!:()=>void;const gate=new Promise<void>(r=>release=r);export const releaseSlow=()=>release();
export const effects:any[]=[];
export const stats={opened:0,closed:0};
export async function* fast(){stats.opened++;try{yield 'fast-first';yield 'fast-second'}finally{stats.closed++}}
export async function* slow(){stats.opened++;try{await gate;yield 'slow-first';yield 'slow-second'}finally{stats.closed++}}
const call=(id:string,fn:any)=>live(GET(createServerReference((isServer?{id,fn}:id) as any)));
const fastCall=call('scopes-fast',fast),slowCall=call('scopes-slow',slow);
function Fast(){const value=createMemo(()=>fastCall());createEffect(value,v=>{effects.push(["fast",v])});return <b data-fast>{value()}</b>}
function Slow(){const value=createMemo(()=>slowCall());createEffect(value,v=>{effects.push(["slow",v])});return <b data-slow>{value()}</b>}
export const App=()=><main><Fast/><Loading fallback={<i data-slow-fallback>slow-pending</i>}><Slow/></Loading></main>;
