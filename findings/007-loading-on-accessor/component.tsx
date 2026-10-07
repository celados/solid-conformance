import {createSignal,createMemo,Loading} from 'solid-js'
import {deferred,ticks} from '../../harness/timing'
export function loadingAccessorCase(){
	const gates=[deferred<number>(),deferred<number>()]
	let change!:(n:number)=>void
	function App(){const [id,set]=createSignal(0);change=set;const value=createMemo(()=>gates[id()]!.promise);return <Loading on={()=>{id();return 1}} fallback={<b>fallback</b>}><span>{value()}</span></Loading>}
	return {App,streams:[],async settle(){gates[0]!.resolve(1);await ticks();change(1);await ticks()}}
}
