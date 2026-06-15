import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import type { Request, Response } from 'express'
import { logger } from '../logger'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request & { id?: string }>()
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const raw = exception instanceof HttpException ? exception.getResponse() : 'Internal server error'
    const message = typeof raw === 'string' ? raw : ((raw as Record<string, unknown>).message ?? 'Error')
    if (status >= 500) logger.error({ err: exception, reqId: req.id, path: req.url }, 'unhandled error')
    // I-9: client never sees a stack trace or secret
    res.status(status).json({ statusCode: status, error: message, requestId: req.id })
  }
}
