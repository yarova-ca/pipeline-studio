import { Controller, Get } from '@nestjs/common'

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', version: '1.0.0' }
  }

  @Get('live')
  liveness() {
    return { status: 'ok' }
  }

  @Get('ready')
  readiness() {
    return { status: 'ok' }
  }
}
