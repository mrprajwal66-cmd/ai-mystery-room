
require('dotenv').config()

const { GoogleGenAI } = require('@google/genai')

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

async function testGemini() {
  try {
    console.log('Testing Gemini connection...')

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Reply with: Gemini connection successful',
    })

    console.log('SUCCESS:', response.text)
  } catch (error) {
    console.error('GEMINI ERROR:', error)
  }
}

testGemini()
