import { transform } from '@solidjs/compiler'
import { test, expect } from 'bun:test'
test('native TSRX accepts ASI before markup', () => {
	expect(() =>
		transform('export function F() @{\nlet a = 1\n<div>{a}</div>\n}', {
			filename: 'F.tsrx',
			generate: 'dom',
		}),
	).not.toThrow()
})
