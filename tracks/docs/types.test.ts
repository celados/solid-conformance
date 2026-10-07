import { test, expect } from 'bun:test'
import { resolve } from 'node:path'

test('RFC 09: documented web/neutral declarations compile; forbidden public signatures do not', async () => {
 const config = resolve('.build/docs-types.json')
 await Bun.write(config, JSON.stringify({ compilerOptions: { target:'ESNext', module:'Preserve', moduleResolution:'bundler', jsx:'preserve', jsxImportSource:'@solidjs/web', strict:true, skipLibCheck:true, noEmit:true, lib:['ESNext','DOM','DOM.Iterable'], types:[] }, files:[resolve('tracks/docs/types-positive.tsx'),resolve('tracks/docs/types-negative.tsx')] }))
 const process = Bun.spawn(['bun','x','tsc','--project',config], { stdout:'pipe', stderr:'pipe' })
 const output = await new Response(process.stdout).text() + await new Response(process.stderr).text()
 expect({ exitCode:await process.exited, output }).toEqual({ exitCode:0, output:'' })
},30000)
