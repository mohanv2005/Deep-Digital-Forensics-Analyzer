import { useState } from 'react'
import RiskCard from './components/RiskCard'
import './App.css'

function App() {
  const [status, setStatus] = useState('Ready')
  const [runId, setRunId] = useState(null)
  const [riskData, setRiskData] = useState(null)
  const [currentStage, setCurrentStage] = useState('')
  const [logs, setLogs] = useState([])
  const [stageStatuses, setStageStatuses] = useState({
    COLLECTOR: 'Waiting',
    CONSTRUCTOR: 'Waiting',
    CORRELATION: 'Waiting',
    RISK: 'Waiting'
  })

  const actionableRisks = riskData
    ? riskData.filter((risk) => risk.score >= 20)
    : []

  const totalFindings = actionableRisks.length

  const criticalCount = actionableRisks.filter(
    (risk) => risk.severity === 'CRITICAL'
  ).length

  const highCount = actionableRisks.filter(
    (risk) => risk.severity === 'HIGH'
  ).length

  const mediumCount = actionableRisks.filter(
    (risk) => risk.severity === 'MEDIUM'
  ).length

  const lowCount = actionableRisks.filter(
    (risk) => risk.severity === 'LOW'
  ).length

  async function loadRiskData() {
    try {
      const response = await fetch(
        'http://localhost:8000/outputs/risk_output/risk.json'
      )

      const data = await response.json()

      setRiskData(data)
      setStatus('Results loaded')

      console.log('Total findings:', data.length)
      console.log(
        'Actionable findings:',
        data.filter((risk) => risk.score >= 20).length
      )
    } catch (error) {
      console.error('Failed to load risk data:', error)
      setStatus('Failed to load results')
    }
  }


async function startAnalysis() {
  setStatus('Starting...')
  setRiskData(null)
  setRunId(null)
  setCurrentStage('')
  setLogs([])
  setStageStatuses({
    COLLECTOR: 'Waiting',
    CONSTRUCTOR: 'Waiting',
    CORRELATION: 'Waiting',
    RISK: 'Waiting'
  })

  try {
    const response = await fetch('http://localhost:8000/api/runs', {
      method: 'POST'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to start analysis')
    }

    const data = await response.json()

    setRunId(data.runId)
    setStatus('Running')

    const socket = new WebSocket(
      `ws://localhost:8000${data.websocket}`
    )

    socket.onopen = () => {
      console.log('WebSocket connected')
    }

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data)

      console.log('Backend message:', message)

      if (message.type === 'stage') {
        setCurrentStage(message.stage)

        setStageStatuses((previous) => ({
          ...previous,
          [message.stage]: message.status
        }))
      }

      if (message.type === 'log') {
        setLogs((previous) => [
          ...previous,
          {
            stage: message.stage,
            message: message.message,
            timestamp: message.timestamp
          }
        ])
      }

      if (message.type === 'complete') {
        if (message.status === 'success') {
          setStatus('Analysis complete')
          setCurrentStage('Completed')
          loadRiskData()
        } else {
          setStatus('Analysis failed')
        }

        socket.close()
      }

      if (message.type === 'error') {
        setStatus('Analysis failed')

        setLogs((previous) => [
          ...previous,
          {
            stage: 'ERROR',
            message: message.message,
            timestamp: new Date().toISOString()
          }
        ])

        socket.close()
      }
    }

    socket.onerror = () => {
      setStatus('WebSocket connection error')
    }

  } catch (error) {
    console.error(error)
    setStatus(error.message || 'Failed to start analysis')
  }
}


  return (
  <div className="app">

    <header className="app-header">
      <h1>Deep Digital Forensics Analyzer</h1>

      <p className="app-subtitle">
        AI-Assisted Digital Forensic Analysis
      </p>

      <div className="app-actions">
        <button
          className="primary-button"
          onClick={startAnalysis}
        >
          Start Analysis
        </button>

        <button
          className="secondary-button"
          onClick={loadRiskData}
        >
          Load Existing Results
        </button>
      </div>

      <p className="status">
        Status: {status}
      </p>

      {runId && (
        <p className="status">
          Run ID: {runId}
        </p>
      )}

            {runId && (
        <section className="live-monitor">
          <h2>Live Analysis Monitor</h2>

          <p>
            Current Stage: <strong>{currentStage || 'Initializing...'}</strong>
          </p>

          <div className="pipeline-stages">
            {['COLLECTOR', 'CONSTRUCTOR', 'CORRELATION', 'RISK'].map((stage) => (
              <div className="pipeline-stage" key={stage}>
                <strong>{stage}</strong>
                <span>{stageStatuses[stage]}</span>
              </div>
            ))}
          </div>

          <h3>Live Backend Logs</h3>

          <div className="log-container">
            {logs.length === 0 ? (
              <p>Waiting for backend messages...</p>
            ) : (
              logs.map((log, index) => (
                <div className="log-entry" key={index}>
                  <span className="log-stage">[{log.stage}]</span>
                  <span className="log-message">{log.message}</span>
                  <span className="log-time">
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleTimeString()
                      : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      )}


    </header>

    {riskData && (
      <main className="dashboard">

        <section className="summary">
          <h2>Analysis Summary</h2>

          <div className="summary-grid">

            <div className="summary-card">
              <h3>{totalFindings}</h3>
              <p>Total Findings</p>
            </div>

            <div className="summary-card">
              <h3>{criticalCount}</h3>
              <p>Critical</p>
            </div>

            <div className="summary-card">
              <h3>{highCount}</h3>
              <p>High</p>
            </div>

            <div className="summary-card">
              <h3>{mediumCount}</h3>
              <p>Medium</p>
            </div>

            <div className="summary-card">
              <h3>{lowCount}</h3>
              <p>Low</p>
            </div>

          </div>
        </section>

        <section className="findings-section">
          <h2>Risk Findings</h2>

          <div className="findings-list">
            {actionableRisks.map((risk) => (
              <RiskCard
                key={risk.id}
                risk={risk}
              />
            ))}
          </div>
        </section>

      </main>
    )}

  </div>
)
}

export default App