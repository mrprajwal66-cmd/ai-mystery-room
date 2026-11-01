
const { GoogleGenAI } = require('@google/genai')

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

// Common Gemini API request with retry handling
async function generateWithRetry(prompt) {
  const maxRetries = 3

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gemini request: attempt ${attempt}/${maxRetries}`)

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      })

      if (!response || !response.text) {
        throw new Error('Gemini returned an empty response.')
      }

      return response.text.trim()

    } catch (error) {
      const status = error.status || error.code

      console.error(
        `Gemini API error on attempt ${attempt}:`,
        status,
        error.message
      )

      // API quota exceeded
      if (status === 429) {
        throw new Error(
          'Gemini API quota exceeded. Please try again later.'
        )
      }

      // Temporary server overload
      if (status === 503 && attempt < maxRetries) {
        const delay = attempt * 5000

        console.log(
          `Gemini is busy. Retrying in ${delay / 1000} seconds...`
        )

        await new Promise(resolve =>
          setTimeout(resolve, delay)
        )

        continue
      }

      if (status === 503) {
        throw new Error(
          'Gemini is currently experiencing high demand. Please try again later.'
        )
      }

      // Other errors
      throw error
    }
  }

  throw new Error('Gemini request failed after multiple attempts.')
}


// Generate a new mystery
async function generateMystery(premise, difficulty) {
  const difficultySettings = {
    Easy: { suspects: 3, clues: 5, hints: 2 },
    Medium: { suspects: 4, clues: 7, hints: 3 },
    Hard: { suspects: 5, clues: 9, hints: 3 },
  }

  const settings = difficultySettings[difficulty]

  if (!settings) {
    throw new Error('Invalid difficulty')
  }

  const prompt = `
Create an original mystery investigation game.

Premise: ${premise}
Difficulty: ${difficulty}

Generate exactly:
- ${settings.suspects} suspects
- ${settings.clues} clues
- ${settings.hints} hints

Return only valid JSON with this structure:

{
  "suspects": [
    {
      "name": "Suspect name",
      "description": "Suspect description"
    }
  ],
  "clues": [
    {
      "title": "Clue title",
      "description": "Clue description"
    }
  ],
  "hints": [
    "First helpful hint",
    "Second helpful hint"
  ],
  "solution": {
    "culprit": "Name of the culprit",
    "explanation": "Detailed explanation of the mystery"
  }
}

Important:
- Generate exactly ${settings.suspects} suspects.
- Generate exactly ${settings.clues} clues.
- Generate exactly ${settings.hints} hints.
- Hints must be an array of strings.
- Create one guilty suspect.
- Every clue must support the investigation.
- The solution must logically match the clues.
- Do not reveal the culprit in suspect or clue descriptions.
- Hints must become progressively more helpful.
- Return valid JSON only. No Markdown.
`

  const responseText = await generateWithRetry(prompt)

  // Remove Markdown code fences if Gemini adds them
  const cleanedText = responseText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  let mystery

  try {
    mystery = JSON.parse(cleanedText)
  } catch (error) {
    console.error('Gemini JSON parsing error:', cleanedText)

    throw new Error('Gemini returned invalid JSON.')
  }

  return mystery
}


// Ask a question to a suspect
async function questionSuspect(
  premise,
  suspect,
  question,
  suspects,
  clues
) {
  const prompt = `
You are playing the role of a suspect in a mystery investigation game.

Mystery premise:
${premise}

Your suspect profile:
Name: ${suspect.name}
Description: ${suspect.description}

Other suspects:
${JSON.stringify(suspects)}

Clues discovered by the player:
${JSON.stringify(clues)}

Player's question:
${question}

Instructions:
- Answer as this suspect in a natural conversational style.
- Stay consistent with your suspect's profile.
- Maintain consistency with your previous known information.
- Do not reveal the culprit directly.
- Do not reveal undiscovered clues.
- Do not reveal the final solution.
- You may be defensive or evasive if appropriate.
- Answer the player's actual question.
- Keep your answer between 2 and 5 sentences.
- Do not invent facts that contradict the mystery.
`

  const answer = await generateWithRetry(prompt)

  return answer
}


// Export both functions
module.exports = {
  generateMystery,
  questionSuspect,
}
