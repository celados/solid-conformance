import {test,expect} from 'bun:test'
import {realpath} from 'node:fs/promises'
import {resolve} from 'node:path'

test('12-ssr-http.md L237: browser render does not retain the pair codec; explicit imports are the positive bundle control',async()=>{
 const packages=new Map<string,{path:string,exports:Record<string,unknown>}>()
 for(const name of ['solid-js','@solidjs/signals','@solidjs/web']){const path=await realpath(resolve('node_modules',name));packages.set(name,{path,exports:(await Bun.file(path+'/package.json').json()).exports})}
 const conditions=new Set(['browser','production','import','default'])
 function select(entry:unknown):string|undefined{if(typeof entry==='string')return entry;if(entry&&typeof entry==='object')for(const [key,value]of Object.entries(entry))if(conditions.has(key)){const chosen=select(value);if(chosen)return chosen}}
 for(const mode of ['render','codec','errors']as const){
  const codec=mode==='codec'
  const file=resolve('.build',`cookie-codec-${mode}.ts`)
  await Bun.write(file,mode==='errors'?'import {Errored,configureClientErrors} from \"solid-js\";globalThis.__errors={Errored,configureClientErrors}':codec?'import {parseCookieHeader,serializeCookie} from "@solidjs/web";globalThis.__codec={parseCookieHeader,serializeCookie}':'import {render} from "@solidjs/web";globalThis.__render=render')
  const result=await Bun.build({entrypoints:[file],target:'browser',minify:false,plugins:[{name:'public-production-artifacts',setup(builder){builder.onResolve({filter:/^(solid-js|@solidjs\/(signals|web))(\/.*)?$/},args=>{const name=args.path.startsWith('@')?args.path.split('/').slice(0,2).join('/'):'solid-js',pkg=packages.get(name)!;const key='.'+args.path.slice(name.length);const path=select(pkg.exports[key]);if(!path)throw new Error('Missing export '+args.path);return{path:resolve(pkg.path,path)}})}}]})
  expect(result.success).toBe(true)
  const output=await result.outputs[0]!.text()
  expect(/function parseCookieHeader\b/.test(output)).toBe(codec)
  expect(/function serializeCookie\b/.test(output)).toBe(codec)
  expect(/function configureClientErrors\b/.test(output)).toBe(mode==='errors')
  expect(/function reportClientError\b/.test(output)).toBe(mode==='errors')
 }
},30000)
