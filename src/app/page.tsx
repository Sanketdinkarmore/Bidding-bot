'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrashIcon } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  phoneNumber: string; // Changed from email
  createdAt: string;
}

interface ShipmentData {
  _id: string;
  selectFrom: string;
  selectTo: string;
  numberOfPackages: number;
  loadingDate: string;
  loadingTime: string;
  totalWeight?: number;
  vehicleType?: string;
}

export default function Home() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
   
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Add authentication state
  const [user, setUser] = useState<any>()

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setIsAuthenticated(true);
      // Fetch data only if authenticated
      Promise.all([fetchUsers(), fetchShipments()]);
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (user) {
      setUser(JSON.parse(user))
    }
  }, [])

  const fetchUsers = async () => {
    try {
      // Note: This still fetches from /api/users, which might need updating
      // based on your user management API endpoints.
      const response = await fetch('/api/users'); 

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();

      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchShipments = async () => {
    try {
      const response = await fetch('/api/shipments');
      if (!response.ok) {
        throw new Error('Failed to fetch shipments');
      }
      const data = await response.json();
      // Map shipmentDetails fields to top-level for UI compatibility
      const mapped = data.map((item: { 
        _id: string;
        shipmentDetails?: {
          numberOfPackages?: string | number;
          loadingDate?: string | number;
          fromCity?: string;
          toCity?: string;
          vehicleType?: string;
        };
        createdAt?: string;
      }) => ({
        _id: item._id,
        numberOfPackages: item.shipmentDetails?.numberOfPackages || '',
        loadingDate: item.shipmentDetails?.loadingDate || '',
        selectFrom: item.shipmentDetails?.fromCity || '',
        selectTo: item.shipmentDetails?.toCity || '',
        vehicleType: item.shipmentDetails?.vehicleType || '',
        createdAt: item.createdAt || '',
      }));
      setShipments(mapped);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // handleSubmit for the 'Add User' form in the dashboard
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      // Note: This endpoint and payload might need adjustment
      // based on your user creation API endpoint.
      const response = await fetch('/api/users', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Still using email here based on the original code. 
        // If your /api/users endpoint uses phone number, update this.
        body: JSON.stringify({ name, password, phoneNumber: phone, role: "user" }), 
      });
      
      if (!response.ok) {
        // Attempt to read error message from response
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      
      setName('');
      setConfirmPassword('')
      setPassword('')
      setPhone('')

      await fetchUsers(); 
    } catch (error: any) {
      setError('Error creating user: ' + error.message);
      console.error('Error creating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate statistics
  const totalShipments = shipments.length;
  const activeShipments = shipments.filter(s => new Date(s.loadingDate) >= new Date()).length;
  const totalUsers = users.length;
  const recentShipments = shipments.slice(0, 5);

  if (!isAuthenticated) {
    return null; // Redirecting to login is handled by useEffect
  }

  const handleDelete = async (userId: string) => {
    try {
      const response = await fetch('/api/users', { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }), 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      await fetchUsers(); 
    } catch (error: any) {
      console.error('Error creating user:', error);
    }
  }

  // Render dashboard content if authenticated
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Dashboard
              </h2>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <Link
                href="/create-shipment"
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors duration-200"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Shipment
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Shipments */}
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-blue-100 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <dt className="truncate text-sm font-medium text-gray-500">Total Shipments</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{totalShipments}</dd>
              </div>
            </div>
          </div>

          {/* Active Shipments */}
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-green-100 p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <dt className="truncate text-sm font-medium text-gray-500">Active Shipments</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{activeShipments}</dd>
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-purple-100 p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <dt className="truncate text-sm font-medium text-gray-500">Total Users</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{totalUsers}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Shipments */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-5">
            <h3 className="text-xl font-semibold text-gray-900">Recent Shipments</h3>
            <p className="mt-1 text-sm text-gray-500">Latest shipment requests and their status</p>
          </div>
          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="ml-3 text-sm text-gray-500">Loading shipments...</p>
              </div>
            ) : recentShipments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No shipments found</p>
                <Link href="/create-shipment" className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
                  Create your first shipment
                  <svg className="ml-1 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            ) : (
              <ul role="list" className="divide-y divide-gray-200">
                {recentShipments.map((shipment) => (
                  <li key={shipment._id} className="px-6 py-5 hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-3">
                          <p className="text-lg font-medium text-gray-900">
                            {shipment.selectFrom} → {shipment.selectTo}
                          </p>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                            new Date(shipment.loadingDate) >= new Date() 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {new Date(shipment.loadingDate) >= new Date() ? 'Active' : 'Completed'}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-6">
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="mr-2 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            {shipment.numberOfPackages} packages
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="mr-2 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                            </svg>
                            {new Date(shipment.loadingDate).toLocaleDateString()} at {shipment.loadingTime}
                          </div>
                          {shipment.totalWeight && (
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="mr-2 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v5.59l1.95-2.1a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 111.1-1.02l1.95 2.1V2.75A.75.75 0 0110 2z" clipRule="evenodd" />
                              </svg>
                              {shipment.totalWeight} kg
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <Link
                          href={`/bidding-details?id=${shipment._id}`}
                          className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors duration-200"
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
            )}
          </div>
        </div>

        {/* User Management with enhanced design */}
        {user && user.role === "admin" && <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-5">
            <h3 className="text-xl font-semibold text-gray-900">User Management</h3>
            <p className="mt-1 text-sm text-gray-500">Add and manage system users</p>
          </div>
          <div className="px-6 py-5">
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 p-4">
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
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-3">
                <div className="flex flex-col">
                  <label htmlFor="name" className="mb-1 text-sm font-semibold text-gray-700">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition sm:text-sm"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="phone" className="mb-1 text-sm font-semibold text-gray-700">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition sm:text-sm"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="password" className="mb-1 text-sm font-semibold text-gray-700">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    className="rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition sm:text-sm"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="confirmPassword" className="mb-1 text-sm font-semibold text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition sm:text-sm"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Adding User...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add User
                    </>
                  )}
                </button>
              </div>
            </form>

            {users.length > 0 && (
              <div className="mt-8">
                <h4 className="text-lg font-medium text-gray-900">Users</h4>
                <ul
                  role="list"
                  className="h-[400px] overflow-y-scroll mt-4 divide-y divide-gray-200"
                >
                  {users.map((user) => (
                    <li
                      key={user._id}
                      className="group hover:bg-gray-50 px-2 rounded-lg transition"
                    >
                      <div className="flex justify-between space-x-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {user.name && typeof user.name === 'string' && user.name.length > 0
                                  ? user.name.charAt(0).toUpperCase()
                                  : ''}
                              </span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1 py-4 ">
                            <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="truncate text-sm text-gray-500">{user.phoneNumber}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDelete(user._id)}
                          className="invisible group-hover:visible text-gray-400 hover:text-red-600 transition"
                          title="Delete user"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>}
      </div>
    </div>
  );
}
