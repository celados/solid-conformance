import { defineConfig } from 'vite'
import solid from '@solidjs/vite-plugin'

export default defineConfig({
	plugins: [
		solid({
			start: { app: 'src/App.tsx', devtools: false },
			ssr: true,
			serverFunctions: { components: true },
			performanceTracks: false,
		}),
	],
})
