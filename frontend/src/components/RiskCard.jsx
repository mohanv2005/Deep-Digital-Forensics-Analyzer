import { useState } from 'react'

// Shared cache: all RiskCards reuse the same downloaded timeline.
let timelinePromise = null
const evidenceCache = new Map()

async function getEvidenceById(eventId) {
  if (evidenceCache.has(eventId)) {
    return evidenceCache.get(eventId)
  }

  if (!timelinePromise) {
    timelinePromise = fetch(
      'http://localhost:8000/outputs/constructor_output/timeline.json'
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Timeline request failed: ${response.status}`)
        }
        return response.json()
      })
      .catch((error) => {
        timelinePromise = null
        throw error
      })
  }

  const timeline = await timelinePromise
  const evidence = timeline.find((item) => item.id === eventId)

  if (evidence) {
    evidenceCache.set(eventId, evidence)
  }

  return evidence || null
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Not available'

  const date = new Date(timestamp)

  return Number.isNaN(date.getTime())
    ? timestamp
    : date.toLocaleString()
}

// Displays strings, numbers, arrays and nested objects.
function EvidenceValue({ value }) {
  if (value === null || value === undefined || value === '') {
    return <span className="evidence-empty">Not available</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="evidence-empty">Empty</span>
    }

    return (
      <ul className="evidence-array">
        {value.map((item, index) => (
          <li key={index}>
            <EvidenceValue value={item} />
          </li>
        ))}
      </ul>
    )
  }

  if (typeof value === 'object') {
    return (
      <div className="evidence-nested">
        {Object.entries(value).map(([key, nestedValue]) => (
          <div className="evidence-field" key={key}>
            <span className="evidence-label">{key}</span>
            <div className="evidence-value">
              <EvidenceValue value={nestedValue} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return <span className="evidence-value-text">{String(value)}</span>
}

function EvidenceDetails({ evidence }) {
  const details = evidence.data || {}
  const eventData = details.data || {}

  return (
    <div className="evidence-panel">
      <h4>Evidence Details</h4>

      <div className="evidence-metadata">
        {[
          ['Category', evidence.category],
          ['Description', details.description],
          ['ID', evidence.id],
          ['Source', evidence.source || details.source],
          ['Timestamp', formatTimestamp(evidence.timestamp)],
          ['Type', details.type || evidence.category]
        ].map(([label, value]) => (
          <div className="evidence-field" key={label}>
            <span className="evidence-label">{label}</span>
            <div className="evidence-value">
              <EvidenceValue value={value} />
            </div>
          </div>
        ))}
      </div>

      <h4>Event Data</h4>

      {Object.keys(eventData).length > 0 ? (
        <div className="evidence-data">
          {Object.entries(eventData).map(([key, value]) => (
            <div className="evidence-field" key={key}>
              <span className="evidence-label">{key}</span>
              <div className="evidence-value">
                <EvidenceValue value={value} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No additional event data available.</p>
      )}

      {details.raw && (
        <details className="evidence-raw">
          <summary>View Raw Evidence</summary>
          <pre>{details.raw}</pre>
        </details>
      )}
    </div>
  )
}

function RiskCard({ risk }) {
  const [expandedEventId, setExpandedEventId] = useState(null)
  const [selectedEvidence, setSelectedEvidence] = useState(null)
  const [loadingEventId, setLoadingEventId] = useState(null)
  const [evidenceError, setEvidenceError] = useState('')

  async function handleEventClick(eventId) {
    if (expandedEventId === eventId) {
      setExpandedEventId(null)
      setSelectedEvidence(null)
      setEvidenceError('')
      return
    }

    setExpandedEventId(eventId)
    setSelectedEvidence(null)
    setEvidenceError('')
    setLoadingEventId(eventId)

    try {
      const evidence = await getEvidenceById(eventId)

      if (!evidence) {
        setEvidenceError('No matching evidence was found in the timeline.')
      } else {
        setSelectedEvidence(evidence)
      }
    } catch (error) {
      setEvidenceError(error.message || 'Unable to load evidence.')
    } finally {
      setLoadingEventId(null)
    }
  }

  return (
    <div className="risk-card">

      <div className="risk-card-header">
        <div>
          <span className={`severity severity-${risk.severity.toLowerCase()}`}>
            {risk.severity}
          </span>

          <span className="risk-type">
            {risk.type}
          </span>
        </div>

        <div className="risk-score">
          Score: <strong>{risk.score}</strong>
        </div>
      </div>

      <div className="risk-card-id">
        <strong>ID:</strong> {risk.id}
      </div>

      <div className="risk-main-info">
        <div>
          <span className="info-label">Confidence</span>
          <span className="info-value">
            {risk.confidence * 100}%
          </span>
        </div>

        <div>
          <span className="info-label">Start</span>
          <span className="info-value">
            {formatTimestamp(risk.startTime)}
          </span>
        </div>

        <div>
          <span className="info-label">End</span>
          <span className="info-value">
            {formatTimestamp(risk.endTime)}
          </span>
        </div>
      </div>

      <div className="risk-details">

        <details>
          <summary>
            Reasons ({risk.reasons?.length || 0})
          </summary>

          <ul>
            {risk.reasons?.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </details>

        <details>
          <summary>
            Indicators ({risk.indicators?.length || 0})
          </summary>

          <ul>
            {risk.indicators?.map((indicator, index) => (
              <li key={index}>{indicator}</li>
            ))}
          </ul>
        </details>

        <details>
          <summary>
            Event IDs ({risk.eventIds?.length || 0})
          </summary>

          {risk.eventIds?.length > 0 ? (
            <ul className="event-id-list">
              {risk.eventIds.map((eventId, index) => (
                <li key={`${eventId}-${index}`}>
                  <button
                    className="event-id-button"
                    onClick={() => handleEventClick(eventId)}
                  >
                    {expandedEventId === eventId ? '▼' : '▶'} {eventId}
                  </button>

                  {expandedEventId === eventId && (
                    <div>
                      {loadingEventId === eventId && (
                        <p className="evidence-loading">
                          Loading evidence from timeline...
                          This may take a while on the first request.
                        </p>
                      )}

                      {evidenceError && (
                        <p className="evidence-error">
                          {evidenceError}
                        </p>
                      )}

                      {selectedEvidence && (
                        <EvidenceDetails evidence={selectedEvidence} />
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No event IDs available.</p>
          )}
        </details>

        <details>
          <summary>
            Sources ({risk.sources?.length || 0})
          </summary>

          {risk.sources?.length > 0 ? (
            <ul>
              {risk.sources.map((source, index) => (
                <li key={index}>{source}</li>
              ))}
            </ul>
          ) : (
            <p>No source information available.</p>
          )}
        </details>

      </div>
    </div>
  )
}

export default RiskCard
