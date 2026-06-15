// Users service — CRUD for Items owned by authenticated users.

import { Injectable, NotFoundException } from '@nestjs/common'
import { prisma } from '../db/client'

@Injectable()
export class UsersService {
  async listItems(userId: string) {
    return prisma.item.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createItem(userId: string, title: string, description?: string) {
    return prisma.item.create({
      data: { title, description: description ?? null, userId },
    })
  }

  async getItem(id: string, userId: string) {
    const item = await prisma.item.findFirst({ where: { id, userId } })
    if (!item) throw new NotFoundException('Item not found')
    return item
  }

  async updateItem(id: string, userId: string, title?: string, description?: string) {
    const existing = await prisma.item.findFirst({ where: { id, userId } })
    if (!existing) throw new NotFoundException('Item not found')
    return prisma.item.update({
      where: { id },
      data: { ...(title && { title }), ...(description !== undefined && { description }) },
    })
  }

  async deleteItem(id: string, userId: string) {
    const existing = await prisma.item.findFirst({ where: { id, userId } })
    if (!existing) throw new NotFoundException('Item not found')
    await prisma.item.delete({ where: { id } })
  }
}
