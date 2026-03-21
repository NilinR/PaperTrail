import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Files.css'

export default function Files() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('http://localhost:8000/files')
      .then(res => setFiles(res.data.files))
      .finally(() => setLoading(false))
  }, [])

  const getIcon = (type) => type === 'application/pdf' ? 'PDF' : 'IMG'

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  if (loading) return <div className="files-loading">Loading...</div>

  return (
    <div className="files-page">
      <div className="files-header">
        <h1>Tracked Files</h1>
        <span className="files-count">{files.length} file{files.length !== 1 ? 's' : ''}</span>
        <button className="refresh-btn" onClick={() => {
          setLoading(true)
          axios.get('http://localhost:8000/files')
            .then(res => setFiles(res.data.files))
            .finally(() => setLoading(false))
        }}>↻ Refresh</button>
      </div>

      {files.length === 0 ? (
        <div className="files-empty">
          <p>No files yet.</p>
          <button onClick={() => navigate('/')}>Upload your first file</button>
        </div>
      ) : (
        <div className="files-list">
          {files.map((f) => (
            <div key={f.original_name} className="file-row"
              onClick={() => navigate(`/files/${encodeURIComponent(f.original_name)}`)}>
              <span className="file-row-icon">{getIcon(f.file_type)}</span>
              <span className="file-row-name">{f.original_name}</span>
              <span className="file-row-meta">{formatSize(f.file_size)}</span>
              <span className="file-row-meta">{formatDate(f.created_at)}</span>
              <span className="file-row-version">v{f.version}</span>
              <span className="file-row-arrow">→</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}