import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function StaffDashboard() {
	const navigate = useNavigate()
	const [user, setUser] = useState(null)
	const [orders, setOrders] = useState([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState(null)
	const [actionLoading, setActionLoading] = useState({})

	useEffect(() => {
		const raw = localStorage.getItem('user')
		if (raw) {
			try {
				setUser(JSON.parse(raw))
			} catch (e) {
				setUser(null)
			}
		}
	}, [])

	const handleLogout = () => {
		localStorage.removeItem('token')
		localStorage.removeItem('user')
		navigate('/staff-login')
	}

	useEffect(() => {
		const fetchOrders = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const token = localStorage.getItem('token')
				if (!token) throw new Error('No token found; please login')
				const res = await fetch('http://localhost:5000/api/orders/staff', {
					headers: { Authorization: `Bearer ${token}` }
				})
				if (!res.ok) {
					const body = await res.json().catch(() => ({}))
					throw new Error(body.message || 'Failed to fetch orders')
				}
				const data = await res.json()
				const sorted = (data || []).slice().sort((a, b) => {
					const pa = a.pickupTime ? new Date(a.pickupTime).getTime() : Infinity
					const pb = b.pickupTime ? new Date(b.pickupTime).getTime() : Infinity
					if (pa !== pb) return pa - pb
					const na = Number((a.orderNumber || '').split('-').pop()) || 0
					const nb = Number((b.orderNumber || '').split('-').pop()) || 0
					return na - nb
				})
				setOrders(sorted)
			} catch (err) {
				setError(err.message)
			} finally {
				setIsLoading(false)
			}
		}
		fetchOrders()
	}, [])

	const setOrderLoading = (id, val) => {
		setActionLoading(prev => ({ ...prev, [id]: !!val }))
	}

	const markReady = async (id) => {
		setOrderLoading(id, true)
		setError(null)
		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`http://localhost:5000/api/orders/${id}/ready`, {
				method: 'PUT',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
			})
			const body = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(body.message || 'Failed to mark ready')
			const updated = body.order || body
			setOrders(prev => prev.map(o => o._id === id ? updated : o))
		} catch (err) {
			setError(err.message)
		} finally {
			setOrderLoading(id, false)
		}
	}

	const markCollected = async (id) => {
		setOrderLoading(id, true)
		setError(null)
		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`http://localhost:5000/api/orders/${id}/collect`, {
				method: 'PUT',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
			})
			const body = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(body.message || 'Failed to mark collected')
			const updated = body.order || body
			setOrders(prev => prev.map(o => o._id === id ? updated : o))
		} catch (err) {
			setError(err.message)
		} finally {
			setOrderLoading(id, false)
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="max-w-4xl mx-auto">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="text-2xl font-bold text-gray-800">Staff Dashboard</h1>
						<p className="mt-1 text-gray-600">Welcome back{user ? `, ${user.name || user.fullName || user.phone}` : ''}.</p>
					</div>
					<div className="flex items-center gap-3">
						<button onClick={() => window.location.reload()} className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Refresh</button>
						<button onClick={handleLogout} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700">Logout</button>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					{isLoading ? (
						<div className="text-center py-8">Loading orders...</div>
					) : error ? (
						<div className="p-4 bg-red-50 border border-red-200 text-red-700">{error}</div>
					) : orders.length === 0 ? (
						<div className="p-4 text-gray-600">No orders found.</div>
					) : (
						<ul className="space-y-3">
							{orders.map((o) => (
								<li key={o._id} className="p-4 border rounded flex justify-between items-start">
									<div>
										<div className="flex items-baseline gap-3">
											<span className="text-sm text-gray-500">{o.orderNumber || '—'}</span>
											<h3 className="text-lg font-medium">Pickup: {o.pickupTime ? new Date(o.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ASAP'}</h3>
										</div>
										<p className="text-sm text-gray-600 mt-1">Items: {o.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}</p>
										<p className="mt-2 text-sm text-gray-600">Status: <span className="font-medium">{o.fulfillmentStatus}</span></p>
									</div>
									<div className="text-right">
										<div className="text-sm text-gray-500">Order Id</div>
										<div className="font-mono text-sm">{o.orderNumber || '—'}</div>
										<div className="mt-2 inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Priority</div>
										{/* Action buttons based on fulfillmentStatus */}
										{o.fulfillmentStatus === 'making' && (
											<button
												onClick={() => markReady(o._id)}
												disabled={!!actionLoading[o._id]}
												className="mt-3 block w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
											>
												{actionLoading[o._id] ? 'Processing...' : 'Mark Ready'}
											</button>
										)}
										{o.fulfillmentStatus === 'ready' && (
											<button
												onClick={() => markCollected(o._id)}
												disabled={!!actionLoading[o._id]}
												className="mt-3 block w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
											>
												{actionLoading[o._id] ? 'Processing...' : 'Mark Given'}
											</button>
										)}
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	)
}

export default StaffDashboard
