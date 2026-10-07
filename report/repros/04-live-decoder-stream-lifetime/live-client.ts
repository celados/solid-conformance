import { live, GET, createServerReference } from "@solidjs/web/server-functions/client";
const values: number[] = [];
const status: string[] = [];
const source = live(GET(createServerReference("standing")))() as any;
source.onstatus = (state: string) => status.push(state);
(window as any).state = { values, status };
void (async () => {
  for await (const value of source) values.push(value);
})().catch((error) => ((window as any).state.error = String(error)));
