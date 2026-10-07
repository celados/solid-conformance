import {test,expect} from 'bun:test'
import {runSuite} from '../scripts/run-suite'
test('all tracks in isolated, bounded Bun hosts',async()=>{
 const results=await runSuite()
 expect(results.length).toBeGreaterThan(0)
 expect(results.filter(row=>row.exitCode!==0||row.timedOut)).toEqual([])
 expect(results.filter(row=>row.pass+row.skip===0)).toEqual([])
},3600000)
