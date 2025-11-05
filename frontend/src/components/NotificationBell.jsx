import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import { initSocket, getSocket } from '../utils/socket';
import BookingDetailModal from './BookingDetailModal';

const NotificationBell = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      initSocket(user.id);

      const socket = getSocket();
      if (socket) {
        socket.on('booking_updated', (data) => {
          fetchNotifications();
        });

        socket.on('new_booking', (data) => {
          fetchNotifications();
        });
      }

      return () => {
        if (socket) {
          socket.off('booking_updated');
          socket.off('new_booking');
        }
      };
    }
  }, [isAuthenticated, user]);

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get('/notifications');
      setNotifications(response.data.data.notifications);
      setUnreadCount(response.data.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.put('/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          fetchNotifications();
        }}
        className="relative p-2 text-gray-700 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-20 border border-gray-200 max-h-96 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-slate-900 hover:text-slate-700 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-gray-500 text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => {
                      if (!notification.read) {
                        handleMarkAsRead(notification._id);
                      }
                      setShowDropdown(false);
                      if (notification.type === 'booking' && notification.relatedId) {
                        setSelectedBookingId(notification.relatedId);
                        setShowBookingModal(true);
                      } else if (notification.type === 'booking') {
                        if (user.role === 'owner') {
                          navigate('/owner/dashboard');
                        } else {
                          navigate('/customer/dashboard');
                        }
                      }
                    }}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        !notification.read ? 'bg-blue-500' : 'bg-transparent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 leading-relaxed">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Booking Detail Modal */}
      {showBookingModal && (
        <BookingDetailModal
          bookingId={selectedBookingId}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedBookingId(null);
          }}
          onStatusUpdate={() => {
            fetchNotifications();
            setShowBookingModal(false);
            setSelectedBookingId(null);
          }}
          userRole={user?.role}
        />
      )}
    </div>
  );
};

export default NotificationBell;