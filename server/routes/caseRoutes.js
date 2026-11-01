
const express = require('express')
const mongoose = require('mongoose')
const Case = require('../models/Case')
const {
  generateMystery,
  questionSuspect,
} = require('../services/geminiService')

const router = express.Router()


// ==========================================
// GET CASE HISTORY AND DASHBOARD STATISTICS
// ==========================================
router.get('/history', async (req, res) => {
  try {
    const [
      totalCases,
      completedCases,
      scoreSummary,
      cases,
    ] = await Promise.all([
      Case.countDocuments(),

      Case.countDocuments({
        status: 'completed',
      }),

      Case.aggregate([
        {
          $match: {
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            averageScore: {
              $avg: '$score',
            },
          },
        },
      ]),

      Case.find({})
        .select(
          'premise difficulty status accusation score createdAt'
        )
        .sort({ createdAt: -1 })
        .limit(50),
    ])

    const averageScore = scoreSummary.length
      ? Math.round(scoreSummary[0].averageScore || 0)
      : 0

    return res.status(200).json({
      message: 'Case history retrieved successfully!',

      statistics: {
        totalCases,
        completedCases,
        averageScore,
      },

      cases,
    })

  } catch (error) {
    console.error('Case history error:', error.message)

    return res.status(500).json({
      message: 'Unable to retrieve case history.',
    })
  }
})


// ==========================================
// GET INDIVIDUAL CASE DETAILS
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid case ID.',
      })
    }

    const caseData = await Case.findById(id)
      .select('-solution -hints')

    if (!caseData) {
      return res.status(404).json({
        message: 'Case not found.',
      })
    }

    // Convert Mongoose document to a normal object
    const safeCase = caseData.toObject()

    // Hide descriptions of undiscovered clues
    safeCase.clues = safeCase.clues.map((clue) => ({
      ...clue,
      description: clue.isDiscovered
        ? clue.description
        : '',
    }))

    return res.status(200).json({
      message: 'Case details retrieved successfully!',
      case: safeCase,
    })

  } catch (error) {
    console.error('Get case details error:', error.message)

    return res.status(500).json({
      message: 'Unable to retrieve case details.',
    })
  }
})


// ==========================================
// CREATE A GEMINI-GENERATED MYSTERY
// ==========================================
router.post('/', async (req, res) => {
  try {
    const { premise, difficulty } = req.body

    if (!premise || !difficulty) {
      return res.status(400).json({
        message: 'Premise and difficulty are required',
      })
    }

    if (
      typeof premise !== 'string' ||
      premise.trim().length > 1000
    ) {
      return res.status(400).json({
        message: 'Premise must be a string with a maximum of 1000 characters',
      })
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({
        message: 'Difficulty must be Easy, Medium, or Hard',
      })
    }

    const mystery = await generateMystery(
      premise.trim(),
      difficulty
    )

    const expectedHints = {
      Easy: 2,
      Medium: 3,
      Hard: 3,
    }

    if (
      !Array.isArray(mystery.hints) ||
      mystery.hints.length !== expectedHints[difficulty]
    ) {
      return res.status(500).json({
        message: 'AI generated an incorrect number of hints. Please try again.',
      })
    }

    const expectedCounts = {
      Easy: { suspects: 3, clues: 5 },
      Medium: { suspects: 4, clues: 7 },
      Hard: { suspects: 5, clues: 9 },
    }

    if (
      !Array.isArray(mystery.suspects) ||
      !Array.isArray(mystery.clues) ||
      mystery.suspects.length !== expectedCounts[difficulty].suspects ||
      mystery.clues.length !== expectedCounts[difficulty].clues ||
      !mystery.solution?.culprit ||
      !mystery.solution?.explanation ||
      !mystery.suspects.some(
        (suspect) => suspect.name === mystery.solution.culprit
      )
    ) {
      throw new Error('Gemini generated an invalid mystery')
    }

    const newCase = new Case({
      premise: premise.trim(),
      difficulty,
      suspects: mystery.suspects,
      clues: mystery.clues,
      hints: mystery.hints,
      solution: mystery.solution,
    })

    const savedCase = await newCase.save()

    // Never send the solution to the frontend
    return res.status(201).json({
      message: 'Mystery generated successfully!',
      case: {
        id: savedCase._id,
        premise: savedCase.premise,
        difficulty: savedCase.difficulty,
        suspects: savedCase.suspects,
        clues: savedCase.clues,
      },
    })

  } catch (error) {
    console.error('Mystery creation error:', error.message)

    return res.status(500).json({
      message: 'Unable to generate mystery. Please try again.',
    })
  }
})


