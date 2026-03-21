import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">PAPERTRAIL</Link>
      <div className="nav-links">
        <Link to="/" className={pathname === '/' ? 'active' : ''}>Upload</Link>
        <Link to="/files" className={pathname === '/files' ? 'active' : ''}>Files</Link>
      </div>
    </nav>
  )
}