// Users controller — CRUD for User's items.
//
// All routes protected by AuthGuard.
//
// GET    /users/me/items       → list all items
// POST   /users/me/items       → create a new item
// GET    /users/me/items/:id   → get one item
// PUT    /users/me/items/:id   → update one item
// DELETE /users/me/items/:id   → delete one item

import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  Body,
} from '@nestjs/common'
import type { Request } from 'express'
import { AuthGuard } from '../auth/auth.guard'
import { UsersService } from './users.service'

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/items')
  async listItems(@Req() req: Request) {
    const user = req.user as { id: string }
    const items = await this.usersService.listItems(user.id)
    return { items }
  }

  @Post('me/items')
  async createItem(
    @Req() req: Request,
    @Body() body: { title?: string; description?: string }
  ) {
    const user = req.user as { id: string }
    const item = await this.usersService.createItem(user.id, body.title!, body.description)
    return { item }
  }

  @Get('me/items/:id')
  async getItem(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string }
    const item = await this.usersService.getItem(id, user.id)
    return { item }
  }

  @Put('me/items/:id')
  async updateItem(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string }
  ) {
    const user = req.user as { id: string }
    const item = await this.usersService.updateItem(id, user.id, body.title, body.description)
    return { item }
  }

  @Delete('me/items/:id')
  @HttpCode(204)
  async deleteItem(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string }
    await this.usersService.deleteItem(id, user.id)
  }
}
