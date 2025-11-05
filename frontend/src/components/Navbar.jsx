import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Desktop Navigation */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">CargoNepal</span>
            </Link>
            
            {/* Desktop Menu */}
            {isAuthenticated && (
              <div className="hidden md:flex ml-10 space-x-1">
                {user?.role === 'customer' && (
                  <>
                    <Link 
                      to="/customer/dashboard" 
                      className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-slate-900 hover:bg-gray-100 transition"
                    >
                      My Bookings
                    </Link>
                    <Link 
                      to="/customer/new-booking" 
                      className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-slate-900 hover:bg-gray-100 transition"
                    >
                      New Booking
                    </Link>
                    <Link 
                      to="/trucks" 
                      className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-slate-900 hover:bg-gray-100 transition"
                    >
                      Browse Trucks
                    </Link>
                    <Link 
                      to="/customer/profile" 
                      className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-slate-900 hover:bg-gray-100 transition"
                    >
                      Profile
                    </Link>
                  </>
                )}
                {user?.role === 'owner' && (
                  <>
                    <Link 
                      to="/owner/dashboard" 
                      className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-slate-900 hover:bg-gray-100 transition"
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/owner/profile" 
                      className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-slate-900 hover:bg-gray-100 transition"
                    >
                      Profile
                    </Link>
                  </>
                )}
                {user?.role === 'admin' && (
                  <Link 
                    to="/admin/dashboard" 
                    className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-slate-900 hover:bg-gray-100 transition"
                  >
                    Admin Dashboard
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <div className="text-gray-700">
                  <NotificationBell />
                </div>
                <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user?.name}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/register', { state: { role: 'admin' } })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition"
                >
                  Signup as Admin
                </button>
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {isAuthenticated ? (
              <>
                {/* User Info */}
                <div className="flex items-center space-x-3 px-3 py-3 bg-gray-50 rounded-lg mb-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                </div>

                {/* Navigation Links */}
                {user?.role === 'customer' && (
                  <>
                    <Link 
                      to="/customer/dashboard" 
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Bookings
                    </Link>
                    <Link 
                      to="/customer/new-booking" 
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      New Booking
                    </Link>
                    <Link 
                      to="/trucks" 
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Browse Trucks
                    </Link>
                    <Link 
                      to="/customer/profile" 
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  </>
                )}
                {user?.role === 'owner' && (
                  <>
                    <Link 
                      to="/owner/dashboard" 
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/owner/profile" 
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  </>
                )}
                {user?.role === 'admin' && (
                  <Link 
                    to="/admin/dashboard" 
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition mt-3"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigate('/register', { state: { role: 'admin' } });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  Signup as Admin
                </button>
                <Link 
                  to="/login" 
                  className="block px-3 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white text-center hover:bg-slate-800 transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;