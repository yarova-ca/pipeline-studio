import { json } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'

export async function loader(_: LoaderFunctionArgs) {
  return json({ status: 'ok' })
}
