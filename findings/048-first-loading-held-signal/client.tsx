import {createSignal,createMemo,action,flush,Show,Loading,isPending} from 'solid-js'
import {render} from '@solidjs/web'
async function run(pendingSource=false,mountedByChange=false){
 let probe!:()=>number,release!:()=>void,start!:()=>Promise<unknown>,mount!:(show:boolean)=>void,fallbacks=0;const gate=new Promise<void>(resolve=>{release=resolve});const element=document.createElement('div');document.body.append(element)
 const dispose=render(()=>{const [value,setValue]=createSignal(0),[shown,setShown]=createSignal(false);const read=pendingSource?createMemo(()=>{value();return gate.then(()=>1)}):value;probe=read;start=action(function*(){setValue(1);yield gate});mount=setShown;function Fallback(){fallbacks++;return<b>waiting</b>}return<><header>{value()}</header><Show when={mountedByChange?value():shown()}><Loading fallback={<Fallback/>}><span>{read()}:{String(isPending(read))}</span></Loading></Show></>},element)
 try{const done=start();await new Promise(resolve=>setTimeout(resolve,10));if(!mountedByChange){mount(true);flush()}await new Promise(resolve=>setTimeout(resolve,10));const before=element.textContent,pending=isPending(probe);release();await done;await new Promise(resolve=>setTimeout(resolve,10));return{before,after:element.textContent,fallbacks,...(pendingSource?{pending}: {})}}finally{release();dispose();element.remove()}
}
Object.assign(window,{firstLoadingCheck:run})
