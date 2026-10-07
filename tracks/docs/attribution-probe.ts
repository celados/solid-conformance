import { OBSERVE, createRoot, createSignal, createMemo, createStore, createEffect, action, flush, untrack } from 'solid-js'
import { attribution, formatOrigin } from 'solid-js/attribution'
export function probe() {
	const release=attribution.enable({log:false,checks:false,holds:false,graphGrowth:false})
	let dispose!:()=>void
	try {
		const [write]=createRoot(d=>{dispose=d;const[r,w]=createSignal(0,{name:'count'});createMemo(()=>r()*2,{name:'double'});return [w] as const})
		write(1);flush()
		const unobserved=attribution.history('rerun').length
		const records:unknown[]=[]
		const off=OBSERVE?.records.subscribe('rerun',event=>records.push(event))
		write(2);flush();off?.()
		const observed=attribution.history('rerun').length
		write(3);flush()
		const afterUnsubscribe=attribution.history('rerun').length
		return {unobserved,observed,afterUnsubscribe,records:records.length,installed:!!OBSERVE?.attribution.installed}
	} finally {dispose();release()}
}
export function privacy(level?:'full'|'labels'|'none',second?:'full'|'labels'|'none') {
	const release=attribution.enable({log:false,checks:false,holds:false,...(level?{values:level}:{})})
	const further=second?attribution.enable({log:false,checks:false,holds:false,values:second}):()=>{}
	let dispose!:()=>void
	const records: {target?:string;preview:boolean;format:string}[]=[]
	const off=OBSERVE?.records.subscribe('rerun',event=>{const cause=event.causes[0]!;records.push({target:cause.origin?.target,preview:'prev'in cause,format:formatOrigin(cause.origin!)})})
	try{
		const[write]=createRoot(d=>{dispose=d;const[r,w]=createSignal('secret');createMemo(r);return[w] as const})
		for(const target of ['button#save "Save"','div#card "Personal note"']){OBSERVE?.attribution.withInteraction({type:'click',target},()=>{write(target);flush()})}
		further();OBSERVE?.attribution.withInteraction({type:'click',target:'div#card "Personal note"'},()=>{write('after release');flush()})
		return records
	}finally{dispose();off?.();further();release()}
}
export async function contracts(){
 const release=attribution.enable({log:false,checks:false,holds:false,values:'full'});let dispose!:()=>void
 const records:any[]=[];const off=OBSERVE?.records.subscribe('rerun',event=>records.push(event))
 try{
  const [write,writeRelay,set,mutate,land]=createRoot(d=>{
   dispose=d;const[r,w]=createSignal<unknown>(0,{name:'previews'});createMemo(r,{name:'preview-reader'})
   const[relay,relayWrite]=createSignal(0,{name:'relay'}),[output,setOutput]=createSignal(0,{name:'output'})
   createEffect(relay,n=>{if(n)setOutput(n)});createMemo(output,{name:'output-reader'})
   const[s,set]=createStore({user:{name:'first'}});createMemo(()=>s.user.name,{name:'store-reader'})
   const mutate=action(async function* namedAction(){w('action-value');await Promise.resolve();w('escaped-action');yield})
   let resolve!:(n:number)=>void;const flight=new Promise<number>(r=>resolve=r);const value=createMemo(()=>flight,{name:'async-value'});createMemo(value,{name:'async-reader'})
   flush();return[w,relayWrite,set,mutate,resolve] as const
  })
  for(const value of ['x'.repeat(60),true,12,[1,2],{secret:'value'}]){write(value);flush()}
  writeRelay(2);flush();set(s=>{s.user.name='changed'});flush();await mutate();flush();land(3);for(let i=0;i<8;i++)await Promise.resolve();flush()
  return records.map(r=>({name:r.nodeName,nodeId:r.nodeId,at:r.at,causes:r.causes}))
 }finally{dispose();off?.();release()}
}
