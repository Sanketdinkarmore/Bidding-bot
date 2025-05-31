'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ShipmentData {
  _id: string;
  numberOfPackages: number;
  loadingDate: string;
  loadingTime: string;
  pickupLocation: string;
  selectFrom: string;
  selectTo: string;
  vehicleType: string;
  totalWeight?: number;
  totalVolume?: number;
  dropLocation: string;
  remark?: string;
  createdAt: string;
  highestBid?: {
    phone: string;
    amount: number;
    timestamp: string;
  };
}

type SortField = 'loadingDate' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function ViewShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<ShipmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('loadingDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');

  useEffect(() => {
    console.log('View Shipments page mounted');
    fetchShipments();
  }, []);

  useEffect(() => {
    filterAndSortShipments();
  }, [shipments, searchTerm, sortField, sortOrder, selectedVehicleType, selectedDateRange]);

  const fetchShipments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/shipments');
      if (!response.ok) {
        throw new Error('Failed to fetch shipments');
      }
      const data = await response.json();
      // Map shipmentDetails fields to top-level for UI compatibility
      const mapped = data.map((item: any) => {
        // Find highest bid if bids exist
        const highestBid = item.bids && item.bids.length > 0
          ? item.bids.reduce((highest: any, current: any) => 
              (!highest || current.amount > highest.amount) ? current : highest
            , null)
          : undefined;

        return {
          _id: item._id,
          numberOfPackages: item.shipmentDetails?.numberOfPackages || '',
          loadingDate: item.shipmentDetails?.loadingDate || '',
          loadingTime: item.shipmentDetails?.loadingTime || '',
          pickupLocation: item.shipmentDetails?.pickupLocation || '',
          selectFrom: item.shipmentDetails?.fromCity || '',
          selectTo: item.shipmentDetails?.toCity || '',
          vehicleType: item.shipmentDetails?.vehicleType || '',
          totalWeight: item.shipmentDetails?.totalWeight || '',
          totalVolume: item.shipmentDetails?.totalVolume || '',
          dropLocation: item.shipmentDetails?.dropLocation || '',
          remark: item.shipmentDetails?.remark || '',
          createdAt: item.createdAt || '',
          highestBid: highestBid ? {
            phone: highestBid.phone,
            amount: highestBid.amount,
            timestamp: highestBid.timestamp
          } : undefined
        };
      });
      setShipments(mapped);
      setFilteredShipments(mapped);
    } catch (error) {
      setError('Error loading shipments. Please try again later.');
      console.error('Error fetching shipments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get shipment status based on bidding time
  const getShipmentStatus = (loadingDate: string, loadingTime: string) => {
    try {
      // Combine loading date and time to get bidding end time
      const biddingEndTime = new Date(`${loadingDate}T${loadingTime}`);
      const currentTime = new Date();
      
      // Calculate time difference in milliseconds
      const timeDiff = biddingEndTime.getTime() - currentTime.getTime();
      
      // If current time is past bidding time, status is closed
      if (timeDiff <= 0) {
        return {
          status: 'Closed',
          className: 'bg-red-100 text-red-800'
        };
      }
      
      // If less than 30 minutes (30 * 60 * 1000 ms) remaining, status is closing soon
      if (timeDiff <= 30 * 60 * 1000) {
        return {
          status: 'Closing Soon',
          className: 'bg-yellow-100 text-yellow-800'
        };
      }
      
      // Otherwise, status is active
      return {
        status: 'Active',
        className: 'bg-green-100 text-green-800'
      };
    } catch (error) {
      console.error('Error calculating shipment status:', error);
      return {
        status: 'Active',
        className: 'bg-gray-100 text-gray-800'
      };
    }
  };

  const filterAndSortShipments = () => {
    let filtered = [...shipments];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(shipment =>
        shipment.selectFrom.toLowerCase().includes(searchLower) ||
        shipment.selectTo.toLowerCase().includes(searchLower) ||
        shipment.pickupLocation.toLowerCase().includes(searchLower) ||
        shipment.dropLocation.toLowerCase().includes(searchLower) ||
        shipment.vehicleType.toLowerCase().includes(searchLower)
      );
    }

    // Apply vehicle type filter
    if (selectedVehicleType !== 'all') {
      filtered = filtered.filter(shipment => shipment.vehicleType === selectedVehicleType);
    }

    // Apply date range filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    switch (selectedDateRange) {
      case 'today':
        filtered = filtered.filter(shipment => {
          const shipmentDate = new Date(shipment.loadingDate);
          return shipmentDate >= today && shipmentDate < tomorrow;
        });
        break;
      case 'week':
        filtered = filtered.filter(shipment => {
          const shipmentDate = new Date(shipment.loadingDate);
          return shipmentDate >= today && shipmentDate < nextWeek;
        });
        break;
      case 'past':
        filtered = filtered.filter(shipment => {
          const shipmentDate = new Date(shipment.loadingDate);
          return shipmentDate < today;
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(shipment => {
          const shipmentDate = new Date(shipment.loadingDate);
          return shipmentDate >= today;
        });
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const modifier = sortOrder === 'asc' ? 1 : -1;
      return aValue < bValue ? -1 * modifier : aValue > bValue ? 1 * modifier : 0;
    });

    setFilteredShipments(filtered);
  };

  const vehicleTypes = Array.from(new Set(shipments.map(s => s.vehicleType)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredShipments.length} total shipments
              </p>
            </div>
            <Link
              href="/create-shipment"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Shipment
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Filters */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                  <p className="text-sm text-gray-600">Refine your search results</p>
                </div>
              </div>
              {(searchTerm || selectedVehicleType !== 'all' || selectedDateRange !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedVehicleType('all');
                    setSelectedDateRange('all');
                    setSortField('loadingDate');
                    setSortOrder('desc');
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                >
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear All
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Enhanced Search */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Shipments
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-black w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Search locations, vehicle type..."
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Enhanced Vehicle Type Filter */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2H10a2 2 0 01-2-2v-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-2.172a2 2 0 01-1.414-.586l-.828-.828A2 2 0 0012 5H8" />
                  </svg>
                  Vehicle Type
                </label>
                <div className="relative">
                  <select
                    value={selectedVehicleType}
                    onChange={(e) => setSelectedVehicleType(e.target.value)}
                    className="text-black w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="all">All Vehicle Types</option>
                    {vehicleTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Enhanced Date Range Filter */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0v-4h8v4z" />
                  </svg>
                  Date Range
                </label>
                <div className="relative">
                  <select
                    value={selectedDateRange}
                    onChange={(e) => setSelectedDateRange(e.target.value)}
                    className="text-black w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="all">All Time Periods</option>
                    <option value="today">Today Only</option>
                    <option value="week">Next 7 Days</option>
                    <option value="upcoming">All Upcoming</option>
                    <option value="past">Past Shipments</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Enhanced Sort */}
              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                  </svg>
                  Sort & Order
                </label>
                <div className="flex rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="text-black flex-1 px-4 py-2.5 rounded-l-lg border-0 text-sm bg-transparent focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="loadingDate">Loading Date</option>
                    <option value="createdAt">Created Date</option>
                  </select>
                  <div className="border-l border-gray-300"></div>
                  <button
                    type="button"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2.5 rounded-r-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-0 transition-colors duration-200 group"
                    title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
                  >
                    {sortOrder === 'asc' ? (
                      <svg className="h-4 w-4 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(searchTerm || selectedVehicleType !== 'all' || selectedDateRange !== 'all') && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                    <div className="flex flex-wrap gap-2">
                      {searchTerm && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Search: &ldquo;{searchTerm}&rdquo;
                          <button
                            onClick={() => setSearchTerm('')}
                            className="ml-1.5 h-3 w-3 text-blue-600 hover:text-blue-800"
                          >
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </span>
                      )}
                      {selectedVehicleType !== 'all' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Vehicle: {selectedVehicleType}
                          <button
                            onClick={() => setSelectedVehicleType('all')}
                            className="ml-1.5 h-3 w-3 text-green-600 hover:text-green-800"
                          >
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </span>
                      )}
                      {selectedDateRange !== 'all' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Date: {selectedDateRange === 'today' ? 'Today' : selectedDateRange === 'week' ? 'Next 7 Days' : selectedDateRange === 'upcoming' ? 'Upcoming' : 'Past'}
                          <button
                            onClick={() => setSelectedDateRange('all')}
                            className="ml-1.5 h-3 w-3 text-purple-600 hover:text-purple-800"
                          >
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {filteredShipments.length} result{filteredShipments.length !== 1 ? 's' : ''} found
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading shipments...</span>
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No shipments found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedVehicleType !== 'all' || selectedDateRange !== 'all' 
                ? "No shipments match your current filters."
                : "You haven't created any shipments yet."
              }
            </p>
            
            {searchTerm || selectedVehicleType !== 'all' || selectedDateRange !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedVehicleType('all');
                  setSelectedDateRange('all');
                }}
                className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
            ) : (
              <Link 
                href="/create-shipment" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create First Shipment
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredShipments.map((shipment) => (
              <div key={shipment._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                {/* Header Row */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-semibold text-gray-900">{shipment.selectFrom}</span>
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className="text-lg font-semibold text-gray-900">{shipment.selectTo}</span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          getShipmentStatus(shipment.loadingDate, shipment.loadingTime).className
                        }`}>
                          {getShipmentStatus(shipment.loadingDate, shipment.loadingTime).status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">ID: {shipment._id.slice(-8)}</p>
                    </div>
                    
                    {shipment.highestBid && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">₹{shipment.highestBid.amount.toLocaleString()}</div>
                        <p className="text-xs text-gray-500">Highest Bid</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="px-6 py-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 font-medium">Loading Date</p>
                      <p className="text-gray-900 mt-1">{new Date(shipment.loadingDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Time</p>
                      <p className="text-gray-900 mt-1">{shipment.loadingTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Vehicle</p>
                      <p className="text-gray-900 mt-1">{shipment.vehicleType}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Packages</p>
                      <p className="text-gray-900 mt-1">{shipment.numberOfPackages}</p>
                    </div>
                    {shipment.totalWeight && (
                      <div>
                        <p className="text-gray-500 font-medium">Weight</p>
                        <p className="text-gray-900 mt-1">{shipment.totalWeight} kg</p>
                      </div>
                    )}
                    {shipment.totalVolume && (
                      <div>
                        <p className="text-gray-500 font-medium">Volume</p>
                        <p className="text-gray-900 mt-1">{shipment.totalVolume} cbm</p>
                      </div>
                    )}
                  </div>

                  {/* Bid Details */}
                  {shipment.highestBid && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Bidder Contact</p>
                          <p className="text-sm text-gray-900">{shipment.highestBid.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-700">Bid Time</p>
                          <p className="text-sm text-gray-900">{new Date(shipment.highestBid.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Remark */}
                  {shipment.remark && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700 mb-1">Special Instructions</p>
                      <p className="text-sm text-gray-600">{shipment.remark}</p>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <Link
                      href={`/bidding-details?id=${shipment._id}`}
                      className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-md border border-blue-200 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      View Details
                      <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 