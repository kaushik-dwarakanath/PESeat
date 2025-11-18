import { Link } from 'react-router-dom'

function Homepage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">PESeat</h1>
            </div>
            <div className="flex space-x-4">
              <Link 
                to="/login" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-600 px-4 py-2 rounded-lg transition duration-200"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-indigo-600">PESeat</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Order delicious food from your college canteen with ease. Skip the lines and get your meals delivered fresh to your location.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition duration-200 transform hover:scale-105"
            >
              Get Started
            </Link>
            <Link 
              to="/login" 
              className="bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold transition duration-200 transform hover:scale-105"
            >
              Already have an account?
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose PESeat?
            </h2>
            <p className="text-lg text-gray-600">
              Experience the future of campus dining
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quick & Easy</h3>
              <p className="text-gray-600">Order your favorite meals in just a few clicks. No more waiting in long queues.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 3.5a1 1 0 00.9 1.5H18" />
                  <circle cx="10" cy="20" r="1" className="text-indigo-600" />
                  <circle cx="18" cy="20" r="1" className="text-indigo-600" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fresh & Delicious</h3>
              <p className="text-gray-600">Enjoy freshly prepared meals from your college canteen, delivered hot and tasty.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
              <p className="text-gray-600">Your orders are secure and tracked. Get real-time updates on your food delivery.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">PESeat</h3>
          <p className="text-gray-400 mb-4">Making campus dining easier, one order at a time.</p>
          <p className="text-gray-500 text-sm">
            2025 PESeat. All rights reserved. Kaushik Atharv Atul.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Homepage
