'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ShipmentData {
  _id: string;
  orderId: string;
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
  lowestBid?: {
    phone: string;
    amount: number;
    timestamp: string;
  };
  bidClosingDateTime: string

}

type SortField = 'loadingDate' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function ViewShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<ShipmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  
  // New state for tab navigation
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');
  const [activeFilter, setActiveFilter] = useState<'all' | 'closing-soon'>('all');

  // Add state for active and closed counts
  const [activeCount, setActiveCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);

  useEffect(() => {
    console.log('View Shipments page mounted');
    fetchShipments();
  }, []);

  useEffect(() => {
    filterAndSortShipments();
    
    // Calculate counts for active and closed shipments
    if (shipments.length > 0) {
      const active = shipments.filter(shipment => {
        const status = getShipmentStatus(shipment.bidClosingDateTime).status;
        return status === 'Active' || status === 'Closing Soon';
      }).length;
      
      const closed = shipments.filter(shipment => {
        const status = getShipmentStatus(shipment.bidClosingDateTime).status;
        return status === 'Closed' || status === 'No Bid Time';
      }).length;
      
      setActiveCount(active);
      setClosedCount(closed);
    }
  }, [shipments, searchTerm, sortField, sortOrder, selectedVehicleType, selectedDateRange, activeFilter]);

  // Make the filter re-apply when the active tab or filter changes
  useEffect(() => {
    filterAndSortShipments();
  }, [activeTab, activeFilter]);

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
        const lowestBid = item.bids && item.bids.length > 0
          ? item.bids.reduce((lowest: any, current: any) => 
              (!lowest || current.amount < lowest.amount) ? current : lowest
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
          bidClosingDateTime: item.shipmentDetails.bidClosingDateTime || '',
          lowestBid: lowestBid ? {
            phone: lowestBid.phone,
            amount: lowestBid.amount,
            timestamp: lowestBid.timestamp
          } : undefined,
          orderId: item.orderId
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
  const getShipmentStatus = (bidClosingDateTime: string) => {
    try {
      if (!bidClosingDateTime) {
        return {
          status: 'No Bid Time',
          className: 'bg-gray-100 text-gray-800'
        };
      }

      const biddingEndTime = new Date(bidClosingDateTime);
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

  // Function to calculate and format time remaining
  const getTimeRemaining = (bidClosingDateTime: string) => {
    try {
      if (!bidClosingDateTime) {
        return 'No bid time set';
      }

      const biddingEndTime = new Date(bidClosingDateTime);
      const currentTime = new Date();
      const timeDiff = biddingEndTime.getTime() - currentTime.getTime();

      if (timeDiff <= 0) {
        return 'Bidding closed';
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    } catch (error) {
      console.error('Error calculating time remaining:', error);
      return 'Invalid date';
    }
  };

  const filterAndSortShipments = () => {
    let filtered = [...shipments];
    
    // First filter by active/closed tabs
    filtered = filtered.filter(shipment => {
      const status = getShipmentStatus(shipment.bidClosingDateTime).status;
      if (activeTab === 'active') {
        return status === 'Active' || status === 'Closing Soon';
      } else {
        return status === 'Closed' || status === 'No Bid Time';
      }
    });
    
    // Then apply additional "Closing Soon" filter if selected
    if (activeTab === 'active' && activeFilter === 'closing-soon') {
      filtered = filtered.filter(shipment => 
        getShipmentStatus(shipment.bidClosingDateTime).status === 'Closing Soon'
      );
    }

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
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Shipments
              </h1>
              <p className="text-sm text-blue-100 mt-1 font-medium">
                {filteredShipments.length} total shipments found
              </p>
            </div>
            <Link
              href="/create-shipment"
              className="inline-flex items-center px-4 py-2.5 bg-white text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-colors shadow-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Shipment
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-4">
        {/* Sticky Container for Tab Navigation and Filters */}
        <div className="sticky top-0 z-10 mb-6 pt-2 backdrop-blur-sm">
          {/* Tab Navigation - Improved Design */}
          <div className="bg-white bg-opacity-95 rounded-xl border border-gray-200 shadow-lg transition-shadow duration-300 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => {
                  setActiveTab('active');
                  // Reset active filter when switching to active tab
                  if (activeFilter === 'closing-soon') {
                    setActiveFilter('all');
                  }
                }}
                className={`relative flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${
                  activeTab === 'active'
                    ? 'text-blue-700 bg-gradient-to-b from-blue-50 to-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className={`w-5 h-5 ${activeTab === 'active' ? 'text-blue-600' : 'text-gray-400'} transition-colors duration-200`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Active Biddings</span>
                  <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full transition-colors duration-200 ${
                    activeTab === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {activeCount}
                  </span>
                </div>
                {activeTab === 'active' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 animate-pulse"></div>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('closed');
                  // Reset active filter when switching to closed tab
                  if (activeFilter === 'closing-soon') {
                    setActiveFilter('all');
                  }
                }}
                className={`relative flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${
                  activeTab === 'closed'
                    ? 'text-blue-700 bg-gradient-to-b from-blue-50 to-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className={`w-5 h-5 ${activeTab === 'closed' ? 'text-blue-600' : 'text-gray-400'} transition-colors duration-200`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Closed Biddings</span>
                  <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full transition-colors duration-200 ${
                    activeTab === 'closed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {closedCount}
                  </span>
                </div>
                {activeTab === 'closed' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 animate-pulse"></div>
                )}
              </button>
            </div>
            
            {/* Unified Filters Section */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200">
              <div className="flex flex-wrap items-center gap-4">
                {/* Bid Status Filter - Only for Active Tab */}
                {activeTab === 'active' && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
                    <div className="flex p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                          activeFilter === 'all'
                            ? 'bg-blue-100 text-blue-700 shadow-inner'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        All Active
                      </button>
                      <button
                        onClick={() => setActiveFilter('closing-soon')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                          activeFilter === 'closing-soon'
                            ? 'bg-yellow-100 text-yellow-700 shadow-inner'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <span>Closing Soon</span>
                          {activeFilter !== 'closing-soon' && (
                            <span className="ml-1.5 flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Search Box */}
                <div className="flex-1 min-w-[260px]">
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
                      className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:border-gray-400"
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
                
                {/* Vehicle Type Filter */}
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">Vehicle:</span>
                  <select
                    value={selectedVehicleType}
                    onChange={(e) => setSelectedVehicleType(e.target.value)}
                    className="text-black px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer pr-8 hover:border-gray-400"
                    style={{ minWidth: '150px' }}
                  >
                    <option value="all">All Types</option>
                    {vehicleTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                {/* Date Range Filter */}
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">Date:</span>
                  <select
                    value={selectedDateRange}
                    onChange={(e) => setSelectedDateRange(e.target.value)}
                    className="text-black px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer pr-8 hover:border-gray-400"
                    style={{ minWidth: '150px' }}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Next 7 Days</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                  </select>
                </div>
                
                {/* Sort Controls */}
                <div className="flex items-center ml-auto">
                  <span className="text-sm font-medium text-gray-700 mr-2">Sort:</span>
                  <div className="flex rounded-lg border border-gray-300 bg-white shadow-sm hover:border-gray-400 transition-colors">
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as SortField)}
                      className="text-black px-3 py-2 rounded-l-lg border-0 text-sm bg-transparent focus:outline-none focus:ring-0 appearance-none cursor-pointer"
                    >
                      <option value="createdAt">Creation Date</option>
                      <option value="loadingDate">Loading Date</option>
                    </select>
                    <div className="border-l border-gray-300"></div>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 rounded-r-lg text-gray-500 hover:text-blue-700 hover:bg-blue-50 focus:outline-none transition-colors"
                      title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
                    >
                      {sortOrder === 'asc' ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Clear All Filters Button */}
                {(searchTerm || selectedVehicleType !== 'all' || selectedDateRange !== 'all' || (activeTab === 'active' && activeFilter !== 'all')) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedVehicleType('all');
                      setSelectedDateRange('all');
                      setActiveFilter('all');
                    }}
                    className="flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors shadow-sm"
                  >
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Filters
                  </button>
                )}
              </div>
              
              {/* Active Filter Tags */}
              {(searchTerm || selectedVehicleType !== 'all' || selectedDateRange !== 'all' || (activeTab === 'active' && activeFilter === 'closing-soon')) && (
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs font-medium text-gray-500">Active filters:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Search: &quot;{searchTerm}&quot;
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
                  {activeTab === 'active' && activeFilter === 'closing-soon' && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Status: Closing Soon
                      <button
                        onClick={() => setActiveFilter('all')}
                        className="ml-1.5 h-3 w-3 text-yellow-600 hover:text-yellow-800"
                      >
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  )}
                  <span className="ml-auto text-xs text-gray-500">
                    {filteredShipments.length} result{filteredShipments.length !== 1 ? 's' : ''} found
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Add a spacer to prevent content jumping when sticky header is active */}
        <div className="h-4"></div>
        
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
                    <div className="">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-semibold text-gray-900">{shipment.selectFrom}</span>
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className="text-lg font-semibold text-gray-900">{shipment.selectTo}</span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          getShipmentStatus(shipment.bidClosingDateTime).className
                        }`}>
                          {getShipmentStatus(shipment.bidClosingDateTime).status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 mt-1">ID: {shipment.orderId}</p>
                    </div>
                    
                    <div className="text-right flex gap-x-4 items-center">
                      {shipment.lowestBid && (
                        <div className="mb-2">
                          <div className="text-lg font-bold text-green-600">₹{shipment.lowestBid.amount.toLocaleString()}</div>
                          <p className="text-xs text-gray-500">Lowest Bid</p>
                        </div>
                      )}
                      
                      {/* Bid Closing Time */}
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border">
                        <p className="text-xs font-medium text-gray-700">Bid Closing</p>
                        {shipment.bidClosingDateTime ? (
                          <>
                            <p className="text-sm font-semibold text-gray-900">
                              {getTimeRemaining(shipment.bidClosingDateTime)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(shipment.bidClosingDateTime).toLocaleDateString('en-IN')} at{' '}
                              {new Date(shipment.bidClosingDateTime).toLocaleTimeString('en-IN', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">Not set</p>
                        )}
                      </div>
                    </div>
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
                  {shipment.lowestBid && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Bidder Contact</p>
                          <p className="text-sm text-gray-900">{shipment.lowestBid.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-700">Bid Time</p>
                          <p className="text-sm text-gray-900">{new Date(shipment.lowestBid.timestamp).toLocaleString()}</p>
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