import { OBSERVE, createRoot, createSignal, createMemo, flush, untrack } from 'solid-js'
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
