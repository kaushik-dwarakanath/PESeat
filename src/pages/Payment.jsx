import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Payment = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please login')
        navigate('/login')
        return
      }
      const res = await fetch('http://localhost:5000/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Checkout failed')
      navigate(`/cart?order=${encodeURIComponent(data.orderNumber)}`)
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Payment</h1>
        <p className="text-gray-600 mb-6">This is a placeholder payment step. Click continue to place your order.</p>
        <button
          onClick={handleContinue}
          disabled={loading}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Placing order...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

export default Payment


