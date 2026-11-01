
const mongoose = require('mongoose')

// Suspect details
const suspectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
})

// Clue details
const clueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  isDiscovered: {
    type: Boolean,
    default: false,
  },
})

// Main case schema
const caseSchema = new mongoose.Schema(
  {
    premise: {
      type: String,
      required: true,
    },

    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
    },

    suspects: [suspectSchema],
    clues: [clueSchema],

    // Keep the solution on the backend
    solution: {
      culprit: {
        type: String,
        required: true,
      },
      explanation: {
        type: String,
        required: true,
      },
    },

    hintsUsed: {
      type: Number,
      default: 0,
    },
    
    hints: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },

    accusation: {
      type: String,
      default: null,
    },

    score: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Case', caseSchema)
