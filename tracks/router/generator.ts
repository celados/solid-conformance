import fc from 'fast-check'
export const routerOperations = fc.record({
  family: fc.constantFrom('preload', 'supersession', 'action-failure', 'action-success', 'redirect', 'live', 'query-error', 'form-success', 'server-action'),
  value: fc.integer({min: 1, max: 99}),
  reverse: fc.boolean(),
})
export {fc}
