import { defineHarnessConfig } from '@celados/harness'

export default defineHarnessConfig({
	typecheck: {
		exclude: {
			'report/**':
				'Standalone reproductions for upstream reports, each with its own package.json and pinned Solid; not installed here.',
		},
	},
})
