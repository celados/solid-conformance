import { test, expect } from 'bun:test'
import { resolve } from 'node:path'

test('03-control-flow.md: documented createEffect(compute, effect, onError) compiles against public declarations',async()=>{
 const directory=resolve('.build/finding030')
 await Bun.write(directory+'/usage.ts',Bun.file('findings/030-effect-error-signature/usage.ts.txt'))
 await Bun.write(directory+'/tsconfig.json',JSON.stringify({compilerOptions:{target:'ESNext',module:'Preserve',moduleResolution:'bundler',strict:true,noEmit:true,skipLibCheck:true,lib:['ESNext'],types:[]},files:[directory+'/usage.ts']}))
 const compiler=Bun.spawn(['bun','x','tsc','--project',directory+'/tsconfig.json'],{stdout:'pipe',stderr:'pipe'})
 const output=await new Response(compiler.stdout).text()+await new Response(compiler.stderr).text()
 expect({exitCode:await compiler.exited,output}).toEqual({exitCode:0,output:''})
},30000)
