import {Show, Loading, action, createSignal, createMemo, flush} from 'solid-js'
import {render} from '@solidjs/web'
const tick=()=>new Promise(r=>setTimeout(r,10))
;(window as any).playerProbe=async(nested:boolean,spread:boolean,waitingChanges:boolean,mode:string,writeAfterSettle:boolean)=>{
 let release!:()=>void, update!:(x:{waiting:boolean,time:number})=>void, start!:()=>Promise<unknown>, pending!:()=>boolean
 const gate=new Promise<void>(r=>release=r), target=document.getElementById('root')!
 const dispose=render(()=>{
  const [state,setState]=createSignal({waiting:true,time:0});update=setState
  const [request,setRequest]=createSignal(false)
  const data=createMemo(()=>request()?gate.then(()=> 'done'):'ready')
  const [n,setN]=createSignal(0)
  start=action(function*(){setN(1);yield gate})
  pending=()=>{setRequest(true);return true}
  const pic=()=> <Show when={state().time===0 && 'poster'}>{src=>spread?<img {...{class:'poster'}} src={src()} alt=""/>:<img src={src()} alt=""/>}</Show>
  return <>{nested?<Show when={state().waiting}><div>{pic()}</div></Show>:pic()}<Loading fallback="pending"><i>{data()}</i></Loading><b>{n()}</b></>
 },target)
 try{flush();await tick();let done:Promise<unknown>|undefined
  if(mode==='pending-action') {done=start();await tick()}
  if(mode==='pending-async') {pending();flush();await tick()}
  if(writeAfterSettle){release();if(done)await done;await tick()}
  if(mode==='write-action'){await action(function*(){update({waiting:!waitingChanges,time:1})})()}else update({waiting:!waitingChanges,time:1})
  flush();await tick();release();if(done)await done;await tick();flush()
  return target.innerHTML
 }finally{release();dispose()}
}
