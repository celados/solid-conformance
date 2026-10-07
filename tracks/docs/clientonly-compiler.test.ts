import {test,expect} from 'bun:test'
import {transformLazy} from '@solidjs/compiler'
test('03-control-flow.md L250: module URL transform annotates clientOnly and lazy, with import provenance and filename negative controls',()=>{
 for(const name of ['clientOnly','lazy']){const pkg=name==='clientOnly'?'@solidjs/web':'solid-js';const source=`import {${name}} from '${pkg}';const C=${name}(()=>import('./Chart'));`;const result=transformLazy(source,{filename:'/app/page.tsx'}).code;expect(result).toContain('__SOLID_LAZY_MODULE__:./Chart');expect(transformLazy(source,{}).code).not.toContain('__SOLID_LAZY_MODULE__');expect(transformLazy(`const load=()=>{};load(()=>import('./Chart'));`,{filename:'/app/page.tsx'}).code).not.toContain('__SOLID_LAZY_MODULE__')}
})
