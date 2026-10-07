import { test, expect } from 'bun:test'
import { resolve } from 'node:path'
import { realpath } from 'node:fs/promises'

test('RFC 09: renderer-owned runtime declarations specialize JSX.Element through the published JSX generator',async()=>{
 const web=await realpath(resolve('node_modules/@solidjs/web'))
 const directory=resolve('.build/docs-custom-types')
 await Bun.write(directory+'/custom-element.d.ts','export type CustomElement = { readonly kind: "custom-renderer" };\n')
 await Bun.write(directory+'/jsx-properties.d.ts',Bun.file(web+'/jsx/jsx-properties.d.ts'))
 const generate=Bun.spawn(['bun',web+'/scripts/jsx-sync.mjs','--input',web+'/jsx/jsx-h.d.ts','--output',directory+'/generated-jsx.d.ts','--element','CustomElement','--import','import type { CustomElement } from "./custom-element.js";'],{stdout:'pipe',stderr:'pipe'})
 const generatedOutput=await new Response(generate.stdout).text()+await new Response(generate.stderr).text()
 expect({exitCode:await generate.exited,output:generatedOutput}).toEqual({exitCode:0,output:''})
 await Bun.write(directory+'/runtime.d.ts','export type { JSX } from "./generated-jsx.js";\nexport declare function jsx(...args:unknown[]):import("./custom-element.js").CustomElement;\nexport { jsx as jsxs, jsx as jsxDEV };\n')
 await Bun.write(directory+'/fixture.tsx',`import type { JSX } from 'custom-renderer/jsx-runtime';\nimport type { JSX as DevelopmentJSX } from 'custom-renderer/jsx-dev-runtime';\nconst value: JSX.Element = <div/>;\nconst custom: { readonly kind: 'custom-renderer' } = value;\nconst development: DevelopmentJSX.Element = value;\n// @ts-expect-error DOM nodes are not this renderer's Element.\nconst wrong: JSX.Element = document.createElement('div');\nvoid [custom, development, wrong];\n`)
 for(const jsx of ['react-jsx','react-jsxdev']){
  const config=directory+'/'+jsx+'.json'
  await Bun.write(config,JSON.stringify({compilerOptions:{target:'ESNext',module:'Preserve',moduleResolution:'bundler',jsx,jsxImportSource:'custom-renderer',strict:true,noEmit:true,skipLibCheck:true,lib:['ESNext','DOM'],types:[],paths:{'custom-renderer/jsx-runtime':[directory+'/runtime.d.ts'],'custom-renderer/jsx-dev-runtime':[directory+'/runtime.d.ts']}},files:[directory+'/fixture.tsx']}))
  const compiler=Bun.spawn(['bun','x','tsc','--project',config],{stdout:'pipe',stderr:'pipe'})
  const output=await new Response(compiler.stdout).text()+await new Response(compiler.stderr).text()
  expect({exitCode:await compiler.exited,output}).toEqual({exitCode:0,output:''})
 }
},30000)
