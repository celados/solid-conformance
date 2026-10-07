import {test,expect} from 'bun:test'
import {transform,transformSourceNames} from '@solidjs/compiler'

test('08-dev-diagnostics.md: sourceNames components and bindings preserve the source site in DOM and SSR output',()=>{
  const input='const Home = () => null; const Page = () => <><Home/><section class={style()}>{count()}</section></>'
  for(const generate of ['dom','ssr'] as const) {
    const named=transform(input,{generate,dev:true,sourceNames:true}).code
    const unnamed=transform(input,{generate,dev:true,sourceNames:false}).code
    expect(named).toContain('"Home"');expect(unnamed).not.toContain('"Home"')
    if(generate==='dom') {expect(named).toContain('name: "section.children"');expect(named).toContain('name: "section.class"');expect(unnamed).not.toContain('name: "section.class"')}
  }
})
test('08-dev-diagnostics.md: primitive naming is a standalone transformSourceNames pass for ts/js modules, preserving explicit names',()=>{
  const input='import {createSignal, createMemo} from "solid-js"; const [count,setCount]=createSignal(0);const doubled=createMemo(()=>count()*2);function createCounter(){const [value,set]=createSignal(1);return value};const explicit=createMemo(()=>count(),{name:"manual"})'
  for(const filename of ['counter.ts','counter.js']) {
    const result=transformSourceNames(input,{filename}).code
    expect(result).toContain('name: "count"');expect(result).toContain('name: "doubled"');expect(result).toContain('name: "createCounter.value"');expect(result).toContain('name: "manual"');expect(result).not.toContain('name: "explicit"')
  }
  expect(transform('const View=()=> <span>{count()}</span>',{generate:'dom',dev:false}).code).not.toContain('name:')
})
