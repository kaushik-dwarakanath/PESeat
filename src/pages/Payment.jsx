import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Payment = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [pickupTime, setPickupTime] = useState('')
  const [error, setError] = useState('')
  const [availableTimeSlots, setAvailableTimeSlots] = useState([])

  useEffect(() => {
    const generateTimeSlots = () => {
      const now = new Date()
      const slots = []
      
      const earliestAllowed = new Date(now.getTime() + 30 * 60 * 1000)
      
      const openTime = new Date(now)
      openTime.setHours(8, 0, 0, 0)
      const closeTime = new Date(now)
      closeTime.setHours(17, 0, 0, 0)
      
      let startTime = earliestAllowed > openTime ? earliestAllowed : openTime
      
      const minutes = startTime.getMinutes()
      if (minutes > 30) {
        startTime.setMinutes(0, 0, 0)
        startTime.setHours(startTime.getHours() + 1)
      } else if (minutes > 0) {
        startTime.setMinutes(30, 0, 0)
      } else {
        startTime.setMinutes(0, 0, 0)
      }
      
      const currentSlot = new Date(startTime)
      while (currentSlot <= closeTime) {
        if (currentSlot >= earliestAllowed) {
          const timeString = currentSlot.toISOString()
          const displayTime = currentSlot.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })
          slots.push({ value: timeString, label: displayTime })
        }
        currentSlot.setMinutes(currentSlot.getMinutes() + 30)
      }
      
      setAvailableTimeSlots(slots)
      if (slots.length > 0 && !pickupTime) {
        setPickupTime(slots[0].value)
      }
    }
    
    generateTimeSlots()
  }, [])

  const handleContinue = async () => {
    try {
      setError('')
      
      if (!pickupTime) {
        setError('Please select a pickup time')
        return
      }

      const selectedTime = new Date(pickupTime)
      const now = new Date()
      const minTime = new Date(now.getTime() + 30 * 60 * 1000)
      
      if (selectedTime < minTime) {
        setError('Pickup time must be at least 30 minutes from now')
        return
      }

      const openTime = new Date(now)
      openTime.setHours(8, 0, 0, 0)
      const closeTime = new Date(now)
      closeTime.setHours(17, 0, 0, 0)

      if (selectedTime < openTime || selectedTime > closeTime) {
        setError('Pickup time must be between 8:00 AM and 5:00 PM')
        return
      }

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
        body: JSON.stringify({ pickupTime: selectedTime.toISOString() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Checkout failed')
      navigate(`/cart?order=${encodeURIComponent(data.orderNumber)}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Payment & Pickup Time</h1>
        
        <div className="mb-6">
          <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700 mb-2">
            Select Pickup Time
          </label>
          <select
            id="pickupTime"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            {availableTimeSlots.length === 0 ? (
              <option value="">No available time slots today</option>
            ) : (
              availableTimeSlots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))
            )}
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Canteen hours: 8:00 AM - 5:00 PM. Minimum 30 minutes from order time.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        <p className="text-gray-600 mb-6 text-center text-sm">
          This is a placeholder payment step. Click continue to place your order.
        </p>
        
        <button
          onClick={handleContinue}
          disabled={loading || !pickupTime || availableTimeSlots.length === 0}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors ${
            loading || !pickupTime || availableTimeSlots.length === 0
              ? 'opacity-70 cursor-not-allowed'
              : ''
          }`}
        >
          {loading ? 'Placing order...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

export default Payment


