import pg from 'pg'

const { Pool } = pg

let pool = null

export function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost')
        ? false
        : { rejectUnauthorized: false }
    })
  }
  return pool
}

export async function initDb() {
  const db = getPool()
  if (!db) return false

  await db.query(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      tool TEXT NOT NULL,
      target TEXT NOT NULL,
      result TEXT NOT NULL,
      details TEXT DEFAULT ''
    )
  `)
  console.log('PostgreSQL connected — events table ready')
  return true
}

export async function insertEvent(event) {
  const db = getPool()
  await db.query(
    `INSERT INTO events (id, team_id, timestamp, tool, target, result, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [event.id, event.team_id, event.timestamp, event.tool, event.target, event.result, event.details]
  )
}

export async function getEvents(limit = 100) {
  const db = getPool()
  const { rows } = await db.query(
    `SELECT * FROM events ORDER BY timestamp DESC LIMIT $1`,
    [limit]
  )
  return rows.reverse()
}
