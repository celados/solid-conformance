import {test,expect} from 'bun:test'
import {realpath} from 'node:fs/promises'
import {resolve} from 'node:path'
test('04-stores.md: storePath is exported from the browser core',async()=>{
	const directory=await realpath('node_modules/solid-js')
	const pkg=await Bun.file(resolve(directory,'package.json')).json()
	const result=await Bun.build({entrypoints:[resolve(import.meta.dir,'module.ts')],target:'browser',plugins:[{name:'browser-core',setup(b){b.onResolve({filter:/^solid-js$/},()=>({path:resolve(directory,pkg.exports['.'].browser.default)}))}}]})
	expect(result.success).toBe(true)
})
