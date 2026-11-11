import {test, expect} from 'bun:test'
test('optimistically hidden Match restores its ref', async () => {
 const child = Bun.spawn(['bun','run','report/repros/059-match-ref-optimistic-rollback/run.ts'],{stdout:'inherit',stderr:'inherit'})
 expect(await child.exited).toBe(0)
},60000)
