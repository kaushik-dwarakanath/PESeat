import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function StaffDashboard() {
	const navigate = useNavigate()
	const [user, setUser] = useState(null)

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

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
			<div className="max-w-2xl w-full bg-white rounded-lg shadow p-8">
				<h1 className="text-2xl font-bold text-gray-800">Staff Dashboard</h1>
				<p className="mt-4 text-gray-600">Welcome back{user ? `, ${user.name || user.fullName || user.phone}` : ''}.</p>

				<div className="mt-6">
					<button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Logout</button>
				</div>
			</div>
		</div>
	)
}

export default StaffDashboard
