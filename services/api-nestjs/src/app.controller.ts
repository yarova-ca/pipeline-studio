import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get()
  hello() {
    return { message: 'Hello from NestJS 11.0', framework: '14-nestjs', version: '1.0.0' }
  }
}
