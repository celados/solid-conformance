import {createRouter,int,defineRoutes} from '@solidjs/router'
const router = createRouter({routes:defineRoutes([
  {path:'/users/:id',matchFilters:{id:int}},
  {path:'/stories/:id?'},
  {path:'/files/*rest'},
  {path:'/nested',children:[{path:'/:id/settings'}]},
])})
export function runRouterMatching(n: number) {
  return [router.match('/users/'+n)[0]?.params.id, router.match('/users/not-integer').length, router.match('/stories').length,router.match('/stories/'+n)[0]?.params.id,router.match('/files/a/b')[0]?.params.rest,router.match('/nested/'+n+'/settings?tab=x').at(-1)?.params.id,String(router.paths.users(n))]
}
