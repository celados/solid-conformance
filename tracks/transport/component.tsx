import { createMemo, createStore, createProjection, createOptimisticStore, createSignal, Loading, Errored, Show, configureClientErrors } from 'solid-js'
import { isServer } from '@solidjs/web'
import { sseSource } from './source'
import { ticks } from '../../harness/timing'
import { normalizedDOM } from '../../harness/dom'
export type TransportEvent = { kind: 'push'; value: number } | { kind: 'drop' | 'error' | 'click' } | { kind: 'mount'; visible: boolean } | { kind: 'argument'; value: number }
export type TransportSpec = { primitive: 'memo' | 'store' | 'projection' | 'optimistic-store'; events: TransportEvent[] }
export function transportCase(spec: TransportSpec) {
	const prefix = isServer ? 'server' : new URL(location.href).searchParams.get('id')!
	const sources = Array.from({length:4}, (_,id)=>sseSource(prefix+':'+id))
	const errors: string[] = [], trace: { kind: string; dom: string; errors: number; opened: number; closed: number }[] = []
	let mount!: (v: boolean)=>void, argument!: (v:number)=>void, current = 0
	if (!isServer) configureClientErrors({ onError: e=>{errors.push(String(e))} })
	function Panel() {
		const [id,setId] = createSignal(0); argument=setId
		const [clicks,setClicks] = createSignal(0)
		const source = ()=>isServer ? Promise.resolve({value:0}) : sources[id()]!.iterable
		const data = spec.primitive==='memo' ? createMemo(source)
			: spec.primitive==='projection' ? (()=>{const s=createProjection(source,{value:0});return ()=>s})()
			: spec.primitive==='store' ? (()=>{const [s]=createStore(source,{value:0});return ()=>s})()
			: (()=>{const [s]=createOptimisticStore(source,{value:0});return ()=>s})()
		return <><button onClick={()=>setClicks(v=>v+1)}>click</button><em>{clicks()}</em><Errored fallback={(_error)=><b>terminal-source-error</b>}><Loading fallback={<i>pending</i>}><span>{data().value}</span></Loading></Errored></>
	}
	function App() { const [visible,set]=createSignal(true);mount=set;return <Show when={visible()}><Panel/></Show> }
	function url(path:string,id=current){return `/transport/${path}?id=${encodeURIComponent(prefix+':'+id)}`}
	async function status(id=current){return await (await fetch(url('status',id))).json() as {opened:number;closed:number;active:number}}
	async function wait(predicate:(s:Awaited<ReturnType<typeof status>>)=>boolean,id=current){for(let n=0;n<100;n++){if(predicate(await status(id)))return;await ticks(2)}throw new Error('Transport state did not converge')}
	async function snapshot(kind:string){await ticks(8);const all=await Promise.all(sources.map((_,id)=>status(id)));trace.push({kind,dom:normalizedDOM(document.querySelector('#root')!),errors:errors.length,opened:all.reduce((n,s)=>n+s.opened,0),closed:all.reduce((n,s)=>n+s.closed,0)})}
	return { App, streams:sources, trace, async settle(){
		if(isServer)return
		await wait(s=>s.active===1);await snapshot('initial')
		for(const event of spec.events){
			if(event.kind==='mount'){
				mount(event.visible);await ticks(8)
				if(event.visible){current=0;await wait(s=>s.active===1)}else await wait(s=>s.active===0)
			}else if(event.kind==='argument'){argument(event.value);current=event.value;await wait(s=>s.active===1)}
			else if(event.kind==='click')document.querySelector<HTMLButtonElement>('button')!.click()
			else{
				const before=await status()
				await fetch(url('control'),{method:'POST',body:JSON.stringify(event)})
				if(event.kind==='drop')await wait(s=>s.opened===before.opened+1&&s.active===1)
				if(event.kind==='error'){
					await wait(s=>s.active===0)
					for(let tick=0;tick<100&&errors.length===0;tick++)await ticks(2)
				}
				if(event.kind==='push'){
					let rendered=false
					for(let tick=0;tick<100;tick++){await ticks(2);if(document.querySelector('#root span')?.textContent===String(event.value)){rendered=true;break}}
					if(!rendered)throw new Error('SSE value did not render: '+event.value+'; DOM: '+normalizedDOM(document.querySelector('#root')!))
				}
			}
			await snapshot(event.kind)
		}
		// Explicitly dispose while next() is pending, then verify the HTTP peer
		// sees the cancellation. Root unmount below still checks iterable counts.
		mount(false);await ticks(8)
		for(let id=0;id<sources.length;id++)await wait(s=>s.active===0&&s.opened===s.closed,id)
		await snapshot('disposed')
	} }
}
