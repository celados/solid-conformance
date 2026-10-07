import { test, expect } from 'bun:test'
import { build, type BuildMode } from '../../scripts/build'
import { resolve } from 'node:path'
import { rm } from 'node:fs/promises'
test('RFC 08: no listener, fold import or log means empty rerun history',async()=>{
	const directory=resolve('.build','finding012-'+process.pid)
	try{
		await build(directory,(process.env.BUILD_MODE??'development') as BuildMode,{client:['findings/012-attribution-audience-gate/module.ts'],server:[]})
		const child=Bun.spawn(['bun','-e','const m=await import(process.argv[1]);console.log(m.run())',directory+'/module.js'],{stdout:'pipe',stderr:'pipe'})
		const output=await new Response(child.stdout).text(),error=await new Response(child.stderr).text()
		expect(await child.exited).toBe(0);expect(error).toBe('');expect(Number(output.trim())).toBe(0)
	}finally{await rm(directory,{recursive:true,force:true})}
})
