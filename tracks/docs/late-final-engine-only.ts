import {OBSERVE,createRoot,createSignal,createMemo,flush} from 'solid-js'
import {attribution} from 'solid-js/attribution'
const release=attribution.enable({log:false,checks:false});let close!:()=>void,write!:(n:number)=>void;createRoot(d=>{close=d;const[r,w]=createSignal(0);write=w;createMemo(r)});write(1);flush();(window as any).lateFinalEngineOnly={installed:!!OBSERVE?.attribution.installed,reruns:attribution.history('rerun').length};close();release()
