import {createRoot,createSignal,flush,onCleanup} from "solid-js";
import {render} from "@solidjs/web";
import {createFrame,createFrameHost,FRAME_APPLIED_EVENT} from "@solidjs/web/frames";
const events:any[]=[];
document.addEventListener(FRAME_APPLIED_EVENT,event=>{const e=event as CustomEvent;events.push({detail:e.detail,bubbles:e.bubbles,text:(e.target as Element).textContent})});
const [count,setCount]=createSignal(0);const unmount=render(()=><span>{count()}</span>,document.getElementById("client")!);
setCount(1);flush();const clientEvents=events.length;
const target=document.getElementById("root")!,host=createFrameHost();let dispose!:()=>void;
createRoot(d=>{dispose=d;const frame=createFrame(target,{id:"applied",host});onCleanup(()=>frame.dispose())});
for(const [version,text] of [[1,"one"],[2,"two"]] as const){host.apply({type:"start",id:"applied",version});host.apply({type:"html",id:"applied",version,html:"<h1>"+text+"</h1>"});host.apply({type:"complete",id:"applied",version});flush()}
dispose();host.apply({type:"start",id:"applied",version:3});host.apply({type:"html",id:"applied",version:3,html:"<h1>late</h1>"});host.apply({type:"complete",id:"applied",version:3});flush();unmount();
(window as any).result={clientEvents,events,text:target.textContent};
