import { useState, useRef } from 'react'
import axios from 'axios'
import './Upload.css'

export default function Upload() {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(null) // {type: 'success'|'error'|'duplicate', data}
  const [loading, setLoading] = useState(false)
  const inputRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setStatus(null)
    const form = new FormData()
    form.append('file', file)
    form.append('message', message)
    
    try {
      const res = await axios.post('http://localhost:8000/upload', form)
      console.log('RESPONSE:', JSON.stringify(res.data))
      if (res.data.message.includes('already exists')) {
        setStatus({ type: 'duplicate', data: res.data })
      } else {
        setStatus({ type: 'success', data: res.data })
        setFile(null)
        setMessage('')
      }
    } catch (err) {
      console.log('ERROR:', err)
      setStatus({ type: 'error', data: err.response?.data?.detail || 'Upload failed' })
    }
    setLoading(false)
  }

  return (
    <div className="upload-page">
      <div className="upload-header">
        <h1>Drop a file.<br />We'll remember it.</h1>
        <p>PDF, PNG, JPG, WEBP supported</p>
      </div>

      <div
        className={`dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
      >
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" hidden
          onChange={(e) => setFile(e.target.files[0])} />
        {file ? (
          <div className="file-selected">
            <span className="file-icon">{file.type === 'application/pdf' ? '⬛' : '🖼'}</span>
            <span className="file-name">{file.name}</span>
            <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
          </div>
        ) : (
          <div className="drop-prompt">
            <span>drag & drop or click to browse</span>
          </div>
        )}
      </div>

      {file && (
        <div className="upload-controls">
          <input
            className="message-input"
            placeholder="Version note (optional) — e.g. 'updated cover page'"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="upload-btn" onClick={handleUpload} disabled={loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}

      {status && (
        <div className={`status-box ${status.type}`}>
          {status.type === 'success' && <>
            <span className="status-label">Saved as</span>
            <span className="status-version">v{status.data.version.version}</span>
            <span className="status-name">{status.data.version.original_name}</span>
          </>}
          {status.type === 'duplicate' && <>
            <span className="status-label">Already exists —</span>
            <span className="status-name">no new version created</span>
          </>}
          {status.type === 'error' && <span>{status.data}</span>}
        </div>
      )}
    </div>
  )
}