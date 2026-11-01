const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

const allowedOrigins = [
  'http://localhost:5173',
  'https://ai-mystery-room-lake.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean)

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (Postman, curl, health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  }
}))
app.use(express.json())

const caseRoutes = require('./routes/caseRoutes')
app.use('/api/cases', caseRoutes)

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'AI Mystery Room backend is running!',
  })
})

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'AI Mystery Room API is ready',
  })
})

// MongoDB connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)

    console.log('MongoDB connected successfully!')

    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

connectDB()