// Password gate for the whole site. Only requests with the right
// Basic-Auth credentials get through; everyone else gets a login prompt.
export async function onRequest(context) {
  const { request, next, env } = context;
  const pass = env.SITE_PASSWORD || "";
  if (!pass) return next(); // no password set → open (fail-safe during setup)
  const expected = "Basic " + btoa("yarova:" + pass);
  const got = request.headers.get("Authorization") || "";
  // constant-time comparison — string !== leaks length/prefix timing
  const enc = new TextEncoder();
  const a = enc.encode(got), b = enc.encode(expected);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] || 0) ^ (b[i] || 0);
  if (diff !== 0) {
    return new Response("Authentication required.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Yarova Studio", charset="UTF-8"' },
    });
  }
  return next();
}
