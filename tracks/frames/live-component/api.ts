import {isServer} from '@solidjs/web';
import {produce} from './producer';
import {createServerReference,GET,live} from '@solidjs/web/server-functions';
export const story=live(GET(createServerReference((isServer?{id:'live-component',fn:produce}:'live-component') as any)));
