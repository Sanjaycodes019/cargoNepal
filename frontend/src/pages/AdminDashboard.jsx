import { useState, useEffect, useContext } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AuthContext } from '../context/AuthContext';
import { initSocket, getSocket } from '../utils/socket';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState({ owners: [], customers: [], admins: [] });
  const [trucks, setTrucks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    if (user) {
      initSocket(user.id);
      const socket = getSocket();
      
      if (socket) {
        socket.on('admin_booking_updated', () => {
          fetchData();
        });
        
        socket.on('booking_updated', () => {
          fetchData();
        });
      }
      
      return () => {
        if (socket) {
          socket.off('admin_booking_updated');
          socket.off('booking_updated');
        }
      };
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [statsRes, analyticsRes, usersRes, trucksRes, bookingsRes] = await Promise.all([
        axiosInstance.get('/admin/stats'),
        axiosInstance.get('/admin/analytics'),
        axiosInstance.get('/admin/users'),
        axiosInstance.get('/admin/trucks'),
        axiosInstance.get('/admin/bookings')
      ]);
      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
      setUsers(usersRes.data.data);
      setTrucks(trucksRes.data.data);
      setBookings(bookingsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, role) => {
    if (!window.confirm(`Are you sure you want to delete this ${role}?`)) {
      return;
    }
    try {
      await axiosInstance.delete(`/admin/user/${userId}?role=${role}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-slate-900"></div>
          <p className="mt-4 text-sm font-medium text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-500">Monitor and manage platform operations</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6 overflow-x-auto">
          <nav className="flex gap-1 min-w-max sm:min-w-0">
            {[
              { id: 'stats', label: 'Overview', icon: '📊' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
              { id: 'users', label: 'Users', icon: '👥' },
              { id: 'trucks', label: 'Trucks', icon: '🚛' },
              { id: 'bookings', label: 'Bookings', icon: '📋' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-base sm:text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Total Users</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Total Trucks</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalTrucks}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Bookings</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Pending</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.pendingBookings}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Active</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.activeBookings}</p>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Bookings by Status</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={analytics.bookingsByStatus.map(item => ({
                        name: item._id.charAt(0).toUpperCase() + item._id.slice(1).replace('_', ' '),
                        value: item.count
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.bookingsByStatus.map((entry, index) => {
                        const colors = ['#dc2626', '#0f172a', '#059669', '#d97706', '#7c3aed', '#db2777'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Bookings Over Time</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analytics.bookingsByMonth.map(item => ({
                    month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
                    bookings: item.count
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bookings" fill="#0f172a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {analytics.trucksPerOwner && analytics.trucksPerOwner.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Top Owners</h3>
                <div className="space-y-3">
                  {analytics.trucksPerOwner.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <span className="font-medium text-gray-900 text-sm sm:text-base">{item._id?.name || 'Unknown'}</span>
                      <span className="px-3 py-1 bg-slate-900 text-white rounded-md text-xs sm:text-sm font-medium">
                        {item.count} trucks
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Vehicle Owners ({users.owners.length})</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.owners.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">{user.phone || 'N/A'}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleDeleteUser(user._id, 'owner')}
                              className="px-3 py-1.5 bg-rose-600 text-white rounded-md hover:bg-rose-700 text-xs sm:text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Customers ({users.customers.length})</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.customers.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">{user.phone || 'N/A'}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleDeleteUser(user._id, 'customer')}
                              className="px-3 py-1.5 bg-rose-600 text-white rounded-md hover:bg-rose-700 text-xs sm:text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trucks Tab */}
        {activeTab === 'trucks' && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">All Trucks ({trucks.length})</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Owner</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate/KM</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trucks.map((truck) => (
                      <tr key={truck._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{truck.title}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">{truck.type || 'N/A'}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                          {truck.owner?.name || 'N/A'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">₹{truck.ratePerKm}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            truck.available 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {truck.available ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">All Bookings ({bookings.length})</h2>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">{booking.truck?.title || 'Truck'}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">Customer:</span> {booking.customer?.name || 'N/A'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">Owner:</span> {booking.owner?.name || 'N/A'}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
                      booking.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      booking.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                      booking.status === 'declined' ? 'bg-rose-100 text-rose-800' :
                      booking.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      booking.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-rose-50 p-3 sm:p-4 rounded-lg border border-rose-200">
                      <p className="text-xs font-medium text-rose-700 mb-1">Pickup</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{booking.pickup?.address || `${booking.pickup?.lat}, ${booking.pickup?.lng}`}</p>
                    </div>
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                      <p className="text-xs font-medium text-blue-700 mb-1">Dropoff</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{booking.dropoff?.address || `${booking.dropoff?.lat}, ${booking.dropoff?.lng}`}</p>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-1">Distance</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">{booking.distanceKm} km</p>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-1">Price</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">₹{booking.price}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;