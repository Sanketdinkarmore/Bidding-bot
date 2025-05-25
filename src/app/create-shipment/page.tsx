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
  const [locations, setLocations] = useState<{ id: string, name: string }[]>([]);
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
  const [filteredFromCities, setFilteredFromCities] = useState<{ id: string, name: string }[]>([]);
  const [filteredToCities, setFilteredToCities] = useState<{ id: string, name: string }[]>([]);
  
  // Keep track of the selected location if 'Other' was used
  const [selectedFromCity, setSelectedFromCity] = useState('');
  const [selectedToCity, setSelectedToCity] = useState('');

  // New state for owner/broker selection
  const [showOwnerBrokerSelection, setShowOwnerBrokerSelection] = useState(false);
  const [availableOwners, setAvailableOwners] = useState<{ id: string, name: string, amount: any }[]>([]);
  const [availableBrokers, setAvailableBrokers] = useState<{ id: string, name: string, amount: any }[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]); // Store owner IDs
  const [selectedBrokers, setSelectedBrokers] = useState<string[]>([]); // Store broker IDs
  const [isFetchingOwnersBrokers, setIsFetchingOwnersBrokers] = useState(false);

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
        setFormData(prev => ({ ...prev, selectFrom: '' })); // Clear formData when selecting 'Other'
        // setSelectedFromCity(''); // Keep the selected city displayed until a new one is chosen
      } else {
        setShowFromCitySearch(false);
        setFormData(prev => ({ ...prev, selectFrom: value }));
        setSelectedFromCity(value); // Set selected city from dropdown
      }
    } else if (name === 'selectTo') {
      if (value === 'Other') {
        setShowToCitySearch(true);
        setFormData(prev => ({ ...prev, selectTo: '' })); // Clear formData when selecting 'Other'
        // setSelectedToCity(''); // Keep the selected city displayed
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
        location.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        location.name.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    } else {
      setFilteredToCities(locations);
    }
  };

  // Handle selection from filtered results for From City
  const handleFromCitySelect = (location: { id: string, name: string }) => {
    setFormData(prev => ({ ...prev, selectFrom: location.name })); // Ensure formData is updated
    setSelectedFromCity(location.name);
    // Keep search input visible after selection
    setFromCitySearchTerm(''); // Clear search term
    setFilteredFromCities(locations); // Reset filtered list
  };

  // Handle selection from filtered results for To City
  const handleToCitySelect = (location: { id: string, name: string }) => {
    setFormData(prev => ({ ...prev, selectTo: location.name })); // Ensure formData is updated
    setSelectedToCity(location.name);
    // Keep search input visible after selection
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
      // Do NOT clear formData or related state here!
      // Only fetch owners and brokers for the next step
      fetchOwnersAndBrokers(selectedFromCity || formData.selectFrom, selectedToCity || formData.selectTo, formData.vehicleType);

    } catch (error) {
      setError('Error creating shipment. Please try again.');
      console.error('Error creating shipment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to fetch owners and brokers
  const fetchOwnersAndBrokers = async (fromCity: string, toCity: string, vehicleType: string) => {
    setIsFetchingOwnersBrokers(true);
    try {
      const response = await fetch(`/api/owners-brokers?fromCity=${fromCity}&toCity=${toCity}&vehicleType=${vehicleType}`);
      if (!response.ok) {
        throw new Error('Failed to fetch owners and brokers');
      }
      const data = await response.json();
      setAvailableOwners(data.owners);
      setAvailableBrokers(data.brokers);
      setShowOwnerBrokerSelection(true); // Show the selection section
    } catch (error) {
      console.error('Error fetching owners and brokers:', error);
      setError('Failed to load owners and brokers. You can proceed without selecting, or try creating the shipment again.');
      // Optionally, decide whether to still show the section with empty lists or hide it
      // setShowOwnerBrokerSelection(false);
    } finally {
      setIsFetchingOwnersBrokers(false);
    }
  };

  // Handle owner checkbox change
  const handleOwnerChange = (ownerId: string) => {
    setSelectedOwners(prev =>
      prev.includes(ownerId) ? prev.filter(id => id !== ownerId) : [...prev, ownerId]
    );
  };

  // Handle broker checkbox change
  const handleBrokerChange = (brokerId: string) => {
    setSelectedBrokers(prev =>
      prev.includes(brokerId) ? prev.filter(id => id !== brokerId) : [...prev, brokerId]
    );
  };

  // Handle final submission after selecting owners/brokers (Optional - depends on your flow)
  const handleOwnerBrokerSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const selectionData = {
        shipmentDetails: {
          fromCity: selectedFromCity || formData.selectFrom,
          toCity: selectedToCity || formData.selectTo,
          vehicleType: formData.vehicleType,
          pickupLocation: formData.pickupLocation,
          dropLocation: formData.dropLocation,
          numberOfPackages: formData.numberOfPackages,
          totalWeight: formData.totalWeight,
          totalVolume: formData.totalVolume,
          loadingDate: formData.loadingDate,
          loadingTime: formData.loadingTime,
          remark: formData.remark,
        },
        selectedOwners: availableOwners.filter(owner => selectedOwners.includes(owner.id)),
        selectedBrokers: availableBrokers.filter(broker => selectedBrokers.includes(broker.id)),
      };

      const response = await fetch('/api/save-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectionData),
      });

      if (!response.ok) throw new Error('Failed to save selection');
      setSuccess('Selection saved successfully!');
      // Now clear formData and related state after everything is done
      setFormData({
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
      setShowOtherFrom(false);
      setShowOtherTo(false);
      setShowOtherVehicle(false);
      setShowFromCitySearch(false);
      setShowToCitySearch(false);
      setFromCitySearchTerm('');
      setToCitySearchTerm('');
      setFilteredFromCities(locations);
      setFilteredToCities(locations);
      setSelectedFromCity('');
      setSelectedToCity('');
      setShowOwnerBrokerSelection(false);
      setAvailableOwners([]);
      setAvailableBrokers([]);
      setSelectedOwners([]);
      setSelectedBrokers([]);
    } catch (error) {
      setError('Error saving selection. Please try again.');
      console.error('Error saving selection:', error);
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
            <h1 className="text-2xl font-bold text-gray-900">Create New Shipment Booking</h1>
            <p className="mt-1 text-sm text-gray-500">
              Fill in the details below to create a new shipment booking.
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

            {!showOwnerBrokerSelection ? (
              // Initial Shipment Creation Form
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <option key={location.id} value={location.name}>
                                  {location.name}
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
                                value={selectedFromCity || fromCitySearchTerm} // Display selected city if available, otherwise search term
                                onChange={handleFromCitySearchChange}
                                className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                                placeholder="Search city"
                                disabled={isSubmitting || isLoading}
                              />
                              {fromCitySearchTerm.length > 0 && filteredFromCities.length > 0 && (
                                <ul className="absolute z-30 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                                  {filteredFromCities.map((location) => (
                                    <li
                                      key={location.id}
                                      className="p-2 hover:bg-gray-100 cursor-pointer text-gray-900 text-sm"
                                      onClick={() => handleFromCitySelect(location)}
                                    >
                                      {location.name}
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
                                <option key={location.id} value={location.name}>
                                  {location.name}
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
                                value={selectedToCity || toCitySearchTerm} // Display selected city if available, otherwise search term
                                onChange={handleToCitySearchChange}
                                className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                                placeholder="Search city"
                                disabled={isSubmitting || isLoading}
                              />
                              {toCitySearchTerm.length > 0 && filteredToCities.length > 0 && (
                                <ul className="absolute z-30 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                                  {filteredToCities.map((location) => (
                                    <li
                                      key={location.id}
                                      className="p-2 hover:bg-gray-100 cursor-pointer text-gray-900 text-sm"
                                      onClick={() => handleToCitySelect(location)}
                                    >
                                      {location.name}
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
            ) : (
              // Owner and Broker Selection Section
              <div className="space-y-6">
                 <h2 className="text-xl font-medium text-gray-900">Select Owners and Brokers</h2>
                 <p className="text-sm text-gray-500">Based on the shipment details, here are potential owners and brokers.</p>

                 {isFetchingOwnersBrokers ? (
                   <div className="text-center py-8">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                     <p className="mt-2 text-sm text-gray-500">Loading owners and brokers...</p>
                   </div>
                 ) : availableOwners.length === 0 && availableBrokers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">No owners or brokers found matching the shipment criteria.</p>
                    </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Owners List */}
                     <div>
                       <h3 className="text-lg font-medium text-gray-900 mb-3">Owners</h3>
                       {availableOwners.length > 0 ? (
                         <ul className="space-y-2">
                           {availableOwners.map(owner => (
                             <li key={`${owner.id}-${owner.name}`} className="flex items-center justify-between">
                               <div className="relative flex items-start">
                                 <div className="flex h-5 items-center">
                                   <input
                                     id={`owner-${owner.id}`}
                                     name="owners"
                                     type="checkbox"
                                     checked={selectedOwners.includes(owner.id)}
                                     onChange={() => handleOwnerChange(owner.id)}
                                     className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                   />
                                 </div>
                                 <div className="ml-3 text-sm">
                                   <label htmlFor={`owner-${owner.id}`} className="font-medium text-gray-900">
                                     {owner.name}
                                   </label>
                                 </div>
                               </div>
                                {owner.amount && (
                                   <span className="ml-2 text-sm text-gray-500">({owner.amount})</span>
                                )}
                             </li>
                           ))}
                         </ul>
                       ) : (
                         <p className="text-sm text-gray-500">No owners found.</p>
                       )}
                     </div>

                     {/* Brokers List */}
                     <div>
                       <h3 className="text-lg font-medium text-gray-900 mb-3">Brokers</h3>
                       {availableBrokers.length > 0 ? (
                         <ul className="space-y-2">
                           {availableBrokers.map(broker => (
                             <li key={broker.id} className="flex items-center justify-between">
                               <div className="relative flex items-start">
                                 <div className="flex h-5 items-center">
                                   <input
                                     id={`broker-${broker.id}`}
                                     name="brokers"
                                     type="checkbox"
                                     checked={selectedBrokers.includes(broker.id)}
                                     onChange={() => handleBrokerChange(broker.id)}
                                     className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                   />
                                 </div>
                                 <div className="ml-3 text-sm">
                                   <label htmlFor={`broker-${broker.id}`} className="font-medium text-gray-900">
                                     {broker.name}
                                   </label>
                                 </div>
                               </div>
                                {broker.amount && (
                                   <span className="ml-2 text-sm text-gray-500">({broker.amount})</span>
                                )}
                             </li>
                           ))}
                         </ul>
                       ) : (
                         <p className="text-sm text-gray-500">No brokers found.</p>
                       )}
                     </div>
                   </div>
                 )}

                 {/* Action Button for Owner/Broker Selection (Optional)*/}
                 {(availableOwners.length > 0 || availableBrokers.length > 0) && (
                    <div className="flex justify-end pt-6 border-t border-gray-200">
                       <button
                          type="button"
                          onClick={handleOwnerBrokerSubmit}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          disabled={isSubmitting}
                       >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving Selection...
                            </>
                          ) : (
                            'Confirm Selection'
                          )}
                       </button>
                    </div>
                 )}

              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 