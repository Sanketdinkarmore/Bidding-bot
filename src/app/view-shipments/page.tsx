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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white shadow-sm px-4 py-4 sm:px-6 lg:px-8 rounded-lg">
        <div className="mx-auto max-w-7xl">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Shipments Bids List</h2>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <Link
                href="/create-shipment"
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors duration-200"
              >
                Create New Shipment
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Filter Shipments</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
                    placeholder="Search shipments..."
                  />
                </div>
              </div>

              {/* Vehicle Type Filter */}
              <div>
                <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                <select
                  id="vehicleType"
                  value={selectedVehicleType}
                  onChange={(e) => setSelectedVehicleType(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
                >
                  <option value="all">All Vehicles</option>
                  {vehicleTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">Date Range</label>
                <select
                  id="dateRange"
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">Next 7 Days</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700">Sort By</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <select
                    id="sort"
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="block w-full rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
                  >
                    <option value="loadingDate">Loading Date</option>
                    <option value="createdAt">Created Date</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 hover:bg-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipments List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-sm text-gray-500">Loading shipments...</p>
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No shipments found matching your criteria.</p>
            {searchTerm || selectedVehicleType !== 'all' || selectedDateRange !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedVehicleType('all');
                  setSelectedDateRange('all');
                  setSortField('loadingDate');
                  setSortOrder('desc');
                }}
                className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Clear Filters
              </button>
            ) : (
              <Link href="/create-shipment" className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
                Create your first shipment
                <svg className="ml-1 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <ul role="list" className="divide-y divide-gray-200">
              {filteredShipments.map((shipment) => (
                <li key={shipment._id} className="px-4 py-5 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {shipment.selectFrom} → {shipment.selectTo}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>{shipment.numberOfPackages} packages</span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                        </svg>
                        <span>{new Date(shipment.loadingDate).toLocaleDateString()} at {shipment.loadingTime}</span>
                      </div>
                      {shipment.vehicleType && (
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3.75 3A1.75 1.75 0 002 4.75v9.5A1.75 1.75 0 003.75 16h.511a.75.75 0 01.041-.243l1.652-4.055a.75.75 0 01.831-.456h3.438a.75.75 0 01.831.456l1.652 4.055a.75.75 0 01.041.243h.511A1.75 1.75 0 0018 14.25v-9.5A1.75 1.75 0 0016.25 3H3.75zM16.25 4.5a.25.25 0 01.25.25v9.5a.25.25 0 01-.25.25h-.327l-1.507-3.701a1.75 1.75 0 00-1.954-1.077h-3.438a1.75 1.75 0 00-1.954 1.077L4.077 14.5H3.75a.25.25 0 01-.25-.25v-9.5a.25.25 0 01.25-.25h12.5z" />
                          </svg>
                          <span>{shipment.vehicleType}</span>
                        </div>
                      )}
                       {shipment.totalWeight && (
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v5.59l1.95-2.1a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 111.1-1.02l1.95 2.1V2.75A.75.75 0 0110 2z" clipRule="evenodd" />
                          </svg>
                          <span>{shipment.totalWeight} kg</span>
                        </div>
                      )}
                       {shipment.totalVolume && (
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 7a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V7zm7 0a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V7zm4.75-.75a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V7a.75.75 0 00-.75-.75h-.01zM5.75 10a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V10zm2.75-.75a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V10a.75.75 0 00-.75-.75h-.01zm5.75-.75a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V10a.75.75 0 00-.75-.75h-.01zM6.75 13a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75v-.01a.75.75 0 00-.75-.75h-.01zm3.75-.75a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75v-.01a.75.75 0 00-.75-.75h-.01zm3.75-.75a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75v-.01a.75.75 0 00-.75-.75h-.01z" clipRule="evenodd" />
                          </svg>
                          <span>{shipment.totalVolume} cbm</span>
                        </div>
                      )}
                      {shipment.highestBid && (
                        <div className="flex flex-wrap items-center gap-4 bg-green-50 border border-green-200 rounded-md px-4 py-2 mt-2">
                          <div className="flex items-center gap-1 text-green-800 font-semibold">
                            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11V5a1 1 0 10-2 0v2a1 1 0 001 1h2a1 1 0 100-2h-1zm-1 4a1 1 0 100 2 1 1 0 000-2zm0 4a1 1 0 100 2 1 1 0 000-2z" /></svg>
                            ₹{shipment.highestBid.amount}
                          </div>
                          <div className="flex items-center gap-1 text-green-700 text-sm">
                            <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                            {shipment.highestBid.phone}
                          </div>
                          <div className="flex items-center gap-1 text-green-600 text-xs">
                            <svg className="h-4 w-4 text-green-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1H6zm0 2V3h8v1H6zm-2 2h12v10H4V6zm6 2a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" /></svg>
                            {new Date(shipment.highestBid.timestamp).toLocaleString()}
                          </div>
                        </div>
                      )}
                      {shipment.remark && (
                        <div className="mt-1 text-sm text-gray-500">
                          <span className="font-medium text-gray-700">Remark:</span> {shipment.remark}
                        </div>
                      )}
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${new Date(shipment.loadingDate) >= new Date() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {new Date(shipment.loadingDate) >= new Date() ? 'Active' : 'Completed'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 self-center">
                      <Link
                        href={`/bidding-details?id=${shipment._id}`}
                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        View Details
                        <svg className="ml-2 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}