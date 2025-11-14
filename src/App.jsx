import Homepage from './pages/Homepage'
import { BrowserRouter as Router, Routes, Route, BrowserRouter } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BrowseItems from './pages/BrowseItems'
import Cart from './pages/Cart'
import Payment from './pages/Payment'
import StaffLogin from './pages/StaffLogin'
import StaffDashboard from './pages/StaffDashboard'
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
            <Route path="/payment" element={<Payment />} />
            <Route path="/staff-login" element={<StaffLogin />} />
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
          </Routes>
        </div>
      </Router>
  )
}

export default App
