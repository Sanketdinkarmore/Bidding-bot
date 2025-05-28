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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white shadow-sm px-4 py-4 sm:px-6 lg:px-8 rounded-lg">
        <div className="mx-auto max-w-7xl">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Create Shipment</h2>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0">
              {/* Optional: Add a back button or link if needed */}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Shipment Form */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Shipment Details</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Fill out the details for the new shipment.</p>
          </div>
          
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 text-base text-red-700">
                  <p className="text-base text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 text-base text-green-700">
                  <p className="text-base text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="numberOfPackages" className="block text-sm font-medium text-gray-700">Number of Packages</label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="numberOfPackages"
                    value={formData.numberOfPackages}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="loadingDate" className="block text-sm font-medium text-gray-700">Loading Date</label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="loadingDate"
                    value={formData.loadingDate}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="loadingTime" className="block text-sm font-medium text-gray-700">Loading Time</label>
                <div className="mt-1">
                  <input
                    type="time"
                    name="loadingTime"
                    value={formData.loadingTime}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Locations */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="selectFrom" className="block text-sm font-medium text-gray-700">From City</label>
                  <div className="mt-1">
                    {!showFromCitySearch ? (
                      <select
                        id="selectFrom"
                        name="selectFrom"
                        value={selectedFromCity || formData.selectFrom}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                        required
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
                      <div className="relative mt-1">
                        <input
                          type="text"
                          id="fromCitySearch"
                          value={selectedFromCity || fromCitySearchTerm}
                          onChange={handleFromCitySearchChange}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                          placeholder="Search or enter city name"
                        />
                        {fromCitySearchTerm.length > 0 && filteredFromCities.length > 0 && (
                          <ul className="absolute z-10 mt-2 w-full bg-white shadow-lg max-h-60 rounded-md ring-1 ring-black ring-opacity-5 overflow-auto text-base">
                            {filteredFromCities.map((location) => (
                              <li
                                key={location.id}
                                className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-gray-900 hover:bg-gray-100"
                                onClick={() => handleFromCitySelect(location)}
                              >
                                <span className="block truncate">{location.name}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {fromCitySearchTerm.length > 0 && filteredFromCities.length === 0 && (
                          <div className="mt-2 px-3 text-base text-gray-500">No results found. Enter city manually.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="selectTo" className="block text-sm font-medium text-gray-700">To City</label>
                  <div className="mt-1">
                    {!showToCitySearch ? (
                      <select
                        id="selectTo"
                        name="selectTo"
                        value={selectedToCity || formData.selectTo}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                        required
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
                      <div className="relative mt-1">
                        <input
                          type="text"
                          id="toCitySearch"
                          value={selectedToCity || toCitySearchTerm}
                          onChange={handleToCitySearchChange}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                          placeholder="Search or enter city name"
                        />
                        {toCitySearchTerm.length > 0 && filteredToCities.length > 0 && (
                          <ul className="absolute z-10 mt-2 w-full bg-white shadow-lg max-h-60 rounded-md ring-1 ring-black ring-opacity-5 overflow-auto text-base">
                            {filteredToCities.map((location) => (
                              <li
                                key={location.id}
                                className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-gray-900 hover:bg-gray-100"
                                onClick={() => handleToCitySelect(location)}
                              >
                                <span className="block truncate">{location.name}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {toCitySearchTerm.length > 0 && filteredToCities.length === 0 && (
                          <div className="mt-2 px-3 text-base text-gray-500">No results found. Enter city manually.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle and Weight/Volume */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                    <div className="mt-1">
                      {!showOtherVehicle ? (
                        <select
                          id="vehicleType"
                          name="vehicleType"
                          value={formData.vehicleType}
                          onChange={handleChange}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                          required
                        >
                          <option value="">Select vehicle type</option>
                          {vehicleTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          name="vehicleType"
                          id="otherVehicleType"
                          value={formData.vehicleType}
                          onChange={handleChange}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                          placeholder="Enter vehicle type"
                          required
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="totalWeight" className="block text-sm font-medium text-gray-700">Total Weight (kg)</label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="totalWeight"
                        value={formData.totalWeight}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="totalVolume" className="block text-sm font-medium text-gray-700">Total Volume (cbm)</label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="totalVolume"
                        value={formData.totalVolume}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Pickup/Dropoff and Remark */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700">Pickup Location</label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="pickupLocation"
                        value={formData.pickupLocation}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dropLocation" className="block text-sm font-medium text-gray-700">Drop Location</label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="dropLocation"
                        value={formData.dropLocation}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="remark" className="block text-sm font-medium text-gray-700">Remark (Optional)</label>
                    <div className="mt-1">
                      <textarea
                        id="remark"
                        name="remark"
                        value={formData.remark}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className={`inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSubmitting || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Shipment
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Shipment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Owner/Broker Selection Section */}
        {showOwnerBrokerSelection && !isLoading && !error && success && availableOwners.length > 0 || availableBrokers.length > 0 && (
          <div className="mt-6 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Notify Owners/Brokers</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Select which owners and brokers to notify about this new shipment.</p>

              {isFetchingOwnersBrokers ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  <p className="ml-3 text-base text-gray-500">Loading contacts...</p>
                </div>
              ) : availableOwners.length === 0 && availableBrokers.length === 0 ? (
                <p className="text-sm text-gray-500">No owners or brokers found for the selected criteria.</p>
              ) : (
                <div className="mt-6 space-y-6">
                  {availableOwners.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Owners</h4>
                      <ul className="mt-4 space-y-4">
                        {availableOwners.map(owner => (
                          <li key={owner.id} className="flex items-start">
                            <div className="flex h-5 items-center">
                              <input
                                id={`owner-${owner.id}`}
                                name="owners"
                                type="checkbox"
                                checked={selectedOwners.includes(owner.id)}
                                onChange={() => handleOwnerChange(owner.id)}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                              />
                            </div>
                            <div className="ml-3 text-base">
                              <label htmlFor={`owner-${owner.id}`} className="font-medium text-gray-700 text-base">
                                {owner.name}
                              </label>
                              <p className="text-gray-500 mt-0.5 text-sm">{owner.amount ? `(Current Bid: ${owner.amount})` : ''}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {availableBrokers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Brokers</h4>
                      <ul className="mt-4 space-y-4">
                        {availableBrokers.map(broker => (
                          <li key={broker.id} className="flex items-start">
                            <div className="flex h-5 items-center">
                              <input
                                id={`broker-${broker.id}`}
                                name="brokers"
                                type="checkbox"
                                checked={selectedBrokers.includes(broker.id)}
                                onChange={() => handleBrokerChange(broker.id)}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                              />
                            </div>
                            <div className="ml-3 text-base">
                              <label htmlFor={`broker-${broker.id}`} className="font-medium text-gray-700 text-base">
                                {broker.name}
                              </label>
                              <p className="text-gray-500 mt-0.5 text-sm">{broker.amount ? `(Current Bid: ${broker.amount})` : ''}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {availableOwners.length > 0 || availableBrokers.length > 0 && (
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={handleOwnerBrokerSubmit}
                        disabled={selectedOwners.length === 0 && selectedBrokers.length === 0 || isSubmitting}
                        className={`inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${selectedOwners.length === 0 && selectedBrokers.length === 0 || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Sending Notifications...
                          </>
                        ) : (
                          'Send Notifications'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 