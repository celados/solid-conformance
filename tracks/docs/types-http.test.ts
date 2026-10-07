import { test, expect } from 'bun:test'
import { resolve } from 'node:path'

// 12-ssr-http.md L69–88: RequestEventLocals is module-augmentable; script declarations
// replace the module, and a sibling .ts suppresses its matching .d.ts under normal discovery.
test('12-ssr-http.md: public request locals augmentation and both documented TypeScript sharp edges',async()=>{
 const directory=resolve('.build/docs-http-types')
 const source=`import { createRequestEvent, getRequestEvent } from '@solidjs/web';\nimport type { ServerFunctionEvent } from '@solidjs/web/server-functions/server';\ntype IsAny<T> = 0 extends (1 & T) ? true : false;\nconst event = createRequestEvent(new Request('https://conformance.test'));\nconst named: string = event.locals.conformanceTenant;\nconst current: string = getRequestEvent()!.locals.conformanceTenant;\ndeclare const server: ServerFunctionEvent;\nconst functionLocal: string = server.locals.conformanceTenant;\nconst unknownIsAny: IsAny<typeof event.locals.notDeclared> = true;\nevent.locals.notDeclared = { arbitrary: true };\n// @ts-expect-error The augmentation forbids wrong writes for named fields.\nevent.locals.conformanceTenant = 42;\nvoid [named,current,functionLocal,unknownIsAny];\n`
 for(const mode of ['ts','dts','script','shadowed']){
  const work=directory+'/'+mode
  const augmentation=`${mode==='script'?'':'export {};\n'}declare module '@solidjs/web' { interface RequestEventLocals { conformanceTenant: string } }\n`
  await Bun.write(work+'/augmentation.'+(mode==='ts'?'ts':'d.ts'),augmentation)
  await Bun.write(work+'/fixture.ts',mode==='script'?`import { createRequestEvent } from '@solidjs/web';\nvoid createRequestEvent;\n`:mode==='shadowed'?`import { getRequestEvent } from '@solidjs/web';\ntype IsAny<T> = 0 extends (1 & T) ? true : false;\nconst event = getRequestEvent()!;\nconst stillAny: IsAny<typeof event.locals.conformanceTenant> = true;\nvoid stillAny;\n`:source)
  if(mode==='shadowed')await Bun.write(work+'/augmentation.ts','export {};\n')
  const config=work+'/tsconfig.json'
  await Bun.write(config,JSON.stringify({compilerOptions:{target:'ESNext',module:'Preserve',moduleResolution:'bundler',strict:true,noEmit:true,skipLibCheck:true,lib:['ESNext','DOM'],types:[]},include:[work+'/*.ts']}))
  const compiler=Bun.spawn(['bun','x','tsc','--project',config],{stdout:'pipe',stderr:'pipe'})
  const output=await new Response(compiler.stdout).text()+await new Response(compiler.stderr).text()
  const exitCode=await compiler.exited
  if(mode==='script'){expect(exitCode).toBe(1);expect(output).toContain('has no exported member')}
  else expect({exitCode,output}).toEqual({exitCode:0,output:''})
 }
},30000)
