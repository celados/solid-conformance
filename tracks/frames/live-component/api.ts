import { isServer } from '@solidjs/web'
import { createServerReference, GET, live } from '@solidjs/web/server-functions'

import { produce } from './producer'
export const story = live(
	GET(
		createServerReference(
			(isServer
				? { id: 'live-component', fn: produce }
				: 'live-component') as any,
		),
	),
)
