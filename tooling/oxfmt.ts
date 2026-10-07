import type { OxfmtConfig } from 'vite-plus/fmt'

export const oxfmt = {
	printWidth: 80,
	singleQuote: true,
	semi: false,
	useTabs: true,
	jsdoc: true,
	sortImports: {
		groups: [
			['type-builtin', 'type-external'],
			['builtin', 'external'],
			['type-internal', 'type-subpath', 'internal', 'subpath'],
			['type-parent', 'type-sibling', 'type-index'],
			['parent', 'sibling', 'index'],
			['side_effect', 'side_effect_style', 'style'],
		],
	},
	// Tailwind sorting is project-specific because the stylesheet path must point
	// to the project's Tailwind v4 entry file.
	// sortTailwindcss: {
	// 	functions: ['cn', 'cx', 'clsx', 'cva'],
	// 	stylesheet: 'web/src/styles/base.css',
	// },
	ignorePatterns: [
		'node_modules',
		'externals',
		'dist',
		'*.lock',
		'**/*.gen.ts',
		'**/worker-configuration.d.ts',
		'convex/_generated',
	],
} satisfies OxfmtConfig
