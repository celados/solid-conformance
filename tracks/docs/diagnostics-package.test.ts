import {test,expect} from 'bun:test'
import {assertBudget,assertBudgetFile,parseBudgetFile,DiagnosticsAssertionError} from '@solidjs/diagnostics'
import {dirname,resolve} from 'node:path'
test('RFC08 L9: packaged diagnostic budgets and matcher/repair entry points accompany captured browser artifacts',async()=>{
 const minimal={formatVersion:8,scenario:'empty',at:0,timeOrigin:performance.timeOrigin,diagnostics:[],attribution:{reruns:[],holds:[],costs:{scopes:[],writes:[]},feedback:{sources:[],interactions:[],navigations:[],flights:[],fallbacks:[]}},records:{}} as any
 expect(()=>assertBudget(minimal,{allow:[],maxReruns:0,maxHoldMs:0})).not.toThrow();const budgets=parseBudgetFile(JSON.stringify({formatVersion:1,scenarios:{empty:{maxReruns:0}}}));expect(()=>assertBudgetFile(minimal,budgets)).not.toThrow();expect(()=>assertBudgetFile({...minimal,scenario:'unbudgeted'},budgets)).toThrow(DiagnosticsAssertionError)
 const diagnostics=dirname(Bun.resolveSync('@solidjs/diagnostics/package.json',process.cwd())),matcher=await Bun.file(resolve(diagnostics,'dist/vitest.js')).text();for(const name of ['toHaveNoDiagnostics','toHaveDiagnostic','toStayWithinRerunBudget','toHaveNoWaste','toHaveNoSilentHolds','toStayWithinHoldBudget','toStayWithinBudget'])expect(matcher).toContain(name+'(');expect(matcher).toContain('expect.extend(')
 const skill=await Bun.file('node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md').text();const codeNames=[...new Set((await Bun.file('tracks/docs/inventory.json').text()).match(/\b[A-Z][A-Z_]+\b/g))].filter(n=>n.includes('_')&&!['REQUEST_EVENT','INTERNAL_ERROR'].includes(n));for(const code of codeNames.filter(n=>n==='NO_OWNER_CLEANUP'||n==='STRICT_READ_UNTRACKED'||n==='SILENT_HOLD'||n==='SSR_RENDER_ERROR_CONTAINED'))expect(skill).toContain(code)
 expect(await Bun.file(resolve(diagnostics,'skills/agent-loops/SKILL.md')).exists()).toBe(true)
},60000)
