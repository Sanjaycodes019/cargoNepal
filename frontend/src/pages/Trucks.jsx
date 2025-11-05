import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

const Trucks = () => {
  const [trucks, setTrucks] = useState([]);
  const [allTrucks, setAllTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', capacity: '', available: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchTrucks();
  }, [filters]);

  const fetchTrucks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.capacity) params.append('capacity', filters.capacity);
      if (filters.available !== '') params.append('available', filters.available);

      const response = await axiosInstance.get(`/trucks?${params.toString()}`);
      setAllTrucks(response.data.data);
      setTrucks(response.data.data);
    } catch (error) {
      console.error('Error fetching trucks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Filter and sort trucks
  useEffect(() => {
    let filtered = [...allTrucks];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (truck) =>
          truck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (truck.type && truck.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (truck.description && truck.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply sorting
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => (a.ratePerKm || 0) - (b.ratePerKm || 0));
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => (b.ratePerKm || 0) - (a.ratePerKm || 0));
    } else if (sortBy === 'capacity') {
      filtered.sort((a, b) => (b.capacityTons || 0) - (a.capacityTons || 0));
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setTrucks(filtered);
  }, [searchQuery, allTrucks, sortBy]);

  const clearFilters = () => {
    setFilters({ type: '', capacity: '', available: '' });
    setSearchQuery('');
    setSortBy('newest');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-slate-900"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading trucks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find Your Perfect Truck
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Connect with trusted vehicle owners across Nepal. From Kathmandu to Pokhara, 
            Biratnagar to Butwal - find the right truck for your cargo needs.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-slate-900 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Verified Owners</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-slate-900 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Real-Time Availability</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-slate-900 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Best Rates</span>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Trucks
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, type, or description..."
                  className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Sort */}
            <div className="lg:w-56">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="capacity">Capacity: High to Low</option>
              </select>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Truck Type
              </label>
              <input
                type="text"
                name="type"
                placeholder="e.g., tipper, container..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                value={filters.type}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Min Capacity (tons)
              </label>
              <input
                type="number"
                name="capacity"
                placeholder="e.g., 5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                value={filters.capacity}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Availability
              </label>
              <select
                name="available"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-white"
                value={filters.available}
                onChange={handleFilterChange}
              >
                <option value="">All Trucks</option>
                <option value="true">Available Only</option>
                <option value="false">Not Available</option>
              </select>
            </div>
          </div>

          {/* Clear Filters & Results Count */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{trucks.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{allTrucks.length}</span> trucks
            </p>
            {(filters.type || filters.capacity || filters.available || searchQuery) && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Trucks Grid */}
        {trucks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Trucks Found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or search terms to find more trucks.
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm hover:shadow transition-all"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trucks.map((truck) => (
              <div
                key={truck._id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 group"
              >
                {/* Image Section */}
                <div className="relative h-52 bg-gray-100 overflow-hidden">
                  {truck.imageUrl ? (
                    <img
                      src={truck.imageUrl}
                      alt={truck.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Availability Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold shadow-sm ${
                      truck.available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${truck.available ? 'bg-green-600' : 'bg-red-600'}`}></span>
                      {truck.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  
                  {/* Price Badge */}
                  <div className="absolute bottom-3 left-3">
                    <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                      <p className="text-xs text-gray-500">Starting from</p>
                      <p className="text-lg font-bold text-slate-900">Rs. {truck.ratePerKm || 25}<span className="text-sm text-gray-500">/km</span></p>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-slate-700 transition-colors">
                    {truck.title}
                  </h3>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Type</p>
                      <p className="text-sm font-bold text-gray-900">{truck.type || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Capacity</p>
                      <p className="text-sm font-bold text-gray-900">{truck.capacityTons || 'N/A'} tons</p>
                    </div>
                  </div>

                  {/* Owner Info */}
                  {truck.owner && (
                    <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                      <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center mr-3 text-white font-bold text-sm">
                        {truck.owner.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Owner</p>
                        <p className="text-sm font-semibold text-gray-900">{truck.owner.name}</p>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {truck.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{truck.description}</p>
                  )}

                  {/* View Details Button */}
                  <Link
                    to={`/trucks/${truck._id}`}
                    className="block w-full text-center px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold shadow-sm hover:shadow transition-all"
                  >
                    View Details & Book
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trucks;