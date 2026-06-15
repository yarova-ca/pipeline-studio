import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { prisma } from '../db/client'
import { Public } from '../common/public.decorator'

@Controller('health')
export class HealthController {
  @Public() @Get() check() { return { status: 'ok', version: '1.0.0' } }
  @Public() @Get('live') live() { return { status: 'ok' } }
  @Public() @Get('ready')
  async ready() {
    try { await prisma.$queryRaw`SELECT 1`; return { status: 'ready' } }
    catch { throw new ServiceUnavailableException({ status: 'not ready' }) }
  }
}
