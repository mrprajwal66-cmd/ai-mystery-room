
require('dotenv').config()

const { questionSuspect } = require('./services/geminiService')

async function testSuspect() {
  try {
    console.log('Testing Question Suspect...')

    const answer = await questionSuspect(
      'A businessman was found murdered in his office.',
      {
        name: 'Elena Vance',
        description: 'The owner’s personal assistant wearing a royal blue scarf.',
      },
      'Where were you when the incident happened?',
      [
        { name: 'Elena Vance' },
        { name: 'Marcus Reed' },
        { name: 'Julian Sterling' },
      ],
      []
    )

    console.log('SUSPECT ANSWER:', answer)
  } catch (error) {
    console.error('SUSPECT ERROR:', error)
  }
}

testSuspect()
