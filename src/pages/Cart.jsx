import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

const Cart = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [cart, setCart] = useState({ items: [], subtotal: 0, tax: 0, total: 0 })
  const [message, setMessage] = useState("")
  const [hasActiveOrder, setHasActiveOrder] = useState(false)
  const [activeOrderInfo, setActiveOrderInfo] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const orderNo = params.get('order')
    if (orderNo) setMessage(`Order placed successfully. Order Number: ${orderNo}`)
  }, [location.search])

  const fetchCart = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    const res = await fetch('http://localhost:5000/api/cart', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (res.ok) setCart(data)
  }

  const checkActiveOrder = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch('http://localhost:5000/api/orders/last', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data) {
        // Check if the order is active (placed and not collected/cancelled)
        if (data.status === 'placed' && 
            (data.fulfillmentStatus === 'making' || data.fulfillmentStatus === 'ready')) {
          setHasActiveOrder(true)
          setActiveOrderInfo(data)
        } else {
          setHasActiveOrder(false)
          setActiveOrderInfo(null)
        }
      } else {
        setHasActiveOrder(false)
        setActiveOrderInfo(null)
      }
    } catch (error) {
      console.error('Error checking active order:', error)
    }
  }

  useEffect(() => { 
    fetchCart()
    checkActiveOrder()
  }, [])

  const removeFromCart = async (itemId) => {
    const token = localStorage.getItem('token')
    if (!token) return
    const res = await fetch(`http://localhost:5000/api/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) fetchCart()
  }

  const updateQuantity = async (itemId, newQuantity) => {
    const token = localStorage.getItem('token')
    if (!token) return
    const res = await fetch(`http://localhost:5000/api/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ quantity: newQuantity })
    })
    if (res.ok) fetchCart()
  }

  const clearCart = () => setCart({ items: [], subtotal: 0, tax: 0, total: 0 })

  const getTotalPrice = () => cart.total || cart.subtotal

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId)
    } else {
      updateQuantity(itemId, newQuantity)
    }
  }

  const handleCheckout = async () => {
    if (hasActiveOrder) {
      alert('You already have an active order. Please collect it before placing a new one.')
      return
    }
    navigate('/payment')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded mb-6">{message}</div>
        )}
        {hasActiveOrder && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold">You have an active order</p>
                <p className="text-sm mt-1">
                  Order Number: <span className="font-medium">{activeOrderInfo?.orderNumber}</span>
                  {activeOrderInfo?.pickupTime && (
                    <span className="ml-2">
                      • Pickup: {new Date(activeOrderInfo.pickupTime).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </span>
                  )}
                </p>
                <p className="text-sm mt-1">
                  You can add items to your cart, but you must collect your current order before placing a new one.
                </p>
              </div>
            </div>
          </div>
        )}
        {(!cart.items || cart.items.length === 0) ? (
          /* Empty Cart */
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <Link
              to="/browse"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Items
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Cart Items ({(cart.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0)})
                    </h2>
                    {cart.items.length > 0 && (
                      <button
                        onClick={clearCart}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Clear Cart
                      </button>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {cart.items.map((item) => (
                    <div key={item.item} className="p-6">
                      <div className="flex items-center space-x-4">
                        {/* Item Image */}
                        <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                          {item.image_url ? (
                            <img
                              src={
                                item.image_url?.startsWith("http")
                                  ? item.image_url
                                  : `http://localhost:5000${item.image_url}`
                              }
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                          <p className="text-gray-600 text-sm">{item.description}</p>
                          <div className="flex items-center mt-2">
                            <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm text-gray-600">{item.rating}</span>
                          </div>
                        </div>

                        {/* Price and Controls */}
                        <div className="flex flex-col items-end space-y-3">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">₹{item.unitPrice}</p>
                            <p className="text-sm text-gray-500">per item</p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuantityChange(item.item, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.item, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeFromCart(item.item)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  {cart.items.map((item) => (
                    <div key={item.item} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-medium">₹{item.unitPrice * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{cart.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">₹20</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST</span>
                    <span className="font-medium">₹{cart.tax}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">
                        ₹{cart.total || cart.subtotal + 20}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={hasActiveOrder}
                  className={`w-full mt-6 py-3 px-4 rounded-lg font-medium transition-colors ${
                    hasActiveOrder
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {hasActiveOrder ? 'Cannot Checkout (Active Order)' : 'Proceed to Checkout'}
                </button>

                <Link
                  to="/browse"
                  className="block w-full mt-3 text-center text-blue-600 hover:text-blue-700 py-2 px-4 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart
