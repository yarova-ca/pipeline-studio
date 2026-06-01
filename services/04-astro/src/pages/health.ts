import type { APIRoute } from 'astro'

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ status: 'ok', version: '1.0.0' }), {
    headers: { 'Content-Type': 'application/json' },
  })
