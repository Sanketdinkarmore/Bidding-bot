'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ShipmentFormData {
  numberOfPackages: number | '';
  loadingDate: string;
  loadingTime: string;
  pickupLocation: string;
  selectFrom: string;
  selectTo: string;
  vehicleType: string;
  totalWeight: number | '';
  totalVolume: number | '';
  dropLocation: string;
  remark: string;
}

export default function CreateShipmentPage() {
  const [formData, setFormData] = useState<ShipmentFormData>({
    numberOfPackages: '',
    loadingDate: '',
    loadingTime: '',
    pickupLocation: '',
    selectFrom: '',
    selectTo: '',
    vehicleType: '',
    totalWeight: '',
    totalVolume: '',
    dropLocation: '',
    remark: '',
  });
  const [locations, setLocations] = useState<string[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showOtherFrom, setShowOtherFrom] = useState(false);
  const [showOtherTo, setShowOtherTo] = useState(false);
  const [showOtherVehicle, setShowOtherVehicle] = useState(false);
  
  // New state for conditional city search
  const [showFromCitySearch, setShowFromCitySearch] = useState(false);
  const [showToCitySearch, setShowToCitySearch] = useState(false);
  const [fromCitySearchTerm, setFromCitySearchTerm] = useState('');
  const [toCitySearchTerm, setToCitySearchTerm] = useState('');
  const [filteredFromCities, setFilteredFromCities] = useState<string[]>([]);
  const [filteredToCities, setFilteredToCities] = useState<string[]>([]);
  
  // Keep track of the selected location if 'Other' was used
  const [selectedFromCity, setSelectedFromCity] = useState('');
  const [selectedToCity, setSelectedToCity] = useState('');

  useEffect(() => {
    const fetchLocationsAndVehicleTypes = async () => {
      try {
        const response = await fetch('/api/locations');
        if (!response.ok) {
          throw new Error('Failed to fetch locations and vehicle types');
        }
        const data = await response.json();
        setLocations(data.locations);
        setVehicleTypes(data.vehicleTypes);
        // Initialize filtered lists with full data
        setFilteredFromCities(data.locations);
        setFilteredToCities(data.locations);

      } catch (error) {
        console.error('Error fetching locations and vehicle types:', error);
        setError('Failed to load locations and vehicle types. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocationsAndVehicleTypes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle special cases for "Other" options in city dropdowns
    if (name === 'selectFrom') {
      if (value === 'Other') {
        setShowFromCitySearch(true);
        setFormData(prev => ({ ...prev, selectFrom: '' })); // Clear form data for search input
        setSelectedFromCity(''); // Clear selected custom city
      } else {
        setShowFromCitySearch(false);
        setFormData(prev => ({ ...prev, selectFrom: value }));
        setSelectedFromCity(value); // Set selected city from dropdown
      }
    } else if (name === 'selectTo') {
      if (value === 'Other') {
        setShowToCitySearch(true);
        setFormData(prev => ({ ...prev, selectTo: '' })); // Clear form data for search input
        setSelectedToCity(''); // Clear selected custom city
      } else {
        setShowToCitySearch(false);
        setFormData(prev => ({ ...prev, selectTo: value }));
        setSelectedToCity(value); // Set selected city from dropdown
      }
    } else if (name === 'vehicleType' && value === 'Other') {
      // Existing logic for vehicle type 'Other'
      setShowOtherVehicle(true);
      setFormData(prev => ({ ...prev, vehicleType: '' }));
    } else {
      // Reset "Other" fields if a predefined option is selected (excluding cities now)
      if (name === 'vehicleType' && value !== 'Other') setShowOtherVehicle(false);
      
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle search input changes for From City
  const handleFromCitySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setFromCitySearchTerm(searchTerm);
    if (searchTerm.length > 0) {
      setFilteredFromCities(locations.filter(location =>
        location.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    } else {
      setFilteredFromCities(locations);
    }
  };

  // Handle search input changes for To City
  const handleToCitySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setToCitySearchTerm(searchTerm);
    if (searchTerm.length > 0) {
      setFilteredToCities(locations.filter(location =>
        location.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    } else {
      setFilteredToCities(locations);
    }
  };

  // Handle selection from filtered results for From City
  const handleFromCitySelect = (location: string) => {
    setFormData(prev => ({ ...prev, selectFrom: location }));
    setSelectedFromCity(location);
    setShowFromCitySearch(false); // Hide search input
    setFromCitySearchTerm(''); // Clear search term
    setFilteredFromCities(locations); // Reset filtered list
  };

  // Handle selection from filtered results for To City
  const handleToCitySelect = (location: string) => {
    setFormData(prev => ({ ...prev, selectTo: location }));
    setSelectedToCity(location);
    setShowToCitySearch(false); // Hide search input
    setToCitySearchTerm(''); // Clear search term
    setFilteredToCities(locations); // Reset filtered list
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create shipment');
      }

      setSuccess('Shipment created successfully!');
      setFormData({
        numberOfPackages: '',
        loadingDate: '',
        loadingTime: '',
        pickupLocation: '',
        selectFrom: '', // Clear form data
        selectTo: '', // Clear form data
        vehicleType: '',
        totalWeight: '',
        totalVolume: '',
        dropLocation: '',
        remark: '',
      });
      // Reset "Other" fields and search states
      setShowOtherFrom(false); // Keep this for custom input below dropdowns if needed
      setShowOtherTo(false); // Keep this for custom input below dropdowns if needed
      setShowOtherVehicle(false);
      setShowFromCitySearch(false);
      setShowToCitySearch(false);
      setFromCitySearchTerm('');
      setToCitySearchTerm('');
      setFilteredFromCities(locations); // Reset filtered lists
      setFilteredToCities(locations);
      setSelectedFromCity(''); // Clear selected custom city
      setSelectedToCity(''); // Clear selected custom city

    } catch (error) {
      setError('Error creating shipment. Please try again.');
      console.error('Error creating shipment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define number of initial locations to show
  const initialLocationsCount = 7;
  const initialLocations = locations.slice(0, initialLocationsCount);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Form Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Create New Shipment</h1>
            <p className="mt-1 text-sm text-gray-500">
              Fill in the details below to create a new shipment request.
            </p>
          </div>

          {/* Form Content */}
          <div className="px-6 py-4">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
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

            {success && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Package Details Section */}
                <div className="md:col-span-2">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Package Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="numberOfPackages" className="block text-sm font-medium text-gray-700">
                        Number of Packages
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          id="numberOfPackages"
                          name="numberOfPackages"
                          value={formData.numberOfPackages}
                          onChange={handleChange}
                          className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                          required
                          disabled={isSubmitting || isLoading}
                          min="1"
                          placeholder="Enter number"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="totalWeight" className="block text-sm font-medium text-gray-700">
                        Total Weight
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          id="totalWeight"
                          name="totalWeight"
                          value={formData.totalWeight}
                          onChange={handleChange}
                          className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                          disabled={isSubmitting || isLoading}
                          min="0"
                          step="0.01"
                          placeholder="Enter weight"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">kg</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="totalVolume" className="block text-sm font-medium text-gray-700">
                        Total Volume
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          id="totalVolume"
                          name="totalVolume"
                          value={formData.totalVolume}
                          onChange={handleChange}
                          className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                          disabled={isSubmitting || isLoading}
                          min="0"
                          step="0.01"
                          placeholder="Enter volume"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">CFT</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loading Details Section */}
                <div className="md:col-span-2">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Loading Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="loadingDate" className="block text-sm font-medium text-gray-700">
                        Loading Date
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          id="loadingDate"
                          name="loadingDate"
                          value={formData.loadingDate}
                          onChange={handleChange}
                          className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                          required
                          disabled={isSubmitting || isLoading}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="loadingTime" className="block text-sm font-medium text-gray-700">
                        Loading Time
                      </label>
                      <div className="mt-1">
                        <input
                          type="time"
                          id="loadingTime"
                          name="loadingTime"
                          value={formData.loadingTime}
                          onChange={handleChange}
                          className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                          required
                          disabled={isSubmitting || isLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Details Section */}
                <div className="md:col-span-2">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Location Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* From City */}
                    <div>
                      <label htmlFor="selectFrom" className="block text-sm font-medium text-gray-700">
                        From City
                      </label>
                      <div className="mt-1 relative">
                        {!showFromCitySearch ? (
                          // Initial dropdown
                          <select
                            id="selectFrom"
                            name="selectFrom"
                            value={selectedFromCity || formData.selectFrom} // Use selectedFromCity for display
                            onChange={handleChange}
                            className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 relative z-20"
                            required
                            disabled={isSubmitting || isLoading}
                          >
                            <option value="">Select a city</option>
                            {initialLocations.map((location) => (
                              <option key={location} value={location}>
                                {location}
                              </option>
                            ))}
                            <option value="Other">Other</option>
                          </select>
                        ) : (
                          // Search input and results
                          <div>
                            <input
                              type="text"
                              id="selectFromSearch"
                              name="selectFromSearch"
                              value={fromCitySearchTerm}
                              onChange={handleFromCitySearchChange}
                              className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                              placeholder="Search city"
                              disabled={isSubmitting || isLoading}
                            />
                            {fromCitySearchTerm.length > 0 && filteredFromCities.length > 0 && (
                              <ul className="absolute z-30 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                                {filteredFromCities.map((location) => (
                                  <li
                                    key={location}
                                    className="p-2 hover:bg-gray-100 cursor-pointer text-gray-900 text-sm"
                                    onClick={() => handleFromCitySelect(location)}
                                  >
                                    {location}
                                  </li>
                                ))}
                              </ul>
                            )}
                             {fromCitySearchTerm.length > 0 && filteredFromCities.length === 0 && (
                               <div className="p-2 text-sm text-gray-500">No results found</div>
                             )}
                          </div>
                        )}
                        {/* Optionally show selected city if using search, maybe as text */}
                        {selectedFromCity && !showFromCitySearch && (
                           <p className="mt-2 text-sm text-gray-700">Selected: {selectedFromCity}</p>
                        )}
                      </div>
                    </div>

                    {/* To City */}
                    <div>
                      <label htmlFor="selectTo" className="block text-sm font-medium text-gray-700">
                        To City
                      </label>
                      <div className="mt-1 relative">
                         {!showToCitySearch ? (
                          // Initial dropdown
                           <select
                            id="selectTo"
                            name="selectTo"
                            value={selectedToCity || formData.selectTo} // Use selectedToCity for display
                            onChange={handleChange}
                            className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 relative z-20"
                            required
                            disabled={isSubmitting || isLoading}
                          >
                            <option value="">Select a city</option>
                            {initialLocations.map((location) => (
                              <option key={location} value={location}>
                                {location}
                              </option>
                            ))}
                            <option value="Other">Other</option>
                          </select>
                         ) : (
                           // Search input and results
                           <div>
                            <input
                              type="text"
                              id="selectToSearch"
                              name="selectToSearch"
                              value={toCitySearchTerm}
                              onChange={handleToCitySearchChange}
                              className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                              placeholder="Search city"
                              disabled={isSubmitting || isLoading}
                            />
                            {toCitySearchTerm.length > 0 && filteredToCities.length > 0 && (
                              <ul className="absolute z-30 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                                {filteredToCities.map((location) => (
                                  <li
                                    key={location}
                                    className="p-2 hover:bg-gray-100 cursor-pointer text-gray-900 text-sm"
                                    onClick={() => handleToCitySelect(location)}
                                  >
                                    {location}
                                  </li>
                                ))}
                              </ul>
                            )}
                             {toCitySearchTerm.length > 0 && filteredToCities.length === 0 && (
                               <div className="p-2 text-sm text-gray-500">No results found</div>
                             )}
                          </div>
                         )}
                        {/* Optionally show selected city if using search, maybe as text */}
                        {selectedToCity && !showToCitySearch && (
                           <p className="mt-2 text-sm text-gray-700">Selected: {selectedToCity}</p>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700">
                        Pickup Location
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="pickupLocation"
                          name="pickupLocation"
                          value={formData.pickupLocation}
                          onChange={handleChange}
                          className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                          required
                          disabled={isSubmitting || isLoading}
                          placeholder="Enter detailed pickup address"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="dropLocation" className="block text-sm font-medium text-gray-700">
                        Drop Location
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="dropLocation"
                          name="dropLocation"
                          value={formData.dropLocation}
                          onChange={handleChange}
                          className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                          required
                          disabled={isSubmitting || isLoading}
                          placeholder="Enter detailed drop location address"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Details Section */}
                <div className="md:col-span-2">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Vehicle Details</h2>
                  <div>
                    <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">
                      Vehicle Type
                    </label>
                    <div className="mt-1 relative">
                      <select
                        id="vehicleType"
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleChange}
                        className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 relative z-20"
                        required
                        disabled={isSubmitting || isLoading}
                      >
                        <option value="">Select vehicle type</option>
                        {vehicleTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                      {showOtherVehicle && (
                        <input
                          type="text"
                          name="vehicleType"
                          value={formData.vehicleType}
                          onChange={handleChange}
                          className="mt-2 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                          placeholder="Enter other vehicle type"
                          required
                          disabled={isSubmitting || isLoading}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="md:col-span-2">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Details</h2>
                  <div>
                    <label htmlFor="remark" className="block text-sm font-medium text-gray-700">
                      Remarks
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="remark"
                        name="remark"
                        value={formData.remark}
                        onChange={handleChange}
                        rows={3}
                        className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                        disabled={isSubmitting || isLoading}
                        placeholder="Enter any additional remarks or special instructions"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting || isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Shipment...
                    </>
                  ) : (
                    'Create Shipment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 