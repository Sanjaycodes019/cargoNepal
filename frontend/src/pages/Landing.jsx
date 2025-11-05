import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Landing = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignup = (role) => {
    navigate('/register', { state: { role } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
              Welcome to <span className="text-slate-900">CargoNepal</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto">
              Your trusted platform for cargo booking and transportation management across Nepal
            </p>

            {/* CTA Buttons */}
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                <button
                  onClick={() => handleSignup('customer')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all text-base"
                >
                  Sign up as Customer
                </button>
                <button
                  onClick={() => handleSignup('owner')}
                  className="w-full sm:w-auto px-8 py-3.5 border-2 border-slate-900 text-slate-900 bg-white rounded-lg hover:bg-gray-50 font-medium shadow-sm hover:shadow transition-all text-base"
                >
                  Sign up as Owner
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <Link
                  to="/trucks"
                  className="inline-flex items-center px-8 py-3.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all"
                >
                  Browse Available Trucks
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">For Customers</h3>
            <p className="text-gray-600 leading-relaxed">
              Browse available trucks, get instant price estimates, and book your cargo transportation with ease and confidence.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">For Vehicle Owners</h3>
            <p className="text-gray-600 leading-relaxed">
              Register your trucks, manage bookings efficiently, and expand your transportation business across Nepal.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Simple Management</h3>
            <p className="text-gray-600 leading-relaxed">
              Intuitive interface for managing bookings, trucks, and customer requests all in one centralized platform.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-sm sm:text-base text-gray-600">Active Trucks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">1000+</div>
              <div className="text-sm sm:text-base text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">24/7</div>
              <div className="text-sm sm:text-base text-gray-600">Support Available</div>
            </div>
            <div className="text-center col-span-2 lg:col-span-1">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">5000+</div>
              <div className="text-sm sm:text-base text-gray-600">Trips Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Get started with CargoNepal in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">1</div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Create Account</h3>
            <p className="text-gray-600">
              Sign up as a customer or vehicle owner in just a few clicks
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">2</div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Browse & Book</h3>
            <p className="text-gray-600">
              Find the perfect truck for your cargo and book instantly
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">3</div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Track & Deliver</h3>
            <p className="text-gray-600">
              Monitor your shipment and receive timely delivery updates
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
        <div className="bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-base sm:text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of satisfied customers and vehicle owners on CargoNepal today
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                <button
                  onClick={() => handleSignup('customer')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-900 rounded-lg hover:bg-gray-100 font-medium shadow-sm hover:shadow transition-all"
                >
                  Sign up as Customer
                </button>
                <button
                  onClick={() => handleSignup('owner')}
                  className="w-full sm:w-auto px-8 py-3.5 border-2 border-white text-white bg-transparent rounded-lg hover:bg-white hover:text-slate-900 font-medium transition-all"
                >
                  Sign up as Owner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;