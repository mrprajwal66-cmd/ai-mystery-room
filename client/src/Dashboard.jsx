
import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:5000/api/cases/history'

export default function Dashboard() {
  const [historyData, setHistoryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await axios.get(API_URL)
      setHistoryData(response.data)
    } catch (err) {
      console.error('History error:', err)
      setError(
        err.response?.data?.message || 'Unable to load case history.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const statistics = historyData?.statistics || {}
  const totalCases = statistics.totalCases || 0
  const completedCases = statistics.completedCases || 0
  const activeCases = Math.max(0, totalCases - completedCases)
  const averageScore = statistics.averageScore || 0

  const cardStyle = {
    background: '#172033',
    border: '1px solid #303b50',
    borderRadius: '12px',
    padding: '20px',
    flex: '1',
    minWidth: '150px',
  }

  const headingStyle = {
    color: '#d4af37',
    marginBottom: '18px',
  }

  return (
    <section
      id="dashboard"
      style={{
        background: '#0f172a',
        color: '#f8fafc',
        padding: '30px 20px',
        borderRadius: '16px',
        margin: '30px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '25px',
        }}
      >
        <h2 style={{ ...headingStyle, margin: 0 }}>
          Detective Dashboard
        </h2>

        <button
          onClick={fetchHistory}
          disabled={loading}
          style={{
            background: '#d4af37',
            color: '#111827',
            padding: '10px 18px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh Dashboard'}
        </button>
      </div>

      {error && (
        <p style={{ color: '#f87171' }}>{error}</p>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '15px',
          marginBottom: '35px',
        }}
      >
        <div style={cardStyle}>
          <p>Total Cases</p>
          <h2 style={{ color: '#d4af37' }}>{totalCases}</h2>
        </div>

        <div style={cardStyle}>
          <p>Completed Cases</p>
          <h2 style={{ color: '#4ade80' }}>{completedCases}</h2>
        </div>

        <div style={cardStyle}>
          <p>Active Cases</p>
          <h2 style={{ color: '#60a5fa' }}>{activeCases}</h2>
        </div>

        <div style={cardStyle}>
          <p>Average Score</p>
          <h2 style={{ color: '#d4af37' }}>{averageScore}</h2>
        </div>
      </div>

      <h3 style={headingStyle}>Recent Investigations</h3>

      {loading && !historyData && (
        <p>Loading your investigation history...</p>
      )}

      {!loading && historyData?.cases?.length === 0 && (
        <p>No investigations yet. Create your first mystery!</p>
      )}

      <div style={{ display: 'grid', gap: '15px' }}>
        {(historyData?.cases || []).map((item) => (
          <div
            key={item._id}
            style={{
              background: '#172033',
              border: '1px solid #303b50',
              borderRadius: '10px',
              padding: '18px',
            }}
          >
            <h4 style={{ margin: '0 0 10px', color: '#facc15' }}>
              {item.premise}
            </h4>

            <p>
              Difficulty: <strong>{item.difficulty}</strong>
            </p>

            <p>
              Status:{' '}
              <strong
                style={{
                  color:
                    item.status === 'completed'
                      ? '#4ade80'
                      : '#60a5fa',
                }}
              >
                {item.status}
              </strong>
            </p>

            {item.accusation && (
              <p>Accused Suspect: {item.accusation}</p>
            )}

            <p>Score: {item.score ?? 0}</p>

            <small style={{ color: '#94a3b8' }}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : 'Date unavailable'}
            </small>
          </div>
        ))}
      </div>
    </section>
  )
}