// ==========================================
// ASK A QUESTION TO A SUSPECT
// ==========================================
router.post('/:id/suspects/:suspectId/question', async (req, res) => {
  try {
    const { id, suspectId } = req.params
    const { question } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid case ID.',
      })
    }

    if (
      typeof question !== 'string' ||
      !question.trim() ||
      question.trim().length > 500
    ) {
      return res.status(400).json({
        message: 'Question is required and must be under 500 characters',
      })
    }

    const caseData = await Case.findById(id)

    if (!caseData) {
      return res.status(404).json({
        message: 'Mystery case not found',
      })
    }

    if (caseData.status === 'completed') {
      return res.status(400).json({
        message: 'This mystery is already completed',
      })
    }

    const suspect = caseData.suspects.id(suspectId)

    if (!suspect) {
      return res.status(404).json({
        message: 'Suspect not found',
      })
    }

    const discoveredClues = caseData.clues
      .filter((clue) => clue.isDiscovered)
      .map((clue) => ({
        title: clue.title,
        description: clue.description,
      }))

    const answer = await questionSuspect(
      caseData.premise,
      suspect,
      question.trim(),
      caseData.suspects,
      discoveredClues
    )

    return res.status(200).json({
      message: 'Suspect answered successfully!',
      suspectName: suspect.name,
      question: question.trim(),
      answer,
    })

  } catch (error) {
    console.error('Suspect question error:', error.message)

    return res.status(500).json({
      message: 'Unable to get an answer from the suspect',
    })
  }
})


// ==========================================
// DISCOVER A CLUE
// ==========================================
router.post('/:id/clues/:clueId/discover', async (req, res) => {
  try {
    const { id, clueId } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid case ID.',
      })
    }

    const caseData = await Case.findById(id)

    if (!caseData) {
      return res.status(404).json({
        message: 'Mystery case not found',
      })
    }

    if (caseData.status === 'completed') {
      return res.status(400).json({
        message: 'This mystery is already completed',
      })
    }

    const clue = caseData.clues.id(clueId)

    if (!clue) {
      return res.status(404).json({
        message: 'Clue not found',
      })
    }

    if (clue.isDiscovered) {
      return res.status(400).json({
        message: 'This clue has already been discovered',
      })
    }

    clue.isDiscovered = true

    await caseData.save()

    return res.status(200).json({
      message: 'Clue discovered successfully!',
      clue: {
        id: clue._id,
        title: clue.title,
        description: clue.description,
        isDiscovered: clue.isDiscovered,
      },
      score: caseData.score,
    })

  } catch (error) {
    console.error('Clue discovery error:', error.message)

    return res.status(500).json({
      message: 'Unable to discover clue',
    })
  }
})


