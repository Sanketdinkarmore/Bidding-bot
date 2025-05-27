'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  phoneNumber: string; // Changed from email
  createdAt: string;
}

interface ShipmentData {
  _id: string;
  numberOfPackages: number;
  loadingDate: string;
  selectFrom: string;
  selectTo: string;
  vehicleType: string;
  createdAt: string;
}

export default function Home() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [name, setName] = useState('');
  // Keeping email state for the 'Add User' form in the dashboard for now,
  // as the user only requested email to be replaced by phone in login/register forms.
  // This might need adjustment depending on the backend for this specific form.
  const [email, setEmail] = useState(''); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Add authentication state

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
      setShipments(data);
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
        body: JSON.stringify({ name, email }), 
      });
      
      if (!response.ok) {
        // Attempt to read error message from response
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      
      setName('');
      setEmail('');
      await fetchUsers(); // Refresh user list after adding
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

  // Render dashboard content if authenticated
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Dashboard
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

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Shipments */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Total Shipments</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{totalShipments}</dd>
        </div>

        {/* Active Shipments */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Active Shipments</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{activeShipments}</dd>
        </div>

        {/* Total Users */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Total Users</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{totalUsers}</dd>
        </div>
      </div>

      {/* Recent Shipments */}
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Shipments</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest shipment requests and their status.</p>
        </div>
        <div className="border-t border-gray-200">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading shipments...</p>
            </div>
          ) : recentShipments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No shipments found.</p>
              <Link href="/create-shipment" className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500">
                Create your first shipment →
              </Link>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {recentShipments.map((shipment) => (
                <li key={shipment._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="truncate text-sm font-medium text-blue-600">
                        {shipment.selectFrom} → {shipment.selectTo}
                      </p>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          {shipment.numberOfPackages} packages
                        </div>
                        <div className="ml-6 flex items-center text-sm text-gray-500">
                          <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                          </svg>
                          {new Date(shipment.loadingDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="ml-2 flex flex-shrink-0">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {shipment.vehicleType || 'N/A'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {recentShipments.length > 0 && (
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <Link href="/view-shipments" className="font-medium text-blue-600 hover:text-blue-500">
                View all shipments<span aria-hidden="true"> →</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* User Management - Note: This still uses 'email' in the form */}
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">User Management</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Add and manage system users.</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
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
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Adding User...' : 'Add User'}
              </button>
            </div>
          </form>

          {users.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900">Recent Users</h4>
              <ul role="list" className="mt-3 divide-y divide-gray-200">
                {users.slice(0, 5).map((user) => (
                  <li key={user._id} className="py-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.name && typeof user.name === 'string' && user.name.length > 0 ? user.name.charAt(0).toUpperCase() : ''}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
                        {/* Display phone number instead of email if email field is removed later */}
                        <p className="truncate text-sm text-gray-500">{user.phoneNumber}</p> 
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
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
