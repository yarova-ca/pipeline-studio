import { json } from '@sveltejs/kit'
// I-10: liveness is true whenever the process is up.
export function GET() {
  return json({ status: 'ok' })
}
