export interface Db {
  ping(): Promise<void>
  findUserByApiKey(key: string): Promise<{ id: string; email: string; name: string; role: string } | null>
  disconnect(): Promise<void>
}
