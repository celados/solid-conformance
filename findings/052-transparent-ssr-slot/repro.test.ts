import {test,expect} from 'bun:test'
import {resolve} from 'node:path'
import {build} from '../../scripts/build'
test('05-async-data.md L227: SSR ignores transparent and always allocates the async source hydration slot',async()=>{const dir=resolve('.build/finding052');await build(dir,(process.env.BUILD_MODE??'development')as 'development'|'production',{client:[],server:['findings/052-transparent-ssr-slot/module.tsx']});const runtime=await import(dir+'/module.js');const baseline=await runtime.run(false);expect(baseline.sourceRecord).toBe(true);expect(baseline.value).toBe(42);expect(await runtime.run(true)).toEqual(baseline)},30000)
