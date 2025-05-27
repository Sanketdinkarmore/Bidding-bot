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
}

type SortField = 'loadingDate' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function ViewShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<ShipmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      const data: ShipmentData[] = await response.json();
      setShipments(data);
      setFilteredShipments(data);
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
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Shipments Bids List
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link
            href="/create-shipment"
            className="ml-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Create New Shipment
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-900">Search</label>
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
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading shipments...</p>
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No shipments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedVehicleType !== 'all' || selectedDateRange !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by creating a new shipment'}
              </p>
              <div className="mt-6">
                <Link
                  href="/create-shipment"
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Create New Shipment
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden bg-white shadow sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200">
                {filteredShipments.map((shipment) => (
                  <li key={shipment._id}>
                    <Link href={`/bidding-details?id=${shipment._id}`} className="block">
                      <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <p className="truncate text-sm font-medium text-blue-600">
                              {shipment.selectFrom} → {shipment.selectTo}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-4">
                              <div className="flex items-center text-sm text-gray-500">
                                <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                {shipment.numberOfPackages} packages
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                                </svg>
                                {new Date(shipment.loadingDate).toLocaleDateString()} at {shipment.loadingTime}
                              </div>
                              {shipment.totalWeight && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v5.59l1.95-2.1a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 111.1-1.02l1.95 2.1V2.75A.75.75 0 0110 2z" clipRule="evenodd" />
                                  </svg>
                                  {shipment.totalWeight} kg
                                </div>
                              )}
                              {shipment.totalVolume && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v5.59l1.95-2.1a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 111.1-1.02l1.95 2.1V2.75A.75.75 0 0110 2z" clipRule="evenodd" />
                                  </svg>
                                  {shipment.totalVolume} CFT
                                </div>
                              )}
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-gray-500">
                                <span className="font-medium text-gray-900">Pickup:</span> {shipment.pickupLocation}
                              </p>
                              <p className="text-sm text-gray-500">
                                <span className="font-medium text-gray-900">Dropoff:</span> {shipment.dropLocation}
                              </p>
                            </div>
                          </div>
                          <div className="ml-2 flex flex-shrink-0">
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                              {shipment.vehicleType}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 