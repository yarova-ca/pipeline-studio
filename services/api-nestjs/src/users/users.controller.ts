import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { UsersService } from './users.service'
import { CreateItemDto, UpdateItemDto } from './dto'

@ApiTags('items')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/items')
  async listItems(@Req() req: Request) {
    return { items: await this.usersService.listItems((req.user as { id: string }).id) }
  }

  @Post('me/items')
  async createItem(@Req() req: Request, @Body() body: CreateItemDto) {
    return { item: await this.usersService.createItem((req.user as { id: string }).id, body.title, body.description) }
  }

  @Get('me/items/:id')
  async getItem(@Req() req: Request, @Param('id') id: string) {
    return { item: await this.usersService.getItem(id, (req.user as { id: string }).id) }
  }

  @Put('me/items/:id')
  async updateItem(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateItemDto) {
    return { item: await this.usersService.updateItem(id, (req.user as { id: string }).id, body.title, body.description) }
  }

  @Delete('me/items/:id')
  @HttpCode(204)
  async deleteItem(@Req() req: Request, @Param('id') id: string) {
    await this.usersService.deleteItem(id, (req.user as { id: string }).id)
  }
}
