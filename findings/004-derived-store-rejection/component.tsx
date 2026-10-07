import { createStore, createSignal, Errored, Loading } from 'solid-js'
import { deferred, ticks } from '../../harness/timing'
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
