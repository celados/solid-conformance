import {test,expect} from 'bun:test';
import {transformDirectives} from '@solidjs/compiler';
import {createServerReference,GET,getServerFunctionMetadata} from '@solidjs/web/server-functions/client';
test('RFC10 L41:8 module-level GET stays server-side while function-level and consumer GET declare client transport',()=>{
 const filename='/fixture/read.ts',root='/fixture';
 const module='"use server";import {GET} from "@solidjs/web/server-functions";export const read=GET(async()=>17);';
 const functionLevel='import {GET} from "@solidjs/web/server-functions";export const read=GET(async()=>{"use server";return 17});';
 for(const env of ['development','production'] as const){
  const client=transformDirectives(module,{filename,root,mode:'client',env});
  const server=transformDirectives(module,{filename,root,mode:'server',env});
  expect(client.valid).toBe(true);expect(client.functions).toHaveLength(1);expect(client.code).not.toContain('GET');expect(client.code).toContain('createServerReference');expect(server.code).toContain('GET(async');expect(server.code).toContain('registerServerReference');
  const expression=transformDirectives(functionLevel,{filename,root,mode:'client',env});expect(expression.code).toContain('GET(createServerReference');
  const reference=createServerReference(client.functions[0]!.id);expect(getServerFunctionMetadata(reference)?.method).toBeUndefined();const consumer=GET(reference);expect(getServerFunctionMetadata(consumer)?.method).toBe('GET');expect(consumer.id).toBe(reference.id);
 }
});
