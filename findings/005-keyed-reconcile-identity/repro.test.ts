import {test,expect} from 'bun:test'
import {createRoot,createStore,reconcile,flush} from '@solidjs/signals'
test('04-stores.md: keyed reconcile preserves unchanged row identity',()=>{
	let dispose!:()=>void
	const [store,set]=createRoot(d=>{dispose=d;return createStore([{id:1},{id:2}])})
	try {const first=store[0];set(d=>{reconcile([{id:2},{id:1}],'id')(d)});flush();expect(store[1]).toBe(first)}finally{dispose()}
})
