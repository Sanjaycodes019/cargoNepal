import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import BookingMap from '../components/BookingMap';

const NewBooking = () => {
  const { user, isCustomer } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    pickup: { address: '' },
    dropoff: { address: '' },
    notes: ''
  });

  const [trucks, setTrucks] = useState([]);
  const [route, setRoute] = useState(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('pickup')) {
      setFormData({ ...formData, pickup: { ...formData.pickup, address: value } });
    } else if (name.includes('dropoff')) {
      setFormData({ ...formData, dropoff: { ...formData.dropoff, address: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!formData.pickup.address || !formData.dropoff.address) {
      alert('Please provide both pickup and dropoff locations');
      return;
    }

    setSearching(true);
    setTrucks([]);
    setRoute(null);

    try {
      const response = await axiosInstance.post('/customer/search-trucks', {
        pickup: { address: formData.pickup.address },
        dropoff: { address: formData.dropoff.address }
      });

      setTrucks(response.data.data.trucks);
      setRoute(response.data.data.route);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to search trucks. Please check location names.');
      console.error('Error searching trucks:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleBookTruck = async (truck) => {
    if (!window.confirm(`Confirm booking with ${truck.title}?`)) return;

    setSubmitting(true);
    setSelectedTruck(truck._id);

    try {
      await axiosInstance.post('/bookings', {
        truckId: truck._id,
        pickup: {
          address: formData.pickup.address,
          lat: route.pickup.lat,
          lng: route.pickup.lng
        },
        dropoff: {
          address: formData.dropoff.address,
          lat: route.dropoff.lat,
          lng: route.dropoff.lng
        },
        notes: formData.notes
      });

      alert('Booking request created successfully!');
      navigate('/customer/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
      setSelectedTruck(null);
    }
  };

  if (!isCustomer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please login as a customer to create a booking.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-all shadow-sm"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Booking</h1>
          <p className="text-gray-600 text-sm sm:text-base">Find trucks available for your desired route</p>
        </div>

        {/* Booking Form */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pickup Location <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="pickup.address"
                  placeholder="e.g., Kathmandu"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-gray-900 placeholder-gray-400 transition-all"
                  value={formData.pickup.address}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dropoff Location <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="dropoff.address"
                  placeholder="e.g., Pokhara"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-gray-900 placeholder-gray-400 transition-all"
                  value={formData.dropoff.address}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Goods Description (Optional)</label>
              <textarea
                name="notes"
                rows="3"
                placeholder="Describe your cargo or any special requirements..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-gray-900 placeholder-gray-400 resize-none"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={searching}
              className="w-full py-3.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 font-medium transition-all shadow-md hover:shadow-lg"
            >
              {searching ? 'Searching...' : 'Search Available Trucks'}
            </button>
          </form>
        </div>

        {/* Route Info */}
        {route && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Route Summary</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-rose-50 p-4 rounded-lg border border-rose-100">
                <p className="text-xs font-medium text-rose-700">Pickup</p>
                <p className="font-medium text-gray-900">{route.pickup.address}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-blue-700">Dropoff</p>
                <p className="font-medium text-gray-900">{route.dropoff.address}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Total Distance</span>
              <span className="text-2xl font-bold text-gray-900">{route.distance} km</span>
            </div>
            {route.pickup.lat && route.dropoff.lat && (
              <div className="mt-6">
                <BookingMap
                  pickup={{ ...route.pickup }}
                  dropoff={{ ...route.dropoff }}
                  distance={route.distance}
                />
              </div>
            )}
          </div>
        )}

        {/* Available Trucks */}
        {trucks.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Available Trucks ({trucks.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trucks.map((truck) => (
                <div key={truck._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
                  {truck.imageUrl && (
                    <div className="h-40 bg-gray-100 rounded-lg overflow-hidden mb-4">
                      <img
                        src={truck.imageUrl}
                        alt={truck.title}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{truck.title}</h3>
                    {truck.distanceToPickup > 0 && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                        {truck.distanceToPickup} km
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between text-gray-700">
                      <span>Type:</span>
                      <span className="font-medium text-gray-900 capitalize">{truck.type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Capacity:</span>
                      <span className="font-medium text-gray-900">{truck.capacityTons || 'N/A'} tons</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Owner:</span>
                      <span className="font-medium text-gray-900">{truck.owner?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-100 pt-2 text-gray-700">
                      <span>Distance:</span>
                      <span className="font-bold text-gray-900">{truck.tripDistance} km</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Rate:</span>
                      <span className="font-medium text-gray-900">₹{truck.ratePerKm}/km</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex justify-between items-center mb-4">
                    <span className="text-sm font-semibold text-emerald-800">Estimated Cost</span>
                    <span className="text-lg font-bold text-gray-900">₹{truck.estimatedPrice}</span>
                  </div>

                  <button
                    onClick={() => handleBookTruck(truck)}
                    disabled={submitting && selectedTruck === truck._id}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 font-medium shadow-sm hover:shadow transition-all"
                  >
                    {submitting && selectedTruck === truck._id ? 'Booking...' : 'Book Truck'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Trucks */}
        {route && trucks.length === 0 && !searching && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-10 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Trucks Found</h3>
            <p className="text-gray-600">We couldn’t find trucks on this route right now.</p>
            <p className="text-gray-500 text-sm mt-2">Try different locations or check again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewBooking;
