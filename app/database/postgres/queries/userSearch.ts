import { dbConnection } from '../connection'

// TODO: handle errors

const saveSearch = async (userId: string, searchTerm: string) => {
  const db = dbConnection()
  const connection = await db.connect()
  const result = await connection.userSearch.create({
    data: {
      userId,
      searchTerm
    }
  })

  return result
}

const deleteSearches = async (userId: string) => {
  const db = dbConnection()
  const connection = await db.connect()
  const result = await connection.userSearch.deleteMany({
    where: {
      userId
    }
  })

  return result
}

const getHistory = async (userId?: string) => {
  if (!userId) return []

  const db = dbConnection()
  const connection = await db.connect()
  const result = await connection.userSearch.findMany({
    where: {
      userId
    },
    distinct: ['searchTerm']
  })

  return result
}

export { saveSearch, deleteSearches, getHistory }
