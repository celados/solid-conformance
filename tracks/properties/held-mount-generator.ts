import fc from 'fast-check'
export const heldMounts = fc.record({
 value: fc.integer({min: 1,max: 9}),
 nested: fc.boolean(),
 shape: fc.constantFrom('static' as const, 'function' as const, 'keyed' as const),
})
