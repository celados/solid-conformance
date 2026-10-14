import { createEffect, createStore } from 'solid-js'
createEffect(() => 1, {effect: () => {}, error: () => {}})
const [items] = createStore(() => [1, 2], [])
const [cache, setCache] = createStore(draft => {draft.total = items.length}, {total: 0})
setCache(draft => {draft.total = 2})
void cache
