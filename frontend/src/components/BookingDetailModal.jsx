import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { getSocket } from '../utils/socket';

const BookingDetailModal = ({ bookingId, isOpen, onClose, onStatusUpdate, userRole }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchBooking();
    }
  }, [isOpen, bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      // Fetch booking details based on user role
      if (userRole === 'owner') {
        const response = await axiosInstance.get(`/owner/bookings/${bookingId}`);
        setBooking(response.data.data || null);
      } else {
        const response = await axiosInstance.get('/customer/bookings');
        const bookingData = response.data.data.find(b => b._id === bookingId);
        setBooking(bookingData || null);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    const statusMessages = {
      'accepted': 'accept',
      'declined': 'decline',
      'in_transit': 'mark as in transit',
      'completed': 'mark as completed'
    };
    
    const message = statusMessages[status] || status;
    if (!window.confirm(`Are you sure you want to ${message} this booking?`)) {
      return;
    }
    try {
      setUpdating(true);
      const response = await axiosInstance.put(`/owner/bookings/${bookingId}/status`, { status });
      if (response.data.success) {
        // Emit socket update if needed
        const socket = getSocket();
        if (socket) {
          socket.emit('refresh_bookings');
        }
        
        await fetchBooking();
        if (onStatusUpdate) {
          onStatusUpdate();
        }
        // Show success toast
        if (status === 'completed') {
          alert('✅ Trip marked as completed! Customer has been notified.');
        } else {
          alert(`Booking ${status} successfully!`);
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update booking status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      in_transit: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg">Loading...</div>
            </div>
          ) : !booking ? (
            <div className="text-center py-8">
              <div className="text-lg text-red-600">Booking not found</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{booking.truck?.title || 'Truck'}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {userRole === 'owner' 
                      ? `Customer: ${booking.customer?.name || 'N/A'}`
                      : `Owner: ${booking.owner?.name || 'N/A'}`
                    }
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusColor(booking.status)}`}>
                  {booking.status.replace('_', ' ')}
                </span>
              </div>

              {/* Route Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Pickup Location</p>
                  <p className="font-medium text-gray-900">{booking.pickup?.address || 'N/A'}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Dropoff Location</p>
                  <p className="font-medium text-gray-900">{booking.dropoff?.address || 'N/A'}</p>
                </div>
              </div>

              {/* Booking Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Distance</p>
                  <p className="font-bold text-xl text-gray-900">{booking.distanceKm} km</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Price</p>
                  <p className="font-bold text-xl text-[#DC143C]">Rs. {booking.price}</p>
                </div>
              </div>

              {booking.truck && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Truck Details</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><span className="font-medium">Type:</span> {booking.truck.type || 'N/A'}</p>
                    <p><span className="font-medium">Capacity:</span> {booking.truck.capacityTons || 'N/A'} tons</p>
                    <p><span className="font-medium">Rate:</span> Rs. {booking.truck.ratePerKm}/km</p>
                  </div>
                </div>
              )}

              {booking.notes && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{booking.notes}</p>
                </div>
              )}

              {/* Action Buttons for Owners */}
              {userRole === 'owner' && booking.status === 'pending' && (
                <div className="flex space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleStatusUpdate('accepted')}
                    disabled={updating}
                    className="flex-1 px-6 py-3 bg-[#003893] text-white rounded-lg hover:bg-[#002A5C] font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {updating ? 'Processing...' : '✓ Accept'}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('declined')}
                    disabled={updating}
                    className="flex-1 px-6 py-3 bg-[#DC143C] text-white rounded-lg hover:bg-[#B3121C] font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {updating ? 'Processing...' : '✗ Decline'}
                  </button>
                </div>
              )}

              {userRole === 'owner' && booking.status === 'accepted' && (
                <div className="flex space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleStatusUpdate('in_transit')}
                    disabled={updating}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {updating ? 'Processing...' : '🚚 Mark as In Transit'}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={updating}
                    className="flex-1 px-6 py-3 bg-[#003893] text-white rounded-lg hover:bg-[#002A5C] font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {updating ? 'Processing...' : '✓ Mark Trip as Completed'}
                  </button>
                </div>
              )}

              {userRole === 'owner' && booking.status === 'in_transit' && (
                <div className="flex space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={updating}
                    className="flex-1 px-6 py-3 bg-[#003893] text-white rounded-lg hover:bg-[#002A5C] font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {updating ? 'Processing...' : '✓ Mark Trip as Completed'}
                  </button>
                </div>
              )}

              {userRole === 'owner' && booking.status === 'completed' && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-semibold flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Trip Completed Successfully
                    </p>
                    <p className="text-sm text-green-700 mt-2">Customer has been notified and can now download the invoice.</p>
                  </div>
                </div>
              )}

              {userRole === 'customer' && booking.status === 'completed' && (
                <div className="flex space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={async () => {
                      try {
                        const response = await axiosInstance.get(`/bookings/${bookingId}/invoice`, {
                          responseType: 'blob'
                        });
                        const blob = new Blob([response.data], { type: 'application/pdf' });
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `invoice-${bookingId}.pdf`;
                        link.click();
                        window.URL.revokeObjectURL(url);
                      } catch (error) {
                        alert('Failed to download invoice');
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-[#003893] text-white rounded-lg hover:bg-[#002A5C] font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    📄 Download Invoice
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;

