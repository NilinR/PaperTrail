import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Versions.css'

export default function Versions() {
  const { filename } = useParams()
  const navigate = useNavigate()
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionStatus, setActionStatus] = useState(null)

  const decoded = decodeURIComponent(filename)

  const fetchVersions = () => {
    setLoading(true)
    axios.get(`http://localhost:8000/files/${encodeURIComponent(decoded)}/versions`)
      .then(res => setVersions(res.data.versions))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchVersions() }, [filename])

  const handleDownload = async (version) => {
    const res = await axios.get(`http://localhost:8000/files/${encodeURIComponent(decoded)}/download/${version}`)
    window.open(res.data.download_url, '_blank')
  }

  const handleRollback = async (version) => {
    setActionStatus({ type: 'loading', message: `Rolling back to v${version}...` })
    try {
      const res = await axios.post(`http://localhost:8000/files/${encodeURIComponent(decoded)}/rollback/${version}`)
      setActionStatus({ type: 'success', message: `Rolled back! Saved as v${res.data.new_version}` })
      fetchVersions()
    } catch {
      setActionStatus({ type: 'error', message: 'Rollback failed' })
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (iso) => new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  if (loading) return <div className="versions-loading">Loading...</div>

  const latest = versions[versions.length - 1]

  return (
    <div className="versions-page">

      <button className="back-btn" onClick={() => navigate('/files')}>← Back</button>

      <div className="versions-header">
        <div className="versions-title">
          <h1>{decoded}</h1>
          <span className="versions-badge">{versions.length} version{versions.length !== 1 ? 's' : ''}</span>
        </div>
        {latest && (
          <div className="versions-latest">
            <span>Latest</span>
            <span className="accent">v{latest.version}</span>
            <span>{formatDate(latest.created_at)}</span>
          </div>
        )}
      </div>

      {actionStatus && (
        <div className={`action-status ${actionStatus.type}`}>
          {actionStatus.message}
        </div>
      )}

      <div className="versions-timeline">
        {[...versions].reverse().map((v, i) => (
          <div key={v.id} className={`version-card ${i === 0 ? 'is-latest' : ''}`}>
            <div className="version-left">
              <div className="version-dot" />
              {i < versions.length - 1 && <div className="version-line" />}
            </div>

            <div className="version-body">
              <div className="version-top">
                <span className="version-num">v{v.version}</span>
                {i === 0 && <span className="latest-tag">LATEST</span>}
                <span className="version-date">{formatDate(v.created_at)}</span>
                <span className="version-size">{formatSize(v.file_size)}</span>
              </div>

              {v.message && (
                <div className="version-message">"{v.message}"</div>
              )}

              <div className="version-hash">{v.file_hash.slice(0, 16)}...</div>

              <div className="version-actions">
                <button className="btn-download" onClick={() => handleDownload(v.version)}>
                  ↓ Download
                </button>
                {i !== 0 && (
                  <button className="btn-rollback" onClick={() => handleRollback(v.version)}>
                    ↩ Rollback to this
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}