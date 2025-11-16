import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Dashboard = () => {
  // Simple cart count synced from backend
  const [cartCount, setCartCount] = useState(0)
  const getTotalItems = () => cartCount
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [lastOrder, setLastOrder] = useState(null)
  const [trendingItems, setTrendingItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCartCount = async (token) => {
    try {
      if (!token) return
      const res = await fetch('http://localhost:5000/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return
      const cart = await res.json()
      const count = (cart?.items || []).reduce((sum, li) => sum + (li.quantity || 0), 0)
      setCartCount(count)
    } catch {}
  }

  useEffect(() => {
    const checkAuth = async () => {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        const res = await fetch("http://localhost:5000/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            navigate("/login");
            return;
        }

        const data = await res.json();
        setUser(data.user);
        await Promise.all([
          loadDashboardData(data.user.id || data.user._id),
          fetchCartCount(token)
        ])
    };
    checkAuth()
  }, [navigate])

  const loadDashboardData = async (userId) => {
    try {
        const token = localStorage.getItem("token");
        const [lastOrderRes, trendingItemsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/orders/last`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:5000/api/items/trending?limit=4`)
        ]);

        const lastOrderData = await lastOrderRes.json();
        const trendingData = await trendingItemsRes.json();

        setLastOrder(lastOrderData || null);
        setTrendingItems(trendingData);
    } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
 };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">PESEAT</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/cart"
                className="relative bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                <span>Cart ({getTotalItems()})</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
                title="Logout"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.fullName || user?.email?.split('@')[0]}!
          </h2>
          <p className="text-gray-600">Here's what's happening with your orders today.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Last Purchase */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Last Purchase</h3>
                {lastOrder && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    lastOrder.fulfillmentStatus === 'collected'
                      ? 'bg-green-100 text-green-800'
                      : lastOrder.fulfillmentStatus === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {(lastOrder.fulfillmentStatus || lastOrder.status || 'placed').toUpperCase()}
                  </span>
                )}
              </div>
              
              {lastOrder ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">Order ID: <span className="font-bold">{lastOrder.orderNumber || lastOrder._id}</span></p>
                      <p className="text-sm text-gray-500">Items: {lastOrder.items?.reduce((sum, li) => sum + (li.quantity || 0), 0) || 0}</p>
                    </div>
                    <p className="font-semibold text-gray-900">₹{lastOrder.total ?? lastOrder.subtotal ?? 0}</p>
                  </div>

                  {/* Full item breakdown */}
                  <div className="divide-y divide-gray-100">
                    {(lastOrder.items || []).map((li) => (
                      <div key={li.item} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-gray-900">{li.name}</p>
                          <p className="text-xs text-gray-500">Qty: {li.quantity} × ₹{li.unitPrice}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-900">₹{(li.unitPrice || 0) * (li.quantity || 0)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">
                          Ordered on {new Date(lastOrder.createdAt || lastOrder.created_at).toLocaleString()}
                        </p>
                        {lastOrder.pickupTime && (
                          <p className="text-sm text-blue-600 font-medium mt-1">
                            Pickup time: {new Date(lastOrder.pickupTime).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-xl font-bold text-gray-900">₹{lastOrder.total ?? lastOrder.subtotal ?? 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-gray-500">No previous orders found</p>
                  <Link
                    to="/browse"
                    className="mt-2 inline-block text-blue-600 hover:text-blue-700"
                  >
                    Start your first order →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/browse"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Browse Items</span>
                </Link>
                <Link
                  to="/cart"
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                  <span>View Cart</span>
                </Link>
              </div>
            </div>

            {/* Cart Summary */}
            {getTotalItems() > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cart Summary</h3>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{getTotalItems()}</p>
                  <p className="text-sm text-gray-500">Items in cart</p>
                  <Link
                    to="/cart"
                    className="mt-3 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    View Cart
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trending Items */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Trending Items</h3>
            <Link
              to="/browse"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>
          
          {trendingItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingItems.map((item) => (
                <div key={item._id || item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-gray-600">{item.rating || 'New'}</span>
                      </div>
                      <span className="text-sm text-gray-500">{item.total_orders || 0} orders</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">₹{item.price}</span>
                      <Link
                        to="/browse"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Order
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-gray-500">No trending items available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
