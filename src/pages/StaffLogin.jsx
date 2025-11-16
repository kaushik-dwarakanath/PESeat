import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom'

function StaffLogin() {
    const navigate = useNavigate()

    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')
    const [isOtpSent, setIsOtpSent] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [errors, setErrors] = useState({})
    const [countdown, setCountdown] = useState(0)

    useEffect(() => {
        let timer
        if (countdown > 0) {
            timer = setInterval(() => setCountdown(c => c - 1), 1000)
        }
        return () => clearInterval(timer)
    }, [countdown])

    const validatePhone = () => {
        const newErrors = {}
        const cleaned = phone.replace(/\D/g, '')
        if (!cleaned) newErrors.phone = 'Phone number is required'
        else if (!/^\d{10,15}$/.test(cleaned)) newErrors.phone = 'Enter a valid phone number (10-15 digits)'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSendOtp = async (e) => {
        e && e.preventDefault()
        if (!validatePhone()) return

        setIsLoading(true)
        setErrors({})
        try {
            // Placeholder endpoint - backend will handle sending OTP
            const res = await fetch('http://localhost:5000/api/auth/staff/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            })

            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                throw new Error(data.message || 'Failed to send OTP')
            }

            setIsOtpSent(true)
            setCountdown(60) // 60s until resend
        } catch (err) {
            setErrors({ general: err.message })
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyOtp = async (e) => {
        e.preventDefault()
        // Basic OTP validation
        if (!otp) {
            setErrors({ otp: 'Enter the OTP' })
            return
        }

        setIsVerifying(true)
        setErrors({})
        try {
            const res = await fetch('http://localhost:5000/api/auth/staff/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp })
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                throw new Error(data.message || 'OTP verification failed')
            }

            if (data.token) localStorage.setItem('token', data.token)
            if (data.user) localStorage.setItem('user', JSON.stringify(data.user))

            navigate('/staff-dashboard')
        } catch (err) {
            setErrors({ general: err.message })
        } finally {
            setIsVerifying(false)
        }
    }

    const handleResend = async () => {
        if (countdown > 0) return
        await handleSendOtp()
    }

    const handleChangeNumber = () => {
        setIsOtpSent(false)
        setOtp('')
        setCountdown(0)
        setErrors({})
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <Link to="/" className="text-3xl font-bold text-indigo-600">PESeat</Link>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Staff Sign in</h2>
                    <p className="mt-2 text-sm text-gray-600">Login with your staff phone number using OTP</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp}>
                    <div className="bg-white p-8 rounded-lg shadow-lg">
                        {errors.general && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{errors.general}</div>
                        )}

                        <div className="space-y-4">
                            {!isOtpSent && (
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone number</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        inputMode="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${errors.phone ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                                        placeholder="e.g. 9876543210"
                                    />
                                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                </div>
                            )}

                            {isOtpSent && (
                                <div>
                                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700">Enter OTP</label>
                                    <input
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        inputMode="numeric"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${errors.otp ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                                        placeholder="6-digit code"
                                    />
                                    {errors.otp && <p className="mt-1 text-sm text-red-600">{errors.otp}</p>}

                                    <div className="mt-2 text-sm text-gray-700">
                                        Sent to <span className="font-medium">{phone}</span>.{' '}
                                        {countdown > 0 ? (
                                            <span className="text-gray-500">Resend in {countdown}s</span>
                                        ) : (
                                            <button type="button" onClick={handleResend} className="text-indigo-600 hover:text-indigo-500 font-medium">Resend OTP</button>
                                        )}
                                    </div>

                                    <div className="mt-2">
                                        <button type="button" onClick={handleChangeNumber} className="text-sm text-gray-600 hover:text-indigo-500">Change number?</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={isLoading || isVerifying}
                                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${isLoading || isVerifying ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'} transition duration-200`}
                            >
                                {(isLoading || isVerifying) ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {isOtpSent ? 'Verifying...' : 'Sending...'}
                                    </div>
                                ) : (
                                    isOtpSent ? 'Verify OTP' : 'Send OTP'
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                <div className="text-center">
                    <Link to="/" className="text-sm text-gray-600 hover:text-indigo-500 transition duration-200">← Back to Homepage</Link>
                </div>
            </div>
        </div>
    )
}

export default StaffLogin
