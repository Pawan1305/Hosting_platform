import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './App.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
const POLL_INTERVAL_MS = 3000

function statusTone(status) {
  if (status === 'Completed') return 'success'
  if (status === 'Failed') return 'danger'
  return 'warning'
}

function App() {
  const [form, setForm] = useState({
    clientName: '',
    domain: '',
    image: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [activeDeploymentId, setActiveDeploymentId] = useState('')
  const [activeStatus, setActiveStatus] = useState(null)

  const isTerminalStatus = useMemo(() => {
    if (!activeStatus) return false
    return ['Completed', 'Failed'].includes(activeStatus.status)
  }, [activeStatus])

  async function fetchStatus(id) {
    const response = await axios.get(`${apiBaseUrl}/api/status/${id}`)
    setActiveStatus(response.data)
  }

  async function handleDeploy(event) {
    event.preventDefault()
    setRequestError('')
    setSubmitting(true)

    try {
      const response = await axios.post(`${apiBaseUrl}/api/deploy`, form)
      const nextDeploymentId = response.data.id
      setActiveDeploymentId(nextDeploymentId)
      await fetchStatus(nextDeploymentId)
    } catch (error) {
      const message =
        error.response?.data?.message || 'Deployment request failed. Please try again.'
      setRequestError(message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleInputChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: value
    }))
  }

  useEffect(() => {
    if (!activeDeploymentId) return undefined

    let disposed = false
    let timer = null

    const pollStatus = async () => {
      try {
        const response = await axios.get(
          `${apiBaseUrl}/api/status/${activeDeploymentId}`
        )

        if (disposed) return

        setActiveStatus(response.data)

        if (['Completed', 'Failed'].includes(response.data.status) && timer) {
          clearInterval(timer)
          timer = null
        }
      } catch (error) {
        if (!disposed) {
          setRequestError('Could not fetch live status. Check API connectivity.')
        }
      }
    }

    pollStatus()
    timer = setInterval(pollStatus, POLL_INTERVAL_MS)

    return () => {
      disposed = true
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [activeDeploymentId])

  return (
    <div className="shell">
      <header className="hero">
        <p className="eyebrow">Hosting Platform Control Panel</p>
        <h1>Client Onboarding and Deployment</h1>
        <p className="subtitle">
          Trigger EC2 container deployment and Lambda setup jobs from one panel.
        </p>
      </header>

      <main className="layout">
        <section className="panel onboarding">
          <h2>Onboarding Form</h2>
          <form onSubmit={handleDeploy} className="form-grid">
            <label>
              Client Name
              <input
                name="clientName"
                placeholder="Acme Corp"
                value={form.clientName}
                onChange={handleInputChange}
                required
              />
            </label>

            <label>
              Domain
              <input
                name="domain"
                placeholder="test.ourplatform.com"
                value={form.domain}
                onChange={handleInputChange}
                required
              />
            </label>

            <label>
              Docker Image
              <input
                name="image"
                placeholder="nginx:latest"
                value={form.image}
                onChange={handleInputChange}
                required
              />
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Deploy'}
            </button>
          </form>

          {requestError && <p className="error">{requestError}</p>}
        </section>

        <section className="panel status">
          <h2>Live Status Dashboard</h2>
          {!activeStatus && (
            <div className="empty-state">
              Submit a deployment request to track status updates.
            </div>
          )}

          {activeStatus && (
            <article className="status-card">
              <div className="status-row">
                <span>Current deployment</span>
                <span className={`status-pill ${statusTone(activeStatus.status)}`}>
                  {activeStatus.status}
                </span>
              </div>

              <dl>
                <div>
                  <dt>Client</dt>
                  <dd>{activeStatus.clientName}</dd>
                </div>
                <div>
                  <dt>Domain</dt>
                  <dd>{activeStatus.domain}</dd>
                </div>
                <div>
                  <dt>Image</dt>
                  <dd>{activeStatus.image}</dd>
                </div>
                <div>
                  <dt>Deployment ID</dt>
                  <dd className="mono">{activeStatus.id}</dd>
                </div>
              </dl>

              {activeStatus.errorMessage && (
                <p className="error">Failure reason: {activeStatus.errorMessage}</p>
              )}

              {!isTerminalStatus && (
                <p className="polling-indicator">Auto-refreshing every 3 seconds...</p>
              )}
            </article>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
