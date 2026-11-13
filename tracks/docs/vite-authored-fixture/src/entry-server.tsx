import {
	renderToStream,
	HydrationScript,
	NoHydration,
	Hydration,
} from '@solidjs/web'
import {
	ServerComponentPlugin,
	SERVER_COMPONENT_BOOTSTRAP,
} from '@solidjs/web/frames/server'
import manifest from 'virtual:solid-manifest'

import App from './app'
export function render(_request: Request, context: { clientEntry: string }) {
	return renderToStream(
		() => (
			<NoHydration>
				<html>
					<head>
						<HydrationScript />
						<script innerHTML={SERVER_COMPONENT_BOOTSTRAP} />
					</head>
					<body>
						<div id="root">
							<Hydration id="app">
								<App />
							</Hydration>
						</div>
						<script type="module" async src={context.clientEntry} />
					</body>
				</html>
			</NoHydration>
		),
		{ manifest, plugins: [ServerComponentPlugin] },
	)
}
