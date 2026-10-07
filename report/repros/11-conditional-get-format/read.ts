import { getRequestEvent, respond } from "@solidjs/web";
export const calls: (string | null)[] = [];

export function read() {
  const headers = {
    etag: '"constant"',
    "cache-control": "private, max-age=0, must-revalidate",
  };
  const conditional = getRequestEvent()!.request.headers.get("if-none-match");
  calls.push(conditional);
  // Call this GET twice in Chrome. Chrome adds If-None-Match itself.
  // The second decoded value is undefined, despite cached { value: 17 }.
  return conditional === '"constant"'
    ? new Response(null, { status: 304, headers })
    : respond({ value: 17 }, { headers });
}
