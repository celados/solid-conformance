import {createRoot,createStore,createSignal,action,flush} from 'solid-js'
export async function run(storeMode=true,held=true){
 let dispose!:()=>void,release!:()=>void,previous:unknown
 const gate=new Promise<void>(resolve=>{release=resolve})
 const state=createRoot(close=>{dispose=close;const[input,setInput]=createSignal(1);let read:()=>number,write:()=>void
  if(storeMode){const[store,set]=createStore(draft=>{draft.n+=input()},{n:0});read=()=>store.n;write=()=>set(draft=>{previous=draft.n;draft.n+=100})}
  else{const[value,set]=createSignal<number>((previous=0)=>previous+input());read=value;write=()=>{set(value=>{previous=value;return value+100})}}
  const start=held?action(function*(){setInput(2);yield gate}):async()=>{setInput(2)}
  return{read,write,start}
 })
 try{const done=state.start();flush();state.write();flush();release();await done;return{value:state.read(),previous}}finally{dispose()}
}
