import Homepage from './pages/Homepage'
import { BrowserRouter as Router, Routes, Route, BrowserRouter } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BrowseItems from './pages/BrowseItems'
import Cart from './pages/Cart'
import './App.css'

function App() {

  return (
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/browse" element={<BrowseItems />} />
            <Route path="/cart" element={<Cart />} />
          </Routes>
        </div>
      </Router>
  )
}

export default App
