import './App.css'
import Home from './Home'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Builder from '../components/Builder'
import History from '../components/History'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  )
}

export default App
