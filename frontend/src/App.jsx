import { useState } from 'react'
import RiskCard from './components/RiskCard'
import './App.css'


function getFriendlyLog(log) {
  const message = log.message.trim()
  const stage = log.stage?.toUpperCase()

  const progressMatch = message.match(/(.+?):\s*(\d+)%/)

  if (progressMatch) {
    const percentage = Number(progressMatch[2])

    if (![0, 50, 100].includes(percentage)) {
      return null
    }

    const activity = progressMatch[1].toLowerCase()

    let description = 'Processing investigation data'

    if (activity.includes('extraction')) {
      description = 'Extracting investigation indicators'
    } else if (activity.includes('domain')) {
      description = 'Analyzing website activity'
    } else if (activity.includes('ip')) {
      description = 'Analyzing network addresses'
    } else if (activity.includes('file')) {
      description = 'Analyzing file activity'
    } else if (activity.includes('process')) {
      description = 'Analyzing process activity'
    } else if (activity.includes('cross-source')) {
      description = 'Connecting related activities across evidence sources'
    }

    return `${description} — ${percentage}%`
  }

  if (stage === 'COLLECTOR') {
    if (/Reading (System|Application|Security)/i.test(message)) {
      return null
    }

    if (/Collecting historical Windows events/i.test(message)) {
      return null
    }

    if (/Collecting historical network events/i.test(message)) {
      return 'Collecting network activity'
    }

    if (/Collecting historical process creation events/i.test(message)) {
      return 'Collecting process activity'
    }

    if (/Collection complete\. Events:\s*(\d+)/i.test(message)) {
      const count = Number(message.match(/Events:\s*(\d+)/i)[1])
      return `Collected ${count.toLocaleString()} events`
    }

    if (/Collecting Windows event logs/i.test(message)) {
      return 'Collecting Windows event logs'
    }

    if (/Collecting browser history/i.test(message)) {
      return 'Collecting browser history'
    }

    if (/Writing evidence/i.test(message)) {
      return 'Saving collected evidence'
    }

    if (/Evidence written successfully/i.test(message)) {
      return 'Evidence saved successfully'
    }

    if (/Collection complete/i.test(message)) {
      return 'Evidence collection completed'
    }

    if (/^Collected:|^Windows events:|^Browser events:|^Network events:|^Process events:/i.test(message)) {
      return null
    }

    if (/^Deep AI Digital Forensics Collector$|^=+$/.test(message)) {
      return null
    }
  }

  if (stage === 'CONSTRUCTOR') {
    if (/Input:|Output:|Loaded evidence:|Timeline events:/i.test(message)) {
      if (/Timeline events:/i.test(message)) {
        return 'Building the investigation timeline'
      }
      return null
    }

    return null
  }

  if (stage === 'CORRELATION') {
    if (/Extracting indicators/i.test(message)) {
      return 'Extracting investigation indicators'
    }

    if (/Processing domain index/i.test(message)) {
      return 'Analyzing website activity'
    }

    if (/Processing IP index/i.test(message)) {
      return 'Analyzing network addresses'
    }

    if (/Processing file index/i.test(message)) {
      return 'Analyzing file activity'
    }

    if (/Processing process index/i.test(message)) {
      return 'Analyzing process activity'
    }

    if (/Building cross-source activity graph/i.test(message)) {
      return 'Connecting related activities across evidence sources'
    }

    if (/Cross-source processing domain index/i.test(message)) {
      return 'Connecting website activity across evidence sources'
    }

    if (/Cross-source processing IP index/i.test(message)) {
      return 'Connecting network activity across evidence sources'
    }

    if (/Cross-source processing file index/i.test(message)) {
      return 'Connecting file activity across evidence sources'
    }

    if (/Cross-source processing process index/i.test(message)) {
      return 'Connecting process activity across evidence sources'
    }

    if (/Generated (\d+) correlations/i.test(message)) {
      const count = Number(message.match(/Generated (\d+) correlations/i)[1])
      return `Found ${count.toLocaleString()} relationships between activities`
    }

    if (/Loaded \d+ evidence events|Evidence window:|Latest evidence:|Events removed:|Events retained:|Index sizes:|Finished .* index|Indicator extraction complete|Cross-source activities:|Entity correlations:|Cross-source correlations:|Process tree correlations:|Process-network correlations:|File activity correlations:|Suspicious activity chains:|Total correlations:|Output:/i.test(message)) {
      return null
    }
  }

  if (stage === 'RISK') {
    if (/ProcessRule generated/i.test(message)) {
      return 'Evaluating process activity'
    }

    if (/ProcessTreeRule generated/i.test(message)) {
      return 'Examining related process activity'
    }

    if (/ExecutionPathRule generated/i.test(message)) {
      return 'Checking suspicious execution paths'
    }

    if (/NetworkRule generated/i.test(message)) {
      return 'Analyzing network activity'
    }

    if (/Total signals:|Timeline events:|Correlations:|Activities:|Aggregated findings:/i.test(message)) {
      return null
    }

    if (/Risk analysis completed/i.test(message)) {
      return 'Risk analysis completed'
    }

    if (/Generated (\d+) risk findings/i.test(message)) {
      const count = Number(message.match(/Generated (\d+) risk findings/i)[1])
      return `Generated ${count.toLocaleString()} risk findings`
    }

    if (/Output:/i.test(message)) {
      return null
    }
  }

  return null
}


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
      const friendlyMessage = getFriendlyLog(message)

      if (friendlyMessage) {
        setLogs((previous) => [
          ...previous,
          {
            stage: message.stage,
            message: friendlyMessage,
            timestamp: message.timestamp
          }
        ])
      }
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