// ==========================================
// REQUEST A HINT
// ==========================================
router.post('/:id/hints', async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid case ID.',
      })
    }

    const caseData = await Case.findById(id)

    if (!caseData) {
      return res.status(404).json({
        message: 'Mystery case not found',
      })
    }

    if (caseData.status === 'completed') {
      return res.status(400).json({
        message: 'This mystery is already completed',
      })
    }

    const hintLimits = {
      Easy: 2,
      Medium: 3,
      Hard: 3,
    }

    const maxHints = hintLimits[caseData.difficulty]

    if (caseData.hintsUsed >= maxHints) {
      return res.status(400).json({
        message: 'You have used all available hints',
      })
    }

    const hint = caseData.hints[caseData.hintsUsed]

    if (!hint) {
      return res.status(500).json({
        message: 'Hint is unavailable',
      })
    }

    caseData.hintsUsed += 1

    caseData.score = Math.max(
      0,
      caseData.score - 10
    )

    await caseData.save()

    return res.status(200).json({
      message: 'Hint received successfully!',
      hint,
      hintsUsed: caseData.hintsUsed,
      remainingHints: maxHints - caseData.hintsUsed,
      score: caseData.score,
    })

  } catch (error) {
    console.error('Hint error:', error.message)

    return res.status(500).json({
      message: 'Unable to provide hint',
    })
  }
})


// ==========================================
// ACCUSE A SUSPECT
// ==========================================
router.post('/:id/accuse', async (req, res) => {
  try {
    const { id } = req.params
    const { suspectName } = req.body

    const baseScores = {
      Easy: 100,
      Medium: 150,
      Hard: 200,
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid case ID.',
      })
    }

    if (!suspectName || typeof suspectName !== 'string') {
      return res.status(400).json({
        message: 'Suspect name is required',
      })
    }

    const caseData = await Case.findById(id)

    if (!caseData) {
      return res.status(404).json({
        message: 'Mystery case not found',
      })
    }

    if (caseData.status === 'completed') {
      return res.status(400).json({
        message: 'This mystery is already completed',
      })
    }

    const discoveredClues = caseData.clues.filter(
      (clue) => clue.isDiscovered
    ).length

    if (discoveredClues < 3) {
      return res.status(400).json({
        message: 'Discover at least 3 clues before accusing a suspect.',
      })
    }

    const selectedSuspect = caseData.suspects.find(
      (suspect) =>
        suspect.name.toLowerCase() === suspectName.trim().toLowerCase()
    )

    if (!selectedSuspect) {
      return res.status(400).json({
        message: 'Invalid suspect name',
      })
    }

    const isCorrect =
      selectedSuspect.name === caseData.solution.culprit

    if (isCorrect) {
      caseData.score = Math.max(
        0,
        baseScores[caseData.difficulty] +
          discoveredClues * 5 -
          caseData.hintsUsed * 10
      )
    } else {
      caseData.score = 0
    }

    caseData.accusation = selectedSuspect.name
    caseData.status = 'completed'

    await caseData.save()

    return res.status(200).json({
      message: 'Accusation submitted successfully!',
      correct: isCorrect,
      score: caseData.score,
      status: caseData.status,
    })

  } catch (error) {
    console.error('Accusation error:', error.message)

    return res.status(500).json({
      message: 'Unable to submit accusation',
    })
  }
})


// ==========================================
// GET MYSTERY RESULT
// ==========================================
router.get('/:id/result', async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid case ID.',
      })
    }

    const caseData = await Case.findById(id)

    if (!caseData) {
      return res.status(404).json({
        message: 'Mystery case not found',
      })
    }

    if (caseData.status !== 'completed') {
      return res.status(403).json({
        message: 'Submit your accusation to view the result',
      })
    }

    const isCorrect =
      caseData.accusation === caseData.solution.culprit

    return res.status(200).json({
      message: 'Mystery result retrieved successfully!',
      result: {
        accusation: caseData.accusation,
        correct: isCorrect,
        culprit: caseData.solution.culprit,
        explanation: caseData.solution.explanation,
        score: caseData.score,
        difficulty: caseData.difficulty,
      },
    })

  } catch (error) {
    console.error('Result error:', error.message)

    return res.status(500).json({
      message: 'Unable to retrieve mystery result',
    })
  }
})


module.exports = router
