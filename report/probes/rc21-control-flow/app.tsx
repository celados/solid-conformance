import {Show, Switch, Match, For, Repeat, Loading, Errored, createSignal, createMemo, createRenderEffect, createOptimistic, action, children, flush} from 'solid-js'
import {render} from '@solidjs/web'
const tick = () => new Promise(r => setTimeout(r, 10))
;(window as any).probe = async (api: string, read: string, write: string, timing: string, nested: boolean, boundary: string) => {
 const root = document.getElementById('root')!
 let set!: (x: number) => void, setOther!: (x:number)=>void, start!:()=>Promise<unknown>, release!:()=>void
 const gate = new Promise<void>(r=>release=r)
 const dispose = render(() => {
  const [value, setValue] = createSignal(1); set = setValue
  const [other, writeOther] = createSignal(0); setOther = writeOther
  const [guess, setGuess] = createOptimistic(1)
  start = action(function*(){setValue(0);writeOther(1);setGuess(0);yield gate})
  const current = () => write === 'optimistic' ? guess() : value()
  const asyncData = createMemo(() => other() ? gate.then(()=>'done') : 'ready')
  const child = (v:()=>number) => {
   if(read === 'memo') { const m = createMemo(()=>`${other()}:${v()}`); return <span>{m()}</span> }
   if(read === 'effect') { createRenderEffect(()=>`${other()}:${v()}`,()=>{}); return <span>{v()}</span> }
   if(read === 'children') { const c = children(()=><span>{other()}:{v()}</span>); return <>{c()}</> }
   if(read === 'ref') return <span ref={el=>{el.title=String(v())}}>{other()}:{v()}</span>
   if(read === 'spread') return <span {...{get title(){return `${other()}:${v()}`}}}>{v()}</span>
   return <span title={`${other()}:${v()}`}>{v()}</span>
  }
  const inner = () => api === 'show' ? <Show when={current()}>{v=>child(v)}</Show> : api === 'match' ? <Switch><Match when={current()}>{v=>child(v)}</Match></Switch> : api === 'for' ? <For each={current() ? [current()] : []} keyed={false}>{v=>child(v)}</For> : <Repeat count={current() ? 1 : 0}>{i=>child(()=>i+1)}</Repeat>
  const body = () => nested ? <Show when={other() === 0 || current() !== 0}><div>{inner()}</div></Show> : inner()
  return <>{boundary === 'loading' ? <Loading fallback="loading">{body()}</Loading> : boundary === 'errored' ? <Errored fallback="error">{body()}</Errored> : body()}{write === 'transition' ? <Loading fallback="waiting"><i>{asyncData()}</i></Loading> : null}</>
 }, root)
 try {
  flush(); await tick()
  if(timing === 'after-settle') await tick()
  if(write === 'action' || write === 'optimistic') {const done=start(); await tick(); release(); await done}
  else {set(0);setOther(1);flush();await tick();release()}
  await tick(); flush(); await tick()
  return {text:root.textContent, html:root.innerHTML}
 } finally {release();dispose()}
}
