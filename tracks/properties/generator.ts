import fc from 'fast-check'

import type { Tree, Kind } from '../../harness/tree'
const leaves: Kind[] = [
	'text',
	'promise',
	'iterable',
	'store',
	'optimistic',
	'optimistic-store',
	'action',
	'effect',
	'lazy',
]
const wrappers: Kind[] = [
	'show',
	'for',
	'keyed-for',
	'switch',
	'loading',
	'errored',
	'group',
]
export function trees(depth = 3): fc.Arbitrary<Tree> {
	const leaf = fc.record({
		kind: fc.constantFrom(...leaves),
		value: fc.integer({ min: 0, max: 9 }),
		children: fc.constant<Tree[]>([]),
	})
	if (!depth) return leaf
	return fc.oneof(
		{ depthSize: 'small' },
		leaf,
		fc.record({
			kind: fc.constantFrom(...wrappers),
			value: fc.constant(1),
			children: fc.array(trees(depth - 1), { minLength: 1, maxLength: 2 }),
		}),
	)
}
export { fc }
