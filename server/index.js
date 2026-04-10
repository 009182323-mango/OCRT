import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3001
const HEROKU_API_KEY = process.env.HEROKU_API_KEY

// In-memory event store (replace with a database for persistence)
const events = []

async function fetchHerokuApps() {
  if (!HEROKU_API_KEY) throw new Error('HEROKU_API_KEY is not set')
  const response = await fetch('https://api.heroku.com/apps', {
    headers: {
      'Authorization': `Bearer ${HEROKU_API_KEY}`,
      'Accept': 'application/vnd.heroku+json; version=3'
    }
  })
  if (!response.ok) throw new Error(`Heroku API error: ${response.status} ${response.statusText}`)
  return response.json()
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Returns an array of team status objects derived from Heroku app data
app.get('/api/status', async (req, res) => {
  try {
    const apps = await fetchHerokuApps()
    const teams = apps.map((app, i) => ({
      team_id: app.name,
      status: app.state === 'errored' ? 'offline' : 'online',
      phase: 1,
      last_action: app.released_at ?? 'No releases',
      last_seen: app.updated_at,
      cidr: `10.0.${i + 1}.0/24`,
      blocked_count: 0,
      event_count: events.filter(e => e.team_id === app.name).length
    }))
    res.json(teams)
  } catch (err) {
    console.error('/api/status error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Returns recent events; POST to this endpoint to submit a new event
app.get('/api/events', (req, res) => {
  res.json(events.slice(-100))
})

app.post('/api/events', (req, res) => {
  const { team_id, tool, target, result, details } = req.body
  if (!team_id || !tool || !target || !result) {
    return res.status(400).json({ error: 'team_id, tool, target, and result are required' })
  }
  const event = {
    id: `evt_${Date.now()}`,
    team_id,
    timestamp: new Date().toISOString(),
    tool,
    target,
    result,
    details: details ?? ''
  }
  events.push(event)
  res.status(201).json(event)
})

app.use(express.static(path.join(__dirname, '../dist')))

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  if (!HEROKU_API_KEY) {
    console.warn('WARNING: HEROKU_API_KEY is not set — /api/status will return errors')
  }
})
