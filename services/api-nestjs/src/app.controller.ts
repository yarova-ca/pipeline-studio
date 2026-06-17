import { Controller, Get } from '@nestjs/common'
import { Public } from './common/public.decorator'

@Controller()
export class AppController {
  @Public()
  @Get()
  hello() {
    return { message: 'Hello from NestJS 11.0', framework: '14-nestjs', version: '1.0.0' }
  }
}
