import { PrismaClient } from '@prisma/client'

let dbConnected = false

declare global {
  var __postgresDb__: PrismaClient
}

const dbConnection = (): {
  connect: () => Promise<PrismaClient>
  disconnect: () => Promise<boolean>
} => {
  return {
    connect: async () => {
      if (!global.__postgresDb__) {
        global.__postgresDb__ = new PrismaClient()
        await global.__postgresDb__.$connect()
        dbConnected = true
        console.log('Postgres connection established.')
      }

      return global.__postgresDb__
    },
    disconnect: async () => {
      if (global.__postgresDb__) {
        dbConnected = false
        await global.__postgresDb__.$disconnect()
        console.log('Postgres connection closed.')
      }

      return dbConnected
    }
  }
}

export { dbConnection }
