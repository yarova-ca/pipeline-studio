import { HandlerContext } from '$fresh/server.ts'

export const handler = {
  GET(_req: Request, _ctx: HandlerContext) {
    return Response.json({ status: 'ok' })
  },
}
