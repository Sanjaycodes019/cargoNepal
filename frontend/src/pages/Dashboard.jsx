import { useState, useEffect, useContext } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import { initSocket, getSocket } from '../utils/socket';

const Dashboard = () => {
  const { user, isCustomer } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (isCustomer && user) {
      fetchBookings();
      
      initSocket(user.id);
      const socket = getSocket();
      
      if (socket) {
        socket.on('booking_updated', (data) => {
          fetchBookings();
        });
      }

      return () => {
        if (socket) {
          socket.off('booking_updated');
        }
      };
    }
  }, [isCustomer, user]);

  const fetchBookings = async () => {
    try {
      const response = await axiosInstance.get('/customer/bookings');
      setBookings(response.data.data);
      setFilteredBookings(response.data.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.status === statusFilter));
    }
  }, [statusFilter, bookings]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await axiosInstance.put(`/customer/bookings/${bookingId}/cancel`);
      fetchBookings();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      declined: 'bg-rose-100 text-rose-800 border-rose-200',
      in_transit: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-rose-100 text-rose-800 border-rose-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-slate-900"></div>
          <p className="mt-4 text-sm font-medium text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    completed: bookings.filter(b => b.status === 'completed').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                My Bookings
              </h1>
              <p className="text-sm sm:text-base text-gray-500">Track and manage your cargo transportation</p>
            </div>
            <a
              href="/customer/new-booking"
              className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all text-sm sm:text-base whitespace-nowrap"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Booking
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        {bookings.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Total</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
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
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.pending}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Accepted</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.accepted}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Completed</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        )}

        {/* Filter Section */}
        {bookings.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto sm:min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-white text-sm"
                >
                  <option value="all">All Bookings</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="in_transit">In Transit</option>
                  <option value="completed">Completed</option>
                  <option value="declined">Declined</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="text-xs sm:text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-900">{filteredBookings.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{bookings.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 lg:p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Bookings Yet</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8">Create your first booking to get started with cargo transportation</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a 
                  href="/customer/new-booking" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all"
                >
                  Create New Booking
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </a>
                <a 
                  href="/trucks" 
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                >
                  Browse Trucks
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <p className="text-gray-500 text-base sm:text-lg mb-4">No bookings found with the selected filter.</p>
            <button
              onClick={() => setStatusFilter('all')}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-all"
            >
              Show All Bookings
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {filteredBookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 truncate">
                        {booking.truck?.title || 'Truck'}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">
                        {booking.truck?.type || 'N/A'} • {booking.truck?.capacityTons || 'N/A'} tons
                      </p>
                      {booking.owner && (
                        <p className="text-xs sm:text-sm font-medium text-gray-700">Owner: {booking.owner.name}</p>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide border whitespace-nowrap ${getStatusColor(booking.status)}`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Route Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                  <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                    <p className="text-xs font-medium text-rose-700 mb-2">Pickup Location</p>
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{booking.pickup?.address || 'N/A'}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-xs font-medium text-blue-700 mb-2">Dropoff Location</p>
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{booking.dropoff?.address || 'N/A'}</p>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Distance</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{booking.distanceKm} km</p>
                  </div>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Rate/KM</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">₹{booking.truck?.ratePerKm || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Total Price</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">₹{booking.price}</p>
                  </div>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Booked On</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">
                      {new Date(booking.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {booking.notes && (
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg mb-6">
                    <p className="text-xs font-medium text-amber-700 mb-1">Special Notes</p>
                    <p className="text-sm text-gray-700">{booking.notes}</p>
                  </div>
                )}

                {/* Owner Info */}
                {booking.owner && (booking.owner.email || booking.owner.phone) && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-3">Owner Contact</p>
                    <div className="space-y-2">
                      {booking.owner.email && (
                        <div className="flex items-center text-xs sm:text-sm text-gray-700">
                          <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{booking.owner.email}</span>
                        </div>
                      )}
                      {booking.owner.phone && (
                        <div className="flex items-center text-xs sm:text-sm text-gray-700">
                          <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {booking.owner.phone}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-gray-200">
                  <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
                    <span className="font-medium">Created:</span>{' '}
                    {new Date(booking.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3 order-1 sm:order-2">
                    {booking.status === 'accepted' && booking.paymentStatus !== 'paid' && (
                      <button
                        onClick={async () => {
                          try {
                            await axiosInstance.post(`/payments/${booking._id}`);
                            alert('Payment processed successfully!');
                            fetchBookings();
                          } catch (error) {
                            alert(error.response?.data?.message || 'Payment failed');
                          }
                        }}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-sm hover:shadow transition-all text-sm"
                      >
                        Pay Now
                      </button>
                    )}
                    {booking.paymentStatus === 'paid' && (
                      <span className="inline-flex items-center px-3 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-medium text-xs sm:text-sm border border-emerald-200">
                        Payment Completed
                      </span>
                    )}
                    {booking.status === 'completed' && (
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="inline-flex items-center px-3 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-medium text-xs sm:text-sm border border-emerald-200">
                          Trip Completed
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              const response = await axiosInstance.get(`/bookings/${booking._id}/invoice`, {
                                responseType: 'blob'
                              });
                              const blob = new Blob([response.data], { type: 'application/pdf' });
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `invoice-${booking._id}.pdf`;
                              link.click();
                              window.URL.revokeObjectURL(url);
                            } catch (error) {
                              alert('Failed to download invoice');
                            }
                          }}
                          className="px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all text-sm"
                        >
                          Download Invoice
                        </button>
                      </div>
                    )}
                    {booking.status === 'in_transit' && (
                      <span className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium text-xs sm:text-sm border border-blue-200">
                        In Transit
                      </span>
                    )}
                    {(booking.status === 'pending' || booking.status === 'accepted') && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium shadow-sm hover:shadow transition-all text-sm"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;