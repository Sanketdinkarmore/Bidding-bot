"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMasterData, MasterDataFilters } from '../../lib/api';

export default function MasterPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [destinationCityFilter, setDestinationCityFilter] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [originCityFilter, setOriginCityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Dropdown states
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [showVehicleTypeDropdown, setShowVehicleTypeDropdown] = useState(false);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  
  // Search states for dropdowns
  const [destinationSearchTerm, setDestinationSearchTerm] = useState('');
  const [vehicleTypeSearchTerm, setVehicleTypeSearchTerm] = useState('');
  const [originSearchTerm, setOriginSearchTerm] = useState('');

  // Refs for dropdowns
  const destinationDropdownRef = useRef<HTMLDivElement>(null);
  const vehicleTypeDropdownRef = useRef<HTMLDivElement>(null);
  const originDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (destinationDropdownRef.current && !destinationDropdownRef.current.contains(event.target as Node)) {
        setShowDestinationDropdown(false);
        setDestinationSearchTerm('');
      }
      if (vehicleTypeDropdownRef.current && !vehicleTypeDropdownRef.current.contains(event.target as Node)) {
        setShowVehicleTypeDropdown(false);
        setVehicleTypeSearchTerm('');
      }
      if (originDropdownRef.current && !originDropdownRef.current.contains(event.target as Node)) {
        setShowOriginDropdown(false);
        setOriginSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prepare filters for the query
  const filters: MasterDataFilters = useMemo(() => ({
    search: searchTerm,
    destinationCity: destinationCityFilter,
    vehicleType: vehicleTypeFilter,
    originCity: originCityFilter,
    page: currentPage,
    limit: pageSize
  }), [searchTerm, destinationCityFilter, vehicleTypeFilter, originCityFilter, currentPage, pageSize]);

  // React Query for data fetching
  const {
    data: response,
    isLoading,
    isError,
    error,
    isFetching
  } = useQuery({
    queryKey: ['masterData', filters],
    queryFn: () => fetchMasterData(filters),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Get unique values for dropdowns from the first page of data
  const { data: allDataForFilters } = useQuery({
    queryKey: ['masterDataFilters'],
    queryFn: () => fetchMasterData({ limit: 1000 }), // Get all data for filter options
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => ({
      destinationCities: [...new Set(data.data.map(row => row.destinationCity))],
      vehicleTypes: [...new Set(data.data.map(row => row.ftlType))],
      originCities: [...new Set(data.data.map(row => row.originCity))]
    })
  });

  // Filter options based on search terms
  const filteredDestinationCities = useMemo(() => {
    if (!allDataForFilters?.destinationCities) return [];
    return allDataForFilters.destinationCities.filter(city =>
      city.toLowerCase().includes(destinationSearchTerm.toLowerCase())
    );
  }, [allDataForFilters?.destinationCities, destinationSearchTerm]);

  const filteredVehicleTypes = useMemo(() => {
    if (!allDataForFilters?.vehicleTypes) return [];
    return allDataForFilters.vehicleTypes.filter(type =>
      type.toLowerCase().includes(vehicleTypeSearchTerm.toLowerCase())
    );
  }, [allDataForFilters?.vehicleTypes, vehicleTypeSearchTerm]);

  const filteredOriginCities = useMemo(() => {
    if (!allDataForFilters?.originCities) return [];
    return allDataForFilters.originCities.filter(city =>
      city.toLowerCase().includes(originSearchTerm.toLowerCase())
    );
  }, [allDataForFilters?.originCities, originSearchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDestinationCityFilter('');
    setVehicleTypeFilter('');
    setOriginCityFilter('');
    setCurrentPage(1);
  };

  // Reset to first page when filters change
  const handleFilterChange = (filterSetter: (value: string) => void, value: string) => {
    filterSetter(value);
    setCurrentPage(1);
  };

  // Custom dropdown handlers
  const handleDestinationSelect = (city: string) => {
    setDestinationCityFilter(city);
    setShowDestinationDropdown(false);
    setDestinationSearchTerm('');
    setCurrentPage(1);
  };

  const handleVehicleTypeSelect = (type: string) => {
    setVehicleTypeFilter(type);
    setShowVehicleTypeDropdown(false);
    setVehicleTypeSearchTerm('');
    setCurrentPage(1);
  };

  const handleOriginSelect = (city: string) => {
    setOriginCityFilter(city);
    setShowOriginDropdown(false);
    setOriginSearchTerm('');
    setCurrentPage(1);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString; // Return as-is if parsing fails
    }
  };

  // Pagination component
  const PaginationControls = () => {
    if (!response || response.totalPages <= 1) return null;

    const { page, totalPages } = response;
    const pages: (number | string)[] = [];
    
    // Logic for pagination display
    const delta = 2;
    const rangeStart = Math.max(2, page - delta);
    const rangeEnd = Math.min(totalPages - 1, page + delta);

    if (totalPages <= 7) {
      // Show all pages if total pages is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Add ellipsis if there's gap
      if (rangeStart > 2) {
        pages.push('...');
      }
      
      // Add pages around current page
      for (let i = rangeStart; i <= rangeEnd; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if there's gap
      if (rangeEnd < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-lg">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{((page - 1) * pageSize) + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * pageSize, response.total)}</span> of{' '}
              <span className="font-medium">{response.total}</span> results
            </p>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="ml-4 text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              {/* Previous button */}
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5 group-hover:text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Page numbers */}
              {pages.map((pageNum, index) => (
                pageNum === '...' ? (
                  <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum as number)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ring-1 ring-inset ring-gray-300 transition-colors duration-200 ${
                      pageNum === page
                        ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-gray-900 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              ))}

              {/* Next button */}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5 group-hover:text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-3 lg:px-4 py-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Master Data Management</h1>
          <p className="mt-2 text-gray-600">Manage and view all logistics master data entries</p>
        </div>

        {/* Search and Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="lg:col-span-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="Search challan, vehicle, broker..."
                  value={searchTerm}
                  onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                />
              </div>
            </div>

            {/* Origin City Filter */}
            <div className="relative">
              <label htmlFor="origin-city-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Origin City
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="origin-city-filter"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={originCityFilter || "Search origin cities..."}
                  value={originSearchTerm}
                  onChange={(e) => setOriginSearchTerm(e.target.value)}
                  onFocus={() => setShowOriginDropdown(true)}
                />
                {showOriginDropdown && (
                  <div ref={originDropdownRef} className="absolute z-30 mt-2 w-full bg-white shadow-2xl rounded-xl border-2 border-gray-100 overflow-hidden">
                    {/* Search Header */}
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          value={originSearchTerm}
                          onChange={(e) => setOriginSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-black"
                          placeholder="Search cities..."
                          autoFocus
                        />
                        {originSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setOriginSearchTerm('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Options List */}
                    <div className="max-h-64 overflow-y-auto">
                      {/* Clear option */}
                      <button
                        type="button"
                        onClick={() => handleOriginSelect('')}
                        className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 ${
                          !originCityFilter ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-900'
                        }`}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="font-medium">All Cities</span>
                        </div>
                      </button>
                      
                      {filteredOriginCities.length > 0 ? (
                        filteredOriginCities.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => handleOriginSelect(city)}
                            className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0 ${
                              originCityFilter === city ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-900'
                            }`}
                          >
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="font-medium">{city}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="font-medium text-gray-600">No cities found</p>
                          <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Destination City Filter */}
            <div className="relative">
              <label htmlFor="destination-city-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Destination City
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="destination-city-filter"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={destinationCityFilter || "Search destination cities..."}
                  value={destinationSearchTerm}
                  onChange={(e) => setDestinationSearchTerm(e.target.value)}
                  onFocus={() => setShowDestinationDropdown(true)}
                />
                {showDestinationDropdown && (
                  <div ref={destinationDropdownRef} className="absolute z-30 mt-2 w-full bg-white shadow-2xl rounded-xl border-2 border-gray-100 overflow-hidden">
                    {/* Search Header */}
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          value={destinationSearchTerm}
                          onChange={(e) => setDestinationSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-black"
                          placeholder="Search cities..."
                          autoFocus
                        />
                        {destinationSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setDestinationSearchTerm('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Options List */}
                    <div className="max-h-64 overflow-y-auto">
                      {/* Clear option */}
                      <button
                        type="button"
                        onClick={() => handleDestinationSelect('')}
                        className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 ${
                          !destinationCityFilter ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-900'
                        }`}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="font-medium">All Cities</span>
                        </div>
                      </button>
                      
                      {filteredDestinationCities.length > 0 ? (
                        filteredDestinationCities.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => handleDestinationSelect(city)}
                            className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0 ${
                              destinationCityFilter === city ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-900'
                            }`}
                          >
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="font-medium">{city}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="font-medium text-gray-600">No cities found</p>
                          <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Type Filter */}
            <div className="relative">
              <label htmlFor="vehicle-type-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Type
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2 2H8a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="vehicle-type-filter"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={vehicleTypeFilter || "Search vehicle types..."}
                  value={vehicleTypeSearchTerm}
                  onChange={(e) => setVehicleTypeSearchTerm(e.target.value)}
                  onFocus={() => setShowVehicleTypeDropdown(true)}
                />
                {showVehicleTypeDropdown && (
                  <div ref={vehicleTypeDropdownRef} className="absolute z-30 mt-2 w-full bg-white shadow-2xl rounded-xl border-2 border-gray-100 overflow-hidden">
                    {/* Search Header */}
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          value={vehicleTypeSearchTerm}
                          onChange={(e) => setVehicleTypeSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-black"
                          placeholder="Search vehicle types..."
                          autoFocus
                        />
                        {vehicleTypeSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setVehicleTypeSearchTerm('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Options List */}
                    <div className="max-h-64 overflow-y-auto">
                      {/* Clear option */}
                      <button
                        type="button"
                        onClick={() => handleVehicleTypeSelect('')}
                        className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 ${
                          !vehicleTypeFilter ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-900'
                        }`}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="font-medium">All Vehicle Types</span>
                        </div>
                      </button>
                      
                      {filteredVehicleTypes.length > 0 ? (
                        filteredVehicleTypes.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleVehicleTypeSelect(type)}
                            className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0 ${
                              vehicleTypeFilter === type ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-900'
                            }`}
                          >
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2 2H8a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                              </svg>
                              <span className="font-medium">{type}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="font-medium text-gray-600">No vehicle types found</p>
                          <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Loading State */}
        {(isLoading) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-center mt-4 text-gray-500">Loading data...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-12">
            <div className="text-center">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium text-red-800 mb-2">Error loading data</p>
              <p className="text-sm text-red-600">{error?.message || 'Something went wrong'}</p>
            </div>
          </div>
        )}

        {/* Table Section */}
        {response && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Loading overlay for refetch */}
            {isFetching && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            <div className="h-[600px] overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Broker Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Vehicle Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {response.data.length > 0 ? (
                    response.data.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{row.brokerName}</div>
                            <div className="text-xs text-gray-500">{row.brokerMobile}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{row.originCity} → {row.destinationCity}</div>
                            <div className="text-xs text-gray-500">{row.originBranch} → {row.destinationBranch}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {row.ftlType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatCurrency(row.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-lg font-medium mb-2">No data found</p>
                          <p className="text-sm">Try adjusting your search or filter criteria</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <PaginationControls />
          </div>
        )}
      </div>
    </div>
  );
}
