// solid-router/README.md: Typed Paths, Match Filters, defineRoute, action.with.
import {createRouter,defineRoute,int,query,action} from '@solidjs/router'
export function documentedRouterTypes() {
  const route = defineRoute({path:'/users/:id',component: p => { const id: string = p.params.id; void id; return null }})
  const Router = createRouter({routes:[route,{path:'/count/:id',matchFilters:{id:int}}]})
  Router.paths.users('alice'); Router.paths.count(3)
  // @ts-expect-error An int-filtered path forbids non-numeric arguments.
  Router.paths.count('three')
  // @ts-expect-error Required route parameters cannot be omitted.
  Router.paths.users()
  const get = query(async (id: number) => id, 'typed-users')
  get(1); get.keyFor(1)
  // @ts-expect-error Query argument types follow the wrapped function.
  get('1')
  const save = action(async (id: number, value: string) => value, 'typed-save')
  const bound = save.with(1); bound('updated')
  // @ts-expect-error Bound action keeps the types of remaining arguments.
  bound(2)
  // @ts-expect-error onSubmit receives the complete original argument tuple.
  save.onSubmit((id: string) => {void id})
}
