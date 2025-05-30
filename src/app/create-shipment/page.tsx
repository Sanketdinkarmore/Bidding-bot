'use client';

import { useState, useEffect } from 'react';

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
  const [, setShowOtherFrom] = useState(false);
  const [, setShowOtherTo] = useState(false);
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
      const fromCity = selectedFromCity || formData.selectFrom;
      const toCity = selectedToCity || formData.selectTo;
      const vehicleType = formData.vehicleType;
      console.log('fetchOwnersAndBrokers params:', fromCity, toCity, vehicleType);
      if (!fromCity || !toCity || !vehicleType) {
        setError('Could not fetch owners and brokers: Missing city or vehicle type.');
        return;
      }
      fetchOwnersAndBrokers(fromCity, toCity, vehicleType);

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
      const response = await fetch(`/api/create-shipment-owners-brokers?fromCity=${fromCity}&toCity=${toCity}&vehicleType=${vehicleType}`);
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* Location Details Section */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* From City */}
                    <div>
                      <label htmlFor="selectFrom" className="block text-sm font-medium text-gray-700">From City</label>
                      <div className="mt-1 relative">
                        {!showFromCitySearch ? (
                          <select
                            id="selectFrom"
                            name="selectFrom"
                            value={selectedFromCity || formData.selectFrom}
                            onChange={handleChange}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base text-gray-900"
                            required
                          >
                            <option value="" className="text-gray-900">Select a city</option>
                            {initialLocations.map((location) => (
                              <option key={location.id} value={location.name} className="text-gray-900">
                                {location.name}
                              </option>
                            ))}
                            <option value="Other" className="text-gray-900">Other</option>
                          </select>
                        ) : (
                          <div className="relative mt-1">
                            <input
                              type="text"
                              id="fromCitySearch"
                              value={selectedFromCity || fromCitySearchTerm}
                              onChange={handleFromCitySearchChange}
                              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base text-gray-900"
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
                    {/* To City */}
                    <div>
                      <label htmlFor="selectTo" className="block text-sm font-medium text-gray-700">To City</label>
                      <div className="mt-1 relative">
                        {!showToCitySearch ? (
                          <select
                            id="selectTo"
                            name="selectTo"
                            value={selectedToCity || formData.selectTo}
                            onChange={handleChange}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base text-gray-900"
                            required
                          >
                            <option value="" className="text-gray-900">Select a city</option>
                            {initialLocations.map((location) => (
                              <option key={location.id} value={location.name} className="text-gray-900">
                                {location.name}
                              </option>
                            ))}
                            <option value="Other" className="text-gray-900">Other</option>
                          </select>
                        ) : (
                          <div className="relative mt-1">
                            <input
                              type="text"
                              id="toCitySearch"
                              value={selectedToCity || toCitySearchTerm}
                              onChange={handleToCitySearchChange}
                              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base text-gray-900"
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
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700">Pickup Location</label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="pickupLocation"
                            value={formData.pickupLocation}
                            onChange={handleChange}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base text-gray-900"
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
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base text-gray-900"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Details Section */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                      <div className="mt-1">
                        {!showOtherVehicle ? (
                          <select
                            id="vehicleType"
                            name="vehicleType"
                            value={formData.vehicleType}
                            onChange={handleChange}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base text-gray-900"
                            required
                          >
                            <option value="" className="text-gray-900">Select vehicle type</option>
                            {vehicleTypes.map((type) => (
                              <option key={type} value={type} className="text-gray-900">
                                {type}
                              </option>
                            ))}
                            <option value="Other" className="text-gray-900">Other</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            name="vehicleType"
                            id="otherVehicleType"
                            value={formData.vehicleType}
                            onChange={handleChange}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base text-gray-900"
                            placeholder="Enter vehicle type"
                            required
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Package Details Section */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Package Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="numberOfPackages" className="block text-sm font-medium text-gray-700">Number of Packages</label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="numberOfPackages"
                          value={formData.numberOfPackages}
                          onChange={handleChange}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base text-gray-900"
                          required
                        />
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
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base text-gray-900"
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
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base text-gray-900"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loading Details Section */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Loading Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="loadingDate" className="block text-sm font-medium text-gray-700">Loading Date</label>
                      <div className="mt-1">
                        <input
                          type="date"
                          name="loadingDate"
                          value={formData.loadingDate}
                          onChange={handleChange}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base text-gray-900"
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
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base text-gray-900"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
                  <div>
                    <label htmlFor="remark" className="block text-sm font-medium text-gray-700">Remarks</label>
                    <div className="mt-1">
                      <textarea
                        id="remark"
                        name="remark"
                        value={formData.remark}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base text-gray-900"
                        rows={3}
                      />
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
              <div className="space-y-8">
                <h2 className="text-lg font-semibold text-gray-900">Select Owners and Brokers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Owners List */}
                  <div>
                    <h3 className="text-md font-bold mb-2">Owners</h3>
                    {isFetchingOwnersBrokers ? (
                      <div className="flex items-center justify-center py-4">
                        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="ml-2">Loading owners...</span>
                      </div>
                    ) : availableOwners.length === 0 ? (
                      <p className="text-gray-500">No owners found for this route/vehicle.</p>
                    ) : (
                      <ul className="space-y-2">
                        {availableOwners.map(owner => (
                          <li key={owner.id} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`owner-${owner.id}`}
                              checked={selectedOwners.includes(owner.id)}
                              onChange={() => handleOwnerChange(owner.id)}
                              className="mr-2"
                            />
                            <label htmlFor={`owner-${owner.id}`} className="flex-1 text-gray-900">
                              {owner.name} {owner.amount && <span className="text-xs text-gray-800">({owner.amount})</span>}
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/* Brokers List */}
                  <div>
                    <h3 className="text-md font-bold mb-2">Brokers</h3>
                    {isFetchingOwnersBrokers ? (
                      <div className="flex items-center justify-center py-4">
                        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="ml-2">Loading brokers...</span>
                      </div>
                    ) : availableBrokers.length === 0 ? (
                      <p className="text-gray-500">No brokers found for this route/vehicle.</p>
                    ) : (
                      <ul className="space-y-2">
                        {availableBrokers.map(broker => (
                          <li key={broker.id} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`broker-${broker.id}`}
                              checked={selectedBrokers.includes(broker.id)}
                              onChange={() => handleBrokerChange(broker.id)}
                              className="mr-2"
                            />
                            <label htmlFor={`broker-${broker.id}`} className="flex-1 text-gray-900">
                              {broker.name} {broker.amount && <span className="text-xs text-gray-800">({broker.amount})</span>}
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowOwnerBrokerSelection(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleOwnerBrokerSubmit}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Selection'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 