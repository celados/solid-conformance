import { createStore, createSignal, Errored, Loading } from 'solid-js'
const ticks = async () => { for (let i = 0; i < 12; i++) await new Promise(r => setTimeout(r, 0)) }
function deferred<T>() { let resolve!: (v:T)=>void, reject!: (e:unknown)=>void; const promise=new Promise<T>((a,b)=>{resolve=a;reject=b}); return {promise,resolve,reject} }
export function storeRejectionCase() {
	const second=deferred<{value:number}>()
	let change!:(n:number)=>void
	function App() {
		const [id,set]=createSignal(0);change=set
		const [store]=createStore(()=>id()===0?{value:0}:second.promise,{value:0})
		return <Errored fallback={(_error)=><b>error</b>}><Loading fallback={<i>pending</i>}><span>{store.value}</span></Loading></Errored>
	}
	return { App, streams:[], async settle(){change(1);await ticks();second.reject(new Error('expected'));await ticks()} }
}

import {render} from '@solidjs/web'
const sample=storeRejectionCase()
render(sample.App,document.getElementById('root')!)
;(window as any).result=(async()=>{await sample.settle();return document.getElementById('root')!.innerHTML})()
