import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import BookingMap from '../components/BookingMap';

const TruckReviews = ({ truckId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [truckId]);

  const fetchReviews = async () => {
    try {
      const response = await axiosInstance.get(`/reviews/truck/${truckId}`);
      setReviews(response.data.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h3>
      {reviews.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-gray-500">No reviews yet. Be the first to review this truck!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold">
                    {(review.customer?.name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{review.customer?.name || 'Anonymous'}</p>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-sm font-medium text-gray-600">{review.rating}/5</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              {review.comment && <p className="text-gray-700 mt-3 leading-relaxed">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TruckDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCustomer } = useContext(AuthContext);
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    pickup: { address: '' },
    dropoff: { address: '' },
    notes: ''
  });
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchTruck();
  }, [id]);

  const fetchTruck = async () => {
    try {
      const response = await axiosInstance.get(`/trucks/${id}`);
      setTruck(response.data.data);
    } catch (error) {
      console.error('Error fetching truck:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingDataChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('pickup')) {
      const field = name.split('.')[1];
      setBookingData({
        ...bookingData,
        pickup: { ...bookingData.pickup, [field]: value }
      });
    } else if (name.includes('dropoff')) {
      const field = name.split('.')[1];
      setBookingData({
        ...bookingData,
        dropoff: { ...bookingData.dropoff, [field]: value }
      });
    } else {
      setBookingData({ ...bookingData, [name]: value });
    }
  };

  const calculateDistance = async () => {
    if (!bookingData.pickup.address || !bookingData.dropoff.address) {
      alert('Please provide both pickup and dropoff locations');
      return;
    }

    setCalculating(true);
    try {
      const response = await axiosInstance.post('/utils/bookings/calculate', {
        pickup: { address: bookingData.pickup.address },
        dropoff: { address: bookingData.dropoff.address },
        ratePerKm: truck.ratePerKm
      });

      setEstimatedPrice(response.data.data);
      setPickupCoords(response.data.data.pickupCoords);
      setDropoffCoords(response.data.data.dropoffCoords);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to calculate distance. Please check location names.');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!isCustomer) {
      alert('Please login as a customer to book');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axiosInstance.post('/bookings', {
        truckId: id,
        pickup: { address: bookingData.pickup.address },
        dropoff: { address: bookingData.dropoff.address },
        notes: bookingData.notes
      });
      alert('Booking request created successfully!');
      setShowBookingModal(false);
      navigate('/customer/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-slate-900"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading truck details...</p>
        </div>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Truck Not Found</h2>
          <p className="text-gray-600 mb-6">The truck you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/trucks"
            className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all"
          >
            Browse All Trucks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link 
          to="/trucks" 
          className="inline-flex items-center text-slate-900 hover:text-slate-700 font-medium mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Trucks
        </Link>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Image Section */}
          {truck.imageUrl && (
            <div className="h-96 bg-gray-100 overflow-hidden">
              <img
                src={truck.imageUrl}
                alt={truck.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{truck.title}</h1>
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${
                    truck.available 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${truck.available ? 'bg-green-600' : 'bg-red-600'}`}></span>
                    {truck.available ? 'Available' : 'Not Available'}
                  </span>
                </div>
                {truck.available && (
                  <div className="text-left sm:text-right">
                    <p className="text-sm text-gray-500 mb-1">Starting from</p>
                    <p className="text-3xl font-bold text-slate-900">Rs. {truck.ratePerKm || 25}<span className="text-lg text-gray-500">/km</span></p>
                  </div>
                )}
              </div>
            </div>

            {/* Truck Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Type</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{truck.type || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Capacity</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{truck.capacityTons || 'N/A'} tons</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Rate</p>
                </div>
                <p className="text-lg font-bold text-slate-900">Rs. {truck.ratePerKm || 25}/km</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                </div>
                <p className={`text-lg font-bold ${truck.available ? 'text-green-600' : 'text-red-600'}`}>
                  {truck.available ? 'Available' : 'Unavailable'}
                </p>
              </div>
            </div>

            {/* Description */}
            {truck.description && (
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{truck.description}</p>
              </div>
            )}

            {/* Owner Information */}
            {truck.owner && (
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Owner Information</h3>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                      {truck.owner.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{truck.owner.name}</p>
                      <p className="text-sm text-gray-500">Vehicle Owner</p>
                    </div>
                  </div>
                  {truck.owner.email && (
                    <div className="flex items-center text-sm text-gray-700 mb-2">
                      <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {truck.owner.email}
                    </div>
                  )}
                  {truck.owner.phone && (
                    <div className="flex items-center text-sm text-gray-700">
                      <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {truck.owner.phone}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Book Button */}
            {isCustomer && truck.available && (
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full px-6 py-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold text-lg shadow-sm hover:shadow transition-all mb-8"
              >
                Request Booking
              </button>
            )}

            {/* Reviews Section */}
            <TruckReviews truckId={truck._id} />
          </div>
        </div>

        {/* Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Request Booking</h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmitBooking} className="p-6">
                <div className="space-y-5">
                  {/* Pickup Location */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pickup Location <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="pickup.address"
                      placeholder="e.g., Kathmandu, Pokhara, Biratnagar..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-gray-900"
                      value={bookingData.pickup.address}
                      onChange={handleBookingDataChange}
                      required
                    />
                    <p className="mt-1.5 text-xs text-gray-500">Enter any location in Nepal</p>
                  </div>

                  {/* Dropoff Location */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dropoff Location <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="dropoff.address"
                      placeholder="e.g., Kathmandu, Pokhara, Biratnagar..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-gray-900"
                      value={bookingData.dropoff.address}
                      onChange={handleBookingDataChange}
                      required
                    />
                    <p className="mt-1.5 text-xs text-gray-500">Enter any location in Nepal</p>
                  </div>

                  {/* Calculate Button */}
                  <button
                    type="button"
                    onClick={calculateDistance}
                    disabled={calculating}
                    className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {calculating ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Calculating...
                      </span>
                    ) : (
                      'Calculate Distance & Price'
                    )}
                  </button>

                  {/* Price Display */}
                  {estimatedPrice && (
                    <div className="bg-green-50 border border-green-200 p-5 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <p className="font-semibold text-green-800">Distance</p>
                        <p className="font-bold text-xl text-green-700">{estimatedPrice.distanceKm} km</p>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-green-200">
                        <p className="font-semibold text-green-800">Estimated Price</p>
                        <p className="font-bold text-2xl text-green-700">Rs. {estimatedPrice.estimatedPrice}</p>
                      </div>
                    </div>
                  )}

                  {/* Map */}
                  {pickupCoords && dropoffCoords && (
                    <BookingMap
                      pickup={pickupCoords}
                      dropoff={dropoffCoords}
                      distance={estimatedPrice?.distanceKm}
                    />
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Notes <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      name="notes"
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-gray-900"
                      value={bookingData.notes}
                      onChange={handleBookingDataChange}
                      placeholder="Any special instructions or requirements..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !estimatedPrice}
                    className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm hover:shadow transition-all"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      'Submit Booking'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TruckDetail;