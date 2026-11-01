
import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api/cases'

function App() {
  const [premise, setPremise] = useState('')
  const [difficulty, setDifficulty] = useState('Medium')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [caseData, setCaseData] = useState(null)
  const [discoveringClue, setDiscoveringClue] = useState(null)
  const [score, setScore] = useState(0)
  const [hint, setHint] = useState('')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [gettingHint, setGettingHint] = useState(false)
  const [selectedSuspect, setSelectedSuspect] = useState('')
  const [accusing, setAccusing] = useState(false)
  const [activeSuspectId, setActiveSuspectId] = useState('')
  const [suspectQuestion, setSuspectQuestion] = useState('')
  const [suspectAnswer, setSuspectAnswer] = useState('')
  const [askingQuestion, setAskingQuestion] = useState(false)
  const [accusationResult, setAccusationResult] = useState(null)
  const [finalResult, setFinalResult] = useState(null)

  // Dashboard
  const [historyData, setHistoryData] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')

  // Previous investigation viewer
  const [viewingCase, setViewingCase] = useState(null)
  const [viewingResult, setViewingResult] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState('')

  const fetchCaseHistory = async () => {
    try {
      setHistoryLoading(true)
      setHistoryError('')
      const response = await axios.get(`${API_URL}/history`)
      setHistoryData(response.data)
    } catch (error) {
      console.error('Dashboard history error:', error)
      setHistoryError(
        error.response?.data?.message ||
        'Unable to load investigation history.'
      )
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchCaseHistory()
  }, [])

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  // View a previous investigation
  const handleViewCase = async (caseId) => {
    try {
      setViewLoading(true)
      setViewError('')
      setViewingCase(null)
      setViewingResult(null)

      const response = await axios.get(`${API_URL}/${caseId}`)
      const savedCase = response.data.case

      setViewingCase(savedCase)

      // Reveal the solution only if the case is completed
      if (savedCase.status === 'completed') {
        const resultResponse = await axios.get(
          `${API_URL}/${caseId}/result`
        )
        setViewingResult(resultResponse.data.result)
      }

      setTimeout(() => scrollToSection('case-details-section'), 100)
    } catch (error) {
      console.error('View case error:', error)
      setViewError(
        error.response?.data?.message ||
        'Unable to load this investigation.'
      )
    } finally {
      setViewLoading(false)
    }
  }

  const handleBackToDashboard = () => {
    setViewingCase(null)
    setViewingResult(null)
    setViewError('')
    setTimeout(() => scrollToSection('dashboard-section'), 50)
  }

  // Create mystery
  const handleStart = async (event) => {
    event.preventDefault()

    if (!premise.trim()) {
      setMessage('Please enter a mystery premise first.')
      return
    }

    try {
      setLoading(true)
      setMessage('')
      setCaseData(null)
      setViewingCase(null)
      setScore(0)
      setHint('')
      setHintsUsed(0)
      setSelectedSuspect('')
      setActiveSuspectId('')
      setSuspectQuestion('')
      setSuspectAnswer('')
      setAccusationResult(null)
      setFinalResult(null)

      const response = await axios.post(API_URL, {
        premise: premise.trim(),
        difficulty,
      })

      setCaseData(response.data.case)
      setMessage('Your mystery has been created successfully!')
      await fetchCaseHistory()
      setTimeout(() => scrollToSection('suspects-section'), 100)
    } catch (error) {
      console.error('Mystery creation error:', error)
      setMessage(
        error.response?.data?.message ||
        'Unable to create mystery. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Discover clue
  const handleDiscoverClue = async (clueId) => {
    try {
      setDiscoveringClue(clueId)

      const response = await axios.post(
        `${API_URL}/${caseData.id}/clues/${clueId}/discover`
      )

      setCaseData((previous) => ({
        ...previous,
        clues: previous.clues.map((clue) =>
          clue._id === clueId
            ? { ...clue, isDiscovered: true }
            : clue
        ),
      }))

      setScore(response.data.score)
    } catch (error) {
      console.error('Clue discovery error:', error)
      setMessage(
        error.response?.data?.message || 'Unable to discover clue.'
      )
    } finally {
      setDiscoveringClue(null)
    }
  }

  // Get hint
  const handleGetHint = async () => {
    try {
      setGettingHint(true)
      setMessage('')

      const response = await axios.post(
        `${API_URL}/${caseData.id}/hints`
      )

      setHint(response.data.hint)
      setHintsUsed(response.data.hintsUsed)
      setScore(response.data.score)
    } catch (error) {
      console.error('Hint error:', error)
      setMessage(
        error.response?.data?.message || 'Unable to get a hint.'
      )
    } finally {
      setGettingHint(false)
    }
  }

  // Question suspect
  const handleAskSuspect = async () => {
    if (!activeSuspectId || !suspectQuestion.trim()) {
      setMessage('Please select a suspect and enter a question.')
      return
    }

    try {
      setAskingQuestion(true)
      setMessage('')
      setSuspectAnswer('')

      const response = await axios.post(
        `${API_URL}/${caseData.id}/suspects/${activeSuspectId}/question`,
        { question: suspectQuestion.trim() }
      )

      setSuspectAnswer(response.data.answer)
      setSuspectQuestion('')
    } catch (error) {
      console.error('Suspect question error:', error)
      setMessage(
        error.response?.data?.message ||
        'Unable to get an answer from the suspect.'
      )
    } finally {
      setAskingQuestion(false)
    }
  }

  // Accuse suspect
  const handleAccuse = async () => {
    if (!selectedSuspect) {
      setMessage('Please select a suspect first.')
      return
    }

    try {
      setAccusing(true)
      setMessage('')

      const accusationResponse = await axios.post(
        `${API_URL}/${caseData.id}/accuse`,
        { suspectName: selectedSuspect }
      )

      setAccusationResult(accusationResponse.data)

      const resultResponse = await axios.get(
        `${API_URL}/${caseData.id}/result`
      )

      setFinalResult(resultResponse.data.result)
      setScore(resultResponse.data.result.score)
      await fetchCaseHistory()
    } catch (error) {
      console.error('Accusation error:', error)
      setMessage(
        error.response?.data?.message ||
        'Unable to submit your accusation.'
      )
    } finally {
      setAccusing(false)
    }
  }

  // Play another mystery
  const handlePlayAgain = () => {
    setCaseData(null)
    setScore(0)
    setHint('')
    setHintsUsed(0)
    setSelectedSuspect('')
    setActiveSuspectId('')
    setSuspectQuestion('')
    setSuspectAnswer('')
    setAccusationResult(null)
    setFinalResult(null)
    setMessage('You can create a new mystery now!')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const discoveredCount = caseData
    ? caseData.clues.filter((clue) => clue.isDiscovered).length
    : 0

  const totalClues = caseData ? caseData.clues.length : 0

  const progressPercentage = totalClues > 0
    ? (discoveredCount / totalClues) * 100
    : 0

  const maxScores = { Easy: 125, Medium: 185, Hard: 245 }

  const percentage = finalResult && maxScores[caseData?.difficulty]
    ? (finalResult.score / maxScores[caseData.difficulty]) * 100
    : 0

  const rating =
    percentage >= 90
      ? 'Master Detective'
      : percentage >= 70
        ? 'Expert Investigator'
        : percentage >= 40
          ? 'Skilled Investigator'
          : 'Beginner Detective'

  const cardStyle =
    'rounded-2xl border border-amber-400/15 bg-gradient-to-br from-[#192334] to-[#101722] p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/50 hover:shadow-amber-400/5'

  const buttonStyle =
    'rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-5 py-3 font-bold text-gray-950 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-yellow-300 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0'

  const statistics = historyData?.statistics || {
    totalCases: 0,
    completedCases: 0,
    averageScore: 0,
  }

  const activeCases = Math.max(
    0,
    statistics.totalCases - statistics.completedCases
  )

  const recentCases = historyData?.cases || []

  const formatDate = (date) => {
    if (!date) return 'Date unavailable'
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090d16]/90 px-6 py-5 backdrop-blur-xl md:px-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-2xl">
              🕵️
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-widest text-amber-400">
                MYSTERY ROOM
              </h1>
              <p className="text-xs tracking-wide text-gray-500">
                AI DETECTIVE EXPERIENCE
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                handleBackToDashboard()
                scrollToSection('dashboard-section')
              }}
              className="rounded-lg border border-amber-400/30 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-400/10"
            >
              📊 Dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                setViewingCase(null)
                scrollToSection('create-section')
              }}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-gray-950 transition hover:bg-yellow-300"
            >
              + New Case
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">

        {/* HERO */}
        <section className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/5 px-5 py-2 text-xs font-semibold tracking-widest text-amber-300">
            ✦ YOUR NEXT CASE AWAITS ✦
          </div>

          <h2 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Every mystery has a secret.
            <span className="mt-2 block bg-gradient-to-r from-amber-300 to-yellow-600 bg-clip-text text-transparent">
              Can you uncover it?
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-400 md:text-lg">
            Investigate suspects, discover hidden clues, question witnesses,
            and follow the evidence. Every decision brings you closer to the truth.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-gray-400">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">🔎 Discover Evidence</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">🕵️ Question Suspects</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">⚖️ Solve the Mystery</span>
          </div>
        </section>

        {/* DASHBOARD */}
        <section id="dashboard-section" className="mb-14 scroll-mt-28">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-amber-400">
                YOUR INVESTIGATION RECORD
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-white">
                Detective Dashboard
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Track your progress and review your previous cases.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchCaseHistory}
              disabled={historyLoading}
              className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/20 disabled:opacity-50"
            >
              {historyLoading ? '⏳ Refreshing...' : '↻ Refresh History'}
            </button>
          </div>

          {historyError && (
            <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              {historyError}
              <button type="button" onClick={fetchCaseHistory} className="ml-2 underline">
                Try again
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Cases', value: statistics.totalCases, icon: '📁', color: 'text-amber-400', note: 'All investigations created' },
              { label: 'Completed Cases', value: statistics.completedCases, icon: '🏆', color: 'text-green-400', note: 'Investigations finished' },
              { label: 'Active Cases', value: activeCases, icon: '🔎', color: 'text-blue-400', note: 'Investigations in progress' },
              { label: 'Average Score', value: statistics.averageScore, icon: '⭐', color: 'text-yellow-300', note: 'Average completed-case score' },
            ].map((stat) => (
              <div key={stat.label} className={cardStyle}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{stat.label}</span>
                  <span className="text-3xl">{stat.icon}</span>
                </div>
                <p className={`mt-4 text-4xl font-extrabold ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="mt-2 text-xs text-gray-500">{stat.note}</p>
              </div>
            ))}
          </div>

          {/* RECENT INVESTIGATIONS */}
          <div className="mt-8 rounded-3xl border border-amber-400/15 bg-gradient-to-br from-[#192334] to-[#101722] p-5 shadow-xl md:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-white">Recent Investigations</h3>
                <p className="mt-1 text-sm text-gray-400">Your latest 50 cases</p>
              </div>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-400">
                {recentCases.length} Records
              </span>
            </div>

            {historyLoading && !historyData ? (
              <div className="py-12 text-center text-amber-300">
                ⏳ Loading your investigation records...
              </div>
            ) : recentCases.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/20 py-12 text-center">
                <div className="text-4xl">🕵️</div>
                <p className="mt-4 font-semibold text-gray-300">No investigations yet</p>
                <p className="mt-2 text-sm text-gray-500">
                  Create your first mystery to begin your detective journey.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCases.map((item, index) => (
                  <div
                    key={item._id}
                    className="rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-amber-400/30"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-amber-400">
                            CASE #{recentCases.length - index}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.difficulty === 'Easy'
                              ? 'bg-green-400/10 text-green-400'
                              : item.difficulty === 'Medium'
                                ? 'bg-yellow-400/10 text-yellow-300'
                                : 'bg-red-400/10 text-red-400'
                          }`}>
                            {item.difficulty}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === 'completed'
                              ? 'bg-green-400/10 text-green-400'
                              : 'bg-blue-400/10 text-blue-300'
                          }`}>
                            {item.status === 'completed' ? '✓ Completed' : '● Active'}
                          </span>
                        </div>

                        <h4 className="mt-3 break-words font-semibold leading-6 text-gray-200">
                          {item.premise}
                        </h4>
                        <p className="mt-2 text-xs text-gray-500">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>

                      <div className="min-w-20 text-right">
                        <p className="text-xs text-gray-500">
                          {item.status === 'completed' ? 'Final Score' : 'Current Score'}
                        </p>
                        <p className="mt-1 text-2xl font-extrabold text-amber-400">
                          {item.score ?? 0}
                        </p>
                      </div>
                    </div>

                    {item.status === 'completed' && item.accusation && (
                      <div className="mt-4 border-t border-white/10 pt-3 text-sm text-gray-400">
                        Your accusation:
                        <span className="ml-2 font-semibold text-gray-200">
                          {item.accusation}
                        </span>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end border-t border-white/10 pt-4">
                      <button
                        type="button"
                        onClick={() => handleViewCase(item._id)}
                        disabled={viewLoading}
                        className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-5 py-2.5 text-sm font-bold text-amber-300 transition hover:bg-amber-400/20 disabled:opacity-50"
                      >
                        {viewLoading ? '⏳ Loading...' : '📂 View Case'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* PREVIOUS CASE DETAILS */}
        {viewError && (
          <div className="mb-8 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {viewError}
          </div>
        )}

        {viewingCase && (
          <section
            id="case-details-section"
            className="mb-14 scroll-mt-28 space-y-6 rounded-3xl border border-amber-400/20 bg-gradient-to-br from-[#192334] to-[#101722] p-6 shadow-2xl md:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-widest text-amber-400">
                  SAVED INVESTIGATION
                </p>
                <h2 className="mt-2 text-3xl font-extrabold text-white">
                  Case Details
                </h2>
              </div>
              <button
                type="button"
                onClick={handleBackToDashboard}
                className="rounded-xl border border-amber-400/30 px-5 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/10"
              >
                ← Back to Dashboard
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-amber-400/10 px-4 py-2 text-xs font-bold text-amber-300">
                {viewingCase.difficulty} Difficulty
              </span>
              <span className={`rounded-full px-4 py-2 text-xs font-bold ${
                viewingCase.status === 'completed'
                  ? 'bg-green-400/10 text-green-400'
                  : 'bg-blue-400/10 text-blue-300'
              }`}>
                {viewingCase.status === 'completed' ? '✓ Completed' : '● Active'}
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-lg font-bold text-amber-300">Case Premise</h3>
              <p className="mt-3 leading-8 text-gray-300">
                {viewingCase.premise}
              </p>
              <p className="mt-4 text-xs text-gray-500">
                Created: {formatDate(viewingCase.createdAt)}
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-xl font-bold text-white">🕵️ Suspect Profiles</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {(viewingCase.suspects || []).map((suspect, index) => (
                  <div key={suspect._id || index} className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs font-bold text-amber-400">
                      SUSPECT {index + 1}
                    </p>
                    <h4 className="mt-3 text-lg font-bold text-amber-300">
                      {suspect.name}
                    </h4>
                    <p className="mt-2 leading-7 text-gray-400">
                      {suspect.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-xl font-bold text-white">🔎 Evidence & Clues</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {(viewingCase.clues || []).map((clue, index) => (
                  <div key={clue._id || index} className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-400">
                        EVIDENCE #{index + 1}
                      </span>
                      <span className={`text-xs font-bold ${
                        clue.isDiscovered ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        {clue.isDiscovered ? '✓ DISCOVERED' : '🔒 NOT DISCOVERED'}
                      </span>
                    </div>
                    <h4 className="mt-4 font-bold text-white">{clue.title}</h4>
                    <p className="mt-3 leading-7 text-gray-400">
                      {clue.isDiscovered
                        ? clue.description
                        : 'This clue has not been discovered. Its details remain hidden.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {viewingResult ? (
              <div className="space-y-4 rounded-2xl border border-green-400/20 bg-green-400/5 p-6">
                <h3 className="text-xl font-bold text-green-300">
                  🏆 Investigation Result
                </h3>
                <div>
                  <p className="text-xs font-bold tracking-wider text-gray-400">
                    ACTUAL CULPRIT
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-red-400">
                    {viewingResult.culprit}
                  </p>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <h4 className="font-bold text-amber-300">📖 Case Explanation</h4>
                  <p className="mt-3 leading-8 text-gray-300">
                    {viewingResult.explanation}
                  </p>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-sm text-gray-400">Final Score</p>
                  <p className="mt-1 text-4xl font-extrabold text-amber-400">
                    {viewingResult.score ?? viewingCase.score ?? 0}
                  </p>
                </div>
              </div>
            ) : viewingCase.status === 'completed' ? (
              <p className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-300">
                The case is completed, but its result could not be loaded.
              </p>
            ) : (
              <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-4 text-sm text-blue-300">
                This investigation is still active. The culprit and explanation remain hidden until the case is completed.
              </div>
            )}

            <button
              type="button"
              onClick={handleBackToDashboard}
              className={`${buttonStyle} w-full`}
            >
              ← Back to Dashboard
            </button>
          </section>
        )}

        {/* CREATE MYSTERY */}
        <form
          id="create-section"
          onSubmit={handleStart}
          className="mx-auto max-w-4xl scroll-mt-28 rounded-3xl border border-amber-400/20 bg-gradient-to-br from-[#182234] to-[#101722] p-6 shadow-2xl shadow-black/30 md:p-9"
        >
          <div className="mb-7 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-2xl">📁</div>
            <div>
              <h3 className="text-2xl font-bold text-white">Create Your Mystery</h3>
              <p className="mt-1 text-sm text-gray-400">Set up a new investigation.</p>
            </div>
          </div>

          <label htmlFor="premise" className="block text-sm font-semibold text-gray-200">
            Mystery Premise
          </label>
          <textarea
            id="premise"
            value={premise}
            onChange={(event) => {
              setPremise(event.target.value)
              setMessage('')
            }}
            maxLength={1000}
            rows={4}
            placeholder="Example: A valuable diamond disappears from a locked museum room..."
            className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-[#0b111c] p-4 text-gray-100 outline-none transition placeholder:text-gray-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10"
          />
          <div className="mt-2 text-right text-xs text-gray-500">
            {premise.length}/1000 characters
          </div>

          <label htmlFor="difficulty" className="mt-6 block text-sm font-semibold text-gray-200">
            Investigation Difficulty
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="mt-3 w-full rounded-xl border border-white/10 bg-[#0b111c] p-4 text-gray-100 outline-none transition focus:border-amber-400"
          >
            <option value="Easy">Easy — 3 suspects, 5 clues</option>
            <option value="Medium">Medium — 4 suspects, 7 clues</option>
            <option value="Hard">Hard — 5 suspects, 9 clues</option>
          </select>

          <button type="submit" disabled={loading} className={`${buttonStyle} mt-8 w-full py-4`}>
            {loading ? '⏳ Preparing Your Mystery...' : '🔍 Prepare My Mystery →'}
          </button>

          {message && (
            <p role="status" className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
              {message}
            </p>
          )}
        </form>

        {/* ACTIVE MYSTERY GAME */}
        {caseData && (
          <div id="suspects-section" className="mt-12 space-y-8">

            <section className="rounded-3xl border border-amber-400/20 bg-gradient-to-r from-[#1d2a3d] to-[#121a28] p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-amber-400/10 px-4 py-2 text-xs font-bold tracking-wider text-amber-300">
                  CASE FILE OPENED
                </span>
                <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-gray-300">
                  {caseData.difficulty} Difficulty
                </span>
              </div>
              <h3 className="mt-5 text-3xl font-extrabold text-amber-400">
                Your Mystery Is Ready!
              </h3>
              <p className="mt-4 leading-8 text-gray-300">{caseData.premise}</p>
            </section>

            {/* PROGRESS */}
            <section className={cardStyle}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-white">Investigation Progress</h3>
                  <p className="mt-1 text-sm text-gray-400">Collect evidence to unlock your accusation.</p>
                </div>
                <span className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 font-bold text-amber-300">
                  {discoveredCount}/{totalClues} Clues
                </span>
              </div>
              <div className="mt-6 h-4 overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-700"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-gray-400">
                <span>Investigation completion</span>
                <span className="font-bold text-amber-400">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="mt-5 rounded-xl bg-black/20 p-4 text-sm">
                {discoveredCount >= 3 ? (
                  <p className="text-green-400">✓ You have discovered enough clues to make an accusation.</p>
                ) : (
                  <p className="text-amber-300">🔎 Discover {3 - discoveredCount} more clue(s) before making your accusation.</p>
                )}
              </div>
            </section>

            {/* SUSPECTS */}
            <section>
              <div className="mb-5 flex items-center gap-3">
                <span className="text-3xl">🕵️</span>
                <div>
                  <h3 className="text-2xl font-bold text-white">Suspect Profiles</h3>
                  <p className="mt-1 text-sm text-gray-400">Examine each person carefully.</p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {caseData.suspects.map((suspect, index) => (
                  <div key={suspect._id} className={cardStyle}>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-xl">👤</div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">
                        SUSPECT {index + 1}
                      </span>
                    </div>
                    <h4 className="mt-5 text-xl font-bold text-amber-300">{suspect.name}</h4>
                    <p className="mt-3 leading-7 text-gray-400">{suspect.description}</p>
                    <div className="mt-5 border-t border-white/10 pt-4 text-xs text-gray-500">
                      Profile available for questioning
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* QUESTION SUSPECT */}
            <section className={cardStyle}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">💬</span>
                <div>
                  <h3 className="text-xl font-bold text-amber-300">Question a Suspect</h3>
                  <p className="mt-1 text-sm text-gray-400">Ask questions and examine their statements.</p>
                </div>
              </div>

              <label className="mt-6 block text-sm font-semibold text-gray-300">Select Suspect</label>
              <select
                value={activeSuspectId}
                onChange={(event) => {
                  setActiveSuspectId(event.target.value)
                  setSuspectAnswer('')
                }}
                disabled={askingQuestion || !!finalResult}
                className="mt-3 w-full rounded-xl border border-white/10 bg-[#0b111c] p-4 text-white outline-none focus:border-amber-400"
              >
                <option value="">Select a suspect</option>
                {caseData.suspects.map((suspect) => (
                  <option key={suspect._id} value={suspect._id}>{suspect.name}</option>
                ))}
              </select>

              <label className="mt-5 block text-sm font-semibold text-gray-300">Your Question</label>
              <textarea
                value={suspectQuestion}
                onChange={(event) => setSuspectQuestion(event.target.value)}
                placeholder="Where were you when the incident happened?"
                maxLength={500}
                rows={3}
                disabled={askingQuestion || !!finalResult}
                className="mt-3 w-full rounded-xl border border-white/10 bg-[#0b111c] p-4 text-white outline-none placeholder:text-gray-600 focus:border-amber-400"
              />
              <div className="mt-2 text-right text-xs text-gray-500">{suspectQuestion.length}/500 characters</div>

              <button
                type="button"
                onClick={handleAskSuspect}
                disabled={askingQuestion || !activeSuspectId || !suspectQuestion.trim() || !!finalResult}
                className={`${buttonStyle} mt-4 w-full sm:w-auto`}
              >
                {askingQuestion ? '⏳ Waiting for Response...' : '💬 Ask Suspect'}
              </button>

              {suspectAnswer && (
                <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
                  <h4 className="font-bold text-amber-300">🗣️ Suspect's Response</h4>
                  <p className="mt-3 leading-8 text-gray-200">{suspectAnswer}</p>
                </div>
              )}
            </section>

            {/* CLUES */}
            <section id="clues-section" className="scroll-mt-28">
              <div className="mb-5 flex items-center gap-3">
                <span className="text-3xl">🔎</span>
                <div>
                  <h3 className="text-2xl font-bold text-white">Evidence & Clues</h3>
                  <p className="mt-1 text-sm text-gray-400">Discover evidence and connect the details.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {caseData.clues.map((clue, index) => (
                  <div key={clue._id} className={`${cardStyle} ${clue.isDiscovered ? 'border-green-500/30' : ''}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-lg bg-amber-400/10 px-3 py-2 text-sm font-bold text-amber-300">
                        EVIDENCE #{index + 1}
                      </span>
                      {clue.isDiscovered ? (
                        <span className="text-xs font-bold text-green-400">✓ DISCOVERED</span>
                      ) : (
                        <span className="text-xs text-gray-500">🔒 HIDDEN</span>
                      )}
                    </div>
                    <h4 className="mt-5 text-lg font-bold text-white">{clue.title}</h4>
                    {clue.isDiscovered ? (
                      <>
                        <p className="mt-3 leading-7 text-gray-300">{clue.description}</p>
                        <p className="mt-4 text-xs font-semibold text-green-400">✓ Clue discovered (+5 points)</p>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDiscoverClue(clue._id)}
                        disabled={discoveringClue === clue._id || !!finalResult}
                        className={`${buttonStyle} mt-5 w-full`}
                      >
                        {discoveringClue === clue._id ? '⏳ Examining Evidence...' : '🔍 Discover Clue'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* SCORE */}
            <section className="rounded-2xl border border-amber-400/20 bg-gradient-to-r from-[#28200f] to-[#151b26] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-400">Current Investigation Score</p>
                  <p className="mt-2 text-4xl font-extrabold text-amber-400">{score}</p>
                </div>
                <div className="rounded-xl bg-amber-400/10 p-4 text-3xl">🏆</div>
              </div>
            </section>

            {/* HINTS */}
            <section className={cardStyle}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">💡</span>
                <div>
                  <h3 className="text-xl font-bold text-amber-300">Detective Hints</h3>
                  <p className="mt-1 text-sm text-gray-400">Need help connecting the evidence?</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGetHint}
                disabled={gettingHint || !!finalResult}
                className={`${buttonStyle} mt-5 w-full sm:w-auto`}
              >
                {gettingHint ? '⏳ Finding a Hint...' : '💡 Get a Hint'}
              </button>
              {hint && (
                <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-5">
                  <p className="font-bold text-amber-300">Detective Hint #{hintsUsed}</p>
                  <p className="mt-3 leading-7 text-gray-200">{hint}</p>
                </div>
              )}
              <p className="mt-4 text-xs text-gray-500">Hints used: {hintsUsed}</p>
            </section>

            {/* ACCUSATION */}
            <section id="accusation-section" className="scroll-mt-28 rounded-3xl border border-red-400/20 bg-gradient-to-br from-[#261b22] to-[#151722] p-6 md:p-8">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚖️</span>
                <div>
                  <h3 className="text-2xl font-bold text-white">Make Your Accusation</h3>
                  <p className="mt-1 text-sm text-gray-400">Have you found the person responsible?</p>
                </div>
              </div>

              <label className="mt-6 block text-sm font-semibold text-gray-300">Choose the culprit</label>
              <select
                value={selectedSuspect}
                onChange={(event) => setSelectedSuspect(event.target.value)}
                disabled={!!finalResult}
                className="mt-3 w-full rounded-xl border border-white/10 bg-[#0b111c] p-4 text-white outline-none focus:border-amber-400"
              >
                <option value="">Select a suspect</option>
                {caseData.suspects.map((suspect) => (
                  <option key={suspect._id} value={suspect.name}>{suspect.name}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAccuse}
                disabled={accusing || !selectedSuspect || !!finalResult || discoveredCount < 3}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-red-500 to-red-700 px-6 py-4 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:from-red-400 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              >
                {accusing ? '⏳ Checking Your Accusation...' : '⚖️ Submit Final Accusation'}
              </button>

              {discoveredCount < 3 && (
                <p className="mt-3 text-center text-xs text-amber-300">
                  Discover at least 3 clues to unlock this action.
                </p>
              )}
            </section>

            {/* FINAL RESULT */}
            {finalResult && (
              <section className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-[#202a3b] to-[#111722] p-6 shadow-2xl md:p-9">
                <div className="text-center">
                  <div className="text-6xl">{accusationResult?.correct ? '🏆' : '🔍'}</div>
                  <h3 className="mt-5 text-3xl font-extrabold text-amber-400">
                    {accusationResult?.correct ? 'Mystery Solved!' : 'Investigation Completed'}
                  </h3>
                  <p className="mt-3 text-gray-300">
                    {accusationResult?.correct
                      ? 'Congratulations! You identified the correct culprit.'
                      : 'Your accusation was incorrect. Every case makes you a better detective!'}
                  </p>
                </div>

                <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-center">
                  <p className="text-sm text-gray-400">THE ACTUAL CULPRIT</p>
                  <p className="mt-3 text-2xl font-extrabold text-red-400">{finalResult.culprit}</p>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6">
                  <h4 className="text-lg font-bold text-amber-300">📖 Case Explanation</h4>
                  <p className="mt-4 leading-8 text-gray-300">{finalResult.explanation}</p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
                    <p className="text-sm text-gray-400">Clues Discovered</p>
                    <p className="mt-2 text-3xl font-extrabold text-amber-400">{discoveredCount}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
                    <p className="text-sm text-gray-400">Hints Used</p>
                    <p className="mt-2 text-3xl font-extrabold text-amber-400">{hintsUsed}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-7 text-center">
                  <p className="text-sm font-semibold tracking-widest text-gray-400">FINAL DETECTIVE SCORE</p>
                  <p className="mt-4 text-6xl font-extrabold text-amber-400">{finalResult.score}</p>
                  <div className="mx-auto mt-6 max-w-sm rounded-xl bg-black/20 p-5">
                    <p className="text-sm text-gray-400">Detective Performance</p>
                    <p className="mt-3 text-2xl font-bold text-amber-300">{rating}</p>
                  </div>
                </div>

                <button type="button" onClick={handlePlayAgain} className={`${buttonStyle} mt-7 w-full py-4`}>
                  🔄 Play Another Mystery
                </button>
              </section>
            )}
          </div>
        )}

        {/* QUICK NAVIGATION */}
        <section className="mt-14">
          <h3 className="mb-5 text-center text-xl font-bold text-white">Detective Quick Access</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { id: 'clues-section', icon: '🔎', title: 'Discover Clues', description: 'Examine evidence and connect the details.' },
              { id: 'suspects-section', icon: '🕵️', title: 'Question Suspects', description: 'Investigate every suspect and their motives.' },
              { id: 'accusation-section', icon: '⚖️', title: 'Reveal the Truth', description: 'Make your final accusation using the evidence.' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={`${cardStyle} text-left`}
              >
                <div className="text-3xl">{item.icon}</div>
                <h4 className="mt-4 font-bold text-amber-300">{item.title}</h4>
                <p className="mt-2 text-sm leading-6 text-gray-400">{item.description}</p>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#070a11] px-6 py-8 text-center">
        <div className="text-lg font-extrabold tracking-widest text-amber-400">
          MYSTERY ROOM
        </div>
        <p className="mt-3 text-sm text-gray-500">
          AI Mystery Room · Think carefully. Trust the evidence.
        </p>
        <p className="mt-2 text-xs text-gray-600">
          Every clue matters. Every decision counts.
        </p>
      </footer>
    </div>
  )
}

export default App
