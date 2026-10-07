import { test, expect } from 'bun:test'
import inventory from './inventory.json'
import { join } from 'node:path'

test('RFC inventory: every entry has a stable source locator, explicit classification, and honest proof state',async()=>{
 const ids=new Set<string>()
 const source=join('.upstream',inventory.commit,'documentation/solid-2.0')
 for(const entry of inventory.statements){
  expect(ids.has(entry.id)).toBe(false);ids.add(entry.id)
  const text=await Bun.file(join(source,entry.file)).text()
  const normalized=text.split('\n').slice(entry.line-1).join(' ').replace(/\s+/g,' ')
  expect(normalized.includes(entry.statement.replace(/\s+/g,' '))).toBe(true)
  if(entry.status==='covered')expect(entry.coverage.length).toBeGreaterThan(0)
  if(entry.status==='untestable'||entry.status==='not-behavioral')expect('reason' in entry).toBe(true)
 }
 expect(ids.size).toBe(inventory.statements.length)
})
