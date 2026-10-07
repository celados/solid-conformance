import {test,expect} from 'bun:test'
import {assertBudget,assertBudgetFile,parseBudgetFile,DiagnosticsAssertionError} from '@solidjs/diagnostics'
import {dirname,resolve} from 'node:path'
test('RFC08 L9: packaged diagnostic budgets and matcher/repair entry points accompany captured browser artifacts',async()=>{
 const minimal={formatVersion:8,scenario:'empty',at:0,timeOrigin:performance.timeOrigin,diagnostics:[],attribution:{reruns:[],holds:[],costs:{scopes:[],writes:[]},feedback:{sources:[],interactions:[],navigations:[],flights:[],fallbacks:[]}},records:{}} as any
 expect(()=>assertBudget(minimal,{allow:[],maxReruns:0,maxHoldMs:0})).not.toThrow();const budgets=parseBudgetFile(JSON.stringify({formatVersion:1,scenarios:{empty:{maxReruns:0}}}));expect(()=>assertBudgetFile(minimal,budgets)).not.toThrow();expect(()=>assertBudgetFile({...minimal,scenario:'unbudgeted'},budgets)).toThrow(DiagnosticsAssertionError)
 const diagnostics=dirname(Bun.resolveSync('@solidjs/diagnostics/package.json',process.cwd())),matcher=await Bun.file(resolve(diagnostics,'dist/vitest.js')).text();for(const name of ['toHaveNoDiagnostics','toHaveDiagnostic','toStayWithinRerunBudget','toHaveNoWaste','toHaveNoSilentHolds','toStayWithinHoldBudget','toStayWithinBudget'])expect(matcher).toContain(name+'(');expect(matcher).toContain('expect.extend(')
 const skill=await Bun.file('node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md').text();const declarations=await Bun.file('node_modules/@solidjs/signals/dist/types/core/dev.d.ts').text();const union=declarations.match(/export type DiagnosticCode =([\s\S]*?);/)![1]!;const codeNames=[...union.matchAll(/"([A-Z_]+)"/g)].map(match=>match[1]!);expect(codeNames.length).toBeGreaterThan(0);for(const code of codeNames)expect(skill).toContain('### '+code)

 expect(await Bun.file(resolve(diagnostics,'skills/agent-loops/SKILL.md')).exists()).toBe(true)
},60000)
