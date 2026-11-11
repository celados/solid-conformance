import {test, expect} from 'bun:test'
test('optimistically hidden Show restores its ref', async () => {
 const child = Bun.spawn(['bun','run','report/repros/058-show-ref-optimistic-rollback/run.ts'],{stdout:'inherit',stderr:'inherit'})
 expect(await child.exited).toBe(0)
},60000)
