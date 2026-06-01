import { type RequestHandler } from '@builder.io/qwik-city'

export const onGet: RequestHandler = async ({ json }) => {
  json(200, { status: 'ok', version: '1.0.0' })
}
