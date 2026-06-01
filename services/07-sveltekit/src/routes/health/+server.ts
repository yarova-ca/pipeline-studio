import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = () => json({ status: 'ok', version: '1.0.0' })
