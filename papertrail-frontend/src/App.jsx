//react is single page so this is so multipage works
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Upload from './pages/Upload'
import Files from './pages/Files'
import Versions from './pages/Versions'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/files" element={<Files />} />
        <Route path="/files/:filename" element={<Versions />} />
      </Routes>
    </BrowserRouter>
  )
}