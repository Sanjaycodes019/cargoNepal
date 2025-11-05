import { useState, useEffect, useContext } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import { initSocket, getSocket } from '../utils/socket';
import BookingMap from '../components/BookingMap';

const OwnerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [trucks, setTrucks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTruckForm, setShowTruckForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [truckForm, setTruckForm] = useState({
    title: '',
    type: '',
    capacityTons: '',
    ratePerKm: '',
    available: true,
    description: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchData();
    
    if (user) {
      initSocket(user.id);
      const socket = getSocket();
      
      if (socket) {
        socket.on('new_booking', (data) => {
          fetchData();
        });
        
        socket.on('booking_updated', (data) => {
          fetchData();
        });
      }

      return () => {
        if (socket) {
          socket.off('new_booking');
          socket.off('booking_updated');
        }
      };
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [trucksRes, bookingsRes] = await Promise.all([
        axiosInstance.get('/owner/trucks'),
        axiosInstance.get('/owner/bookings')
      ]);
      setTrucks(trucksRes.data.data);
      setBookings(bookingsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTruckFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTruckForm({
      ...truckForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmitTruck = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...truckForm,
        capacityTons: truckForm.capacityTons ? parseFloat(truckForm.capacityTons) : undefined,
        ratePerKm: truckForm.ratePerKm ? parseFloat(truckForm.ratePerKm) : undefined
      };

      if (editingTruck) {
        await axiosInstance.put(`/owner/trucks/${editingTruck._id}`, data);
      } else {
        await axiosInstance.post('/owner/trucks', data);
      }
      setShowTruckForm(false);
      setEditingTruck(null);
      setTruckForm({
        title: '',
        type: '',
        capacityTons: '',
        ratePerKm: '',
        available: true,
        description: '',
        imageUrl: ''
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save truck');
    }
  };

  const handleEditTruck = (truck) => {
    setEditingTruck(truck);
    setTruckForm({
      title: truck.title,
      type: truck.type || '',
      capacityTons: truck.capacityTons || '',
      ratePerKm: truck.ratePerKm || '',
      available: truck.available,
      description: truck.description || '',
      imageUrl: truck.imageUrl || ''
    });
    setShowTruckForm(true);
  };

  const handleToggleAvailability = async (truckId) => {
    try {
      await axiosInstance.put(`/owner/trucks/${truckId}/toggle`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to toggle availability');
    }
  };

  const handleDeleteTruck = async (truckId) => {
    if (!window.confirm('Are you sure you want to delete this truck?')) {
      return;
    }
    try {
      await axiosInstance.delete(`/owner/trucks/${truckId}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete truck');
    }
  };

  const handleUpdateBookingStatus = async (bookingId, status) => {
    const confirmMessage = {
      'accepted': 'Accept this booking?',
      'declined': 'Decline this booking?',
      'in_transit': 'Mark this booking as in transit?',
      'completed': 'Mark this trip as completed?'
    };

    if (!window.confirm(confirmMessage[status] || `Update booking status to ${status}?`)) {
      return;
    }

    try {
      const response = await axiosInstance.put(`/owner/bookings/${bookingId}/status`, { status });
      if (response.data.success) {
        fetchData();
        setSelectedBooking(null);
        alert(`Booking ${status === 'completed' ? 'marked as completed' : status} successfully!`);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update booking status');
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
          <p className="mt-4 text-sm font-medium text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalTrucks: trucks.length,
    availableTrucks: trucks.filter(t => t.available).length,
    unavailableTrucks: trucks.filter(t => !t.available).length,
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    acceptedBookings: bookings.filter(b => b.status === 'accepted').length,
    inTransitBookings: bookings.filter(b => b.status === 'in_transit').length,
    completedBookings: bookings.filter(b => b.status === 'completed').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                Owner Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Manage your fleet and bookings</p>
            </div>
            <button
              onClick={() => {
                setShowTruckForm(true);
                setEditingTruck(null);
                setTruckForm({
                  title: '',
                  type: '',
                  capacityTons: '',
                  ratePerKm: '',
                  available: true,
                  description: '',
                  imageUrl: ''
                });
              }}
              className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all whitespace-nowrap"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Truck
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <p className="text-xs font-medium text-gray-600 mb-1">Trucks</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalTrucks}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <p className="text-xs font-medium text-gray-600 mb-1">Available</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{stats.availableTrucks}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <p className="text-xs font-medium text-gray-600 mb-1">Unavailable</p>
            <p className="text-xl sm:text-2xl font-bold text-rose-600">{stats.unavailableTrucks}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <p className="text-xs font-medium text-gray-600 mb-1">Bookings</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <p className="text-xs font-medium text-gray-600 mb-1">Pending</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-600">{stats.pendingBookings}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <p className="text-xs font-medium text-gray-600 mb-1">Accepted</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{stats.acceptedBookings}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <p className="text-xs font-medium text-gray-600 mb-1">In Transit</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.inTransitBookings}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <p className="text-xs font-medium text-gray-600 mb-1">Completed</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-700">{stats.completedBookings}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* My Trucks Section */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  My Trucks <span className="text-gray-500">({trucks.length})</span>
                </h2>
                {stats.availableTrucks > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {stats.availableTrucks} Available
                  </span>
                )}
              </div>

              {trucks.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">No trucks registered yet</p>
                  <button
                    onClick={() => {
                      setShowTruckForm(true);
                      setEditingTruck(null);
                    }}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm transition-all text-sm"
                  >
                    Add Your First Truck
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] lg:max-h-[800px] overflow-y-auto pr-2">
                  {trucks.map((truck) => (
                    <div
                      key={truck._id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        {truck.imageUrl ? (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            <img
                              src={truck.imageUrl}
                              alt={truck.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate pr-2">{truck.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 border ${
                              truck.available 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                              {truck.available ? 'Available' : 'Busy'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mb-3 text-xs sm:text-sm">
                            <div>
                              <p className="text-gray-500 text-xs">Type</p>
                              <p className="font-medium text-gray-900 capitalize truncate">{truck.type || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Capacity</p>
                              <p className="font-medium text-gray-900">{truck.capacityTons || 'N/A'} tons</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Rate/KM</p>
                              <p className="font-bold text-gray-900">₹{truck.ratePerKm || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">ID</p>
                              <p className="font-mono text-gray-600 truncate text-xs">{truck._id.slice(-6)}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleToggleAvailability(truck._id)}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                truck.available
                                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              {truck.available ? 'Mark Busy' : 'Mark Available'}
                            </button>
                            <button
                              onClick={() => handleEditTruck(truck)}
                              className="px-3 py-1.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 text-xs font-medium transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTruck(truck._id)}
                              className="px-3 py-1.5 bg-rose-600 text-white rounded-md hover:bg-rose-700 text-xs font-medium transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking Requests Section */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Bookings <span className="text-gray-500">({bookings.length})</span>
                </h2>
                {stats.pendingBookings > 0 && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium border border-amber-200 animate-pulse">
                    {stats.pendingBookings} New
                  </span>
                )}
              </div>

              {bookings.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base">No booking requests yet</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">Requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] lg:max-h-[800px] overflow-y-auto pr-2">
                  {bookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">{booking.truck?.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                              {booking.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            <span className="font-medium">Customer:</span> {booking.customer?.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{booking.customer?.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-rose-50 p-2 rounded-lg border border-rose-200">
                          <p className="text-xs text-rose-700 font-medium mb-1">Pickup</p>
                          <p className="text-xs font-medium text-gray-900 truncate">{booking.pickup?.address || 'N/A'}</p>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-700 font-medium mb-1">Dropoff</p>
                          <p className="text-xs font-medium text-gray-900 truncate">{booking.dropoff?.address || 'N/A'}</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Distance</p>
                          <p className="text-sm font-bold text-gray-900">{booking.distanceKm} km</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Price</p>
                          <p className="text-sm font-bold text-gray-900">₹{booking.price}</p>
                        </div>
                      </div>

                      {booking.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateBookingStatus(booking._id, 'accepted');
                            }}
                            className="flex-1 px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-medium transition-all"
                          >
                            Accept
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateBookingStatus(booking._id, 'declined');
                            }}
                            className="flex-1 px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-xs font-medium transition-all"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {booking.status === 'accepted' && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateBookingStatus(booking._id, 'in_transit');
                            }}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition-all"
                          >
                            Start Trip
                          </button>
                        </div>
                      )}
                      {booking.status === 'in_transit' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateBookingStatus(booking._id, 'completed');
                          }}
                          className="w-full px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-medium transition-all"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Detail Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBooking(null)}>
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Booking Details</h2>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 pb-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{selectedBooking.truck?.title}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Customer:</span> {selectedBooking.customer?.name}
                      </p>
                      <p className="text-xs text-gray-500">{selectedBooking.customer?.email}</p>
                      {selectedBooking.customer?.phone && (
                        <p className="text-xs text-gray-500">{selectedBooking.customer.phone}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase border whitespace-nowrap ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                      <p className="text-xs font-medium text-rose-700 mb-2">Pickup</p>
                      <p className="text-sm font-medium text-gray-900">{selectedBooking.pickup?.address || 'N/A'}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs font-medium text-blue-700 mb-2">Dropoff</p>
                      <p className="text-sm font-medium text-gray-900">{selectedBooking.dropoff?.address || 'N/A'}</p>
                    </div>
                  </div>

                  {selectedBooking.pickup?.lat && selectedBooking.dropoff?.lat && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <BookingMap
                        pickup={selectedBooking.pickup}
                        dropoff={selectedBooking.dropoff}
                        distance={selectedBooking.distanceKm}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-1">Distance</p>
                      <p className="text-lg font-bold text-gray-900">{selectedBooking.distanceKm} km</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-1">Rate/KM</p>
                      <p className="text-lg font-bold text-gray-900">₹{selectedBooking.truck?.ratePerKm || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-1">Total Price</p>
                      <p className="text-lg font-bold text-gray-900">₹{selectedBooking.price}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-1">Capacity</p>
                      <p className="text-lg font-bold text-gray-900">{selectedBooking.truck?.capacityTons || 'N/A'} tons</p>
                    </div>
                  </div>

                  {selectedBooking.notes && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
                      <p className="text-xs font-medium text-amber-700 mb-1">Customer Notes</p>
                      <p className="text-sm text-gray-700">{selectedBooking.notes}</p>
                    </div>
                  )}

                  {selectedBooking.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleUpdateBookingStatus(selectedBooking._id, 'accepted')}
                        className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all"
                      >
                        Accept Booking
                      </button>
                      <button
                        onClick={() => handleUpdateBookingStatus(selectedBooking._id, 'declined')}
                        className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium shadow-sm hover:shadow transition-all"
                      >
                        Decline Booking
                      </button>
                    </div>
                  )}
                  {selectedBooking.status === 'accepted' && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleUpdateBookingStatus(selectedBooking._id, 'in_transit')}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm hover:shadow transition-all"
                      >
                        Start Trip
                      </button>
                    </div>
                  )}
                  {selectedBooking.status === 'in_transit' && (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleUpdateBookingStatus(selectedBooking._id, 'completed')}
                        className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all"
                      >
                        Mark as Completed
                      </button>
                    </div>
                  )}
                  {selectedBooking.status === 'completed' && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <p className="text-emerald-800 font-medium flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Trip Completed Successfully
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Truck Form Modal */}
        {showTruckForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {editingTruck ? 'Edit Truck' : 'Add New Truck'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowTruckForm(false);
                      setEditingTruck(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleSubmitTruck} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Truck Title <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                      value={truckForm.title}
                      onChange={handleTruckFormChange}
                      placeholder="e.g., Tata Tipper 10 Ton"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Truck Type</label>
                    <input
                      type="text"
                      name="type"
                      placeholder="e.g., tipper, container, flatbed"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                      value={truckForm.type}
                      onChange={handleTruckFormChange}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Capacity (Tons)</label>
                      <input
                        type="number"
                        name="capacityTons"
                        step="0.1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                        value={truckForm.capacityTons}
                        onChange={handleTruckFormChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rate per KM (₹)</label>
                      <input
                        type="number"
                        name="ratePerKm"
                        step="0.1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                        value={truckForm.ratePerKm}
                        onChange={handleTruckFormChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image URL (Optional)</label>
                    <input
                      type="url"
                      name="imageUrl"
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                      value={truckForm.imageUrl}
                      onChange={handleTruckFormChange}
                    />
                    <p className="mt-1.5 text-xs text-gray-500">Enter a direct image URL</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all resize-none"
                      value={truckForm.description}
                      onChange={handleTruckFormChange}
                      placeholder="Describe your truck..."
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="available"
                      id="available"
                      className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-gray-300 rounded"
                      checked={truckForm.available}
                      onChange={handleTruckFormChange}
                    />
                    <label htmlFor="available" className="ml-3 block text-sm font-medium text-gray-900">
                      Available for booking
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTruckForm(false);
                        setEditingTruck(null);
                      }}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all"
                    >
                      {editingTruck ? 'Update Truck' : 'Add Truck'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;