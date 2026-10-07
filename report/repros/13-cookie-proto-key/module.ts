import { parseCookieHeader } from "@solidjs/web";

export const parse = () => {
  const cookies = parseCookieHeader("__proto__=x"); // Parse a valid cookie name.
  console.log(cookies.__proto__); // Object.prototype, rather than "x".
  console.log(Object.hasOwn(cookies, "__proto__")); // false, rather than true.
  return cookies;
};
