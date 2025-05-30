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

  // New state for vehicle type search
  const [showVehicleTypeSearch, setShowVehicleTypeSearch] = useState(false);
  const [vehicleTypeSearchTerm, setVehicleTypeSearchTerm] = useState('');
  const [filteredVehicleTypes, setFilteredVehicleTypes] = useState<string[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState('');

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
        setFilteredVehicleTypes(data.vehicleTypes);

      } catch (error) {
        console.error('Error fetching locations and vehicle types:', error);
        setError('Failed to load locations and vehicle types. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocationsAndVehicleTypes();
  }, []);

  // Click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showFromCitySearch && !target.closest('[data-dropdown="from-city"]')) {
        setShowFromCitySearch(false);
      }
      if (showToCitySearch && !target.closest('[data-dropdown="to-city"]')) {
        setShowToCitySearch(false);
      }
      if (showVehicleTypeSearch && !target.closest('[data-dropdown="vehicle-type"]')) {
        setShowVehicleTypeSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFromCitySearch, showToCitySearch, showVehicleTypeSearch]);

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

  // Handle search input changes for Vehicle Type
  const handleVehicleTypeSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setVehicleTypeSearchTerm(searchTerm);
    if (searchTerm.length > 0) {
      setFilteredVehicleTypes(vehicleTypes.filter(type =>
        type.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    } else {
      setFilteredVehicleTypes(vehicleTypes);
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

  // Handle selection from filtered results for Vehicle Type
  const handleVehicleTypeSelect = (vehicleType: string) => {
    setFormData(prev => ({ ...prev, vehicleType: vehicleType })); // Ensure formData is updated
    setSelectedVehicleType(vehicleType);
    setShowOtherVehicle(false); // Reset other vehicle flag
    // Keep search input visible after selection
    setVehicleTypeSearchTerm(''); // Clear search term
    setFilteredVehicleTypes(vehicleTypes); // Reset filtered list
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Form Header */}
          <div className="relative px-8 py-8 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="relative">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2a2 2 0 00-2-2H8z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Create New Shipment</h1>
                  <p className="mt-1 text-blue-100 text-lg">
                    Fill in the details below to create a new shipment booking
                  </p>
                </div>
              </div>
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute bottom-0 left-1/3 -mb-8 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl"></div>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 py-8">
            {error && (
              <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="p-1 bg-red-100 rounded-full">
                      <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-red-800">Error</h3>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="p-1 bg-green-100 rounded-full">
                      <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-green-800">Success</h3>
                    <p className="text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {!showOwnerBrokerSelection ? (
              // Initial Shipment Creation Form
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Location Details</h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* From City */}
                    <div className="space-y-2">
                      <label htmlFor="selectFrom" className="flex items-center text-sm font-semibold text-gray-700">
                        <span className="text-red-500 mr-1">*</span>
                        From City
                      </label>
                      <div className="relative">
                        <div className="relative" data-dropdown="from-city">
                          <button
                            type="button"
                            onClick={() => setShowFromCitySearch(!showFromCitySearch)}
                            className="block w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-900 font-medium text-left flex items-center justify-between"
                          >
                            <span className={selectedFromCity || formData.selectFrom ? "text-gray-900" : "text-gray-500"}>
                              {selectedFromCity || formData.selectFrom || "Select a city"}
                            </span>
                            <svg 
                              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showFromCitySearch ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {showFromCitySearch && (
                            <div className="absolute z-30 mt-2 w-full bg-white shadow-2xl rounded-xl border-2 border-gray-100 overflow-hidden">
                              {/* Search Bar */}
                              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <div className="relative">
                                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                  <input
                                    type="text"
                                    value={fromCitySearchTerm}
                                    onChange={handleFromCitySearchChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-black"
                                    placeholder="Search cities..."
                                    autoFocus
                                  />
                                  {fromCitySearchTerm && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFromCitySearchTerm('');
                                        setFilteredFromCities(locations);
                                      }}
                                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Location List */}
                              <div className="max-h-64 overflow-y-auto">
                                {filteredFromCities.length > 0 ? (
                                  filteredFromCities.map((location, index) => (
                                    <button
                                      key={location.id}
                                      type="button"
                                      onClick={() => {
                                        handleFromCitySelect(location);
                                        setShowFromCitySearch(false);
                                      }}
                                      className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0 ${
                                        (selectedFromCity || formData.selectFrom) === location.name ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-900'
                                      }`}
                                    >
                                      <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="font-medium">{location.name}</span>
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-4 py-8 text-center text-gray-500">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="font-medium text-gray-600">No cities found</p>
                                    <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* To City */}
                    <div className="space-y-2">
                      <label htmlFor="selectTo" className="flex items-center text-sm font-semibold text-gray-700">
                        <span className="text-red-500 mr-1">*</span>
                        To City
                      </label>
                      <div className="relative">
                        <div className="relative" data-dropdown="to-city">
                          <button
                            type="button"
                            onClick={() => setShowToCitySearch(!showToCitySearch)}
                            className="block w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-900 font-medium text-left flex items-center justify-between"
                          >
                            <span className={selectedToCity || formData.selectTo ? "text-gray-900" : "text-gray-500"}>
                              {selectedToCity || formData.selectTo || "Select a city"}
                            </span>
                            <svg 
                              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showToCitySearch ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {showToCitySearch && (
                            <div className="absolute z-30 mt-2 w-full bg-white shadow-2xl rounded-xl border-2 border-gray-100 overflow-hidden">
                              {/* Search Bar */}
                              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <div className="relative">
                                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                  <input
                                    type="text"
                                    value={toCitySearchTerm}
                                    onChange={handleToCitySearchChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-black"
                                    placeholder="Search cities..."
                                    autoFocus
                                  />
                                  {toCitySearchTerm && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setToCitySearchTerm('');
                                        setFilteredToCities(locations);
                                      }}
                                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Location List */}
                              <div className="max-h-64 overflow-y-auto">
                                {filteredToCities.length > 0 ? (
                                  filteredToCities.map((location, index) => (
                                    <button
                                      key={location.id}
                                      type="button"
                                      onClick={() => {
                                        handleToCitySelect(location);
                                        setShowToCitySearch(false);
                                      }}
                                      className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0 ${
                                        (selectedToCity || formData.selectTo) === location.name ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-900'
                                      }`}
                                    >
                                      <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="font-medium">{location.name}</span>
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-4 py-8 text-center text-gray-500">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="font-medium text-gray-600">No cities found</p>
                                    <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="pickupLocation" className="flex items-center text-sm font-semibold text-gray-700">
                        <span className="text-red-500 mr-1">*</span>
                        <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        Pickup Location
                      </label>
                      <input
                        type="text"
                        name="pickupLocation"
                        value={formData.pickupLocation}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-900 font-medium"
                        placeholder="Enter pickup address"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="dropLocation" className="flex items-center text-sm font-semibold text-gray-700">
                        <span className="text-red-500 mr-1">*</span>
                        <svg className="w-4 h-4 mr-1 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        Drop Location
                      </label>
                      <input
                        type="text"
                        name="dropLocation"
                        value={formData.dropLocation}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-900 font-medium"
                        placeholder="Enter drop address"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Details Section */}
                <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2a2 2 0 00-2-2H8z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Vehicle Details</h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="vehicleType" className="flex items-center text-sm font-semibold text-gray-700">
                        <span className="text-red-500 mr-1">*</span>
                        <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2a2 2 0 00-2-2H8z" />
                        </svg>
                        Vehicle Type
                      </label>
                      <div className="relative">
                        <div className="relative" data-dropdown="vehicle-type">
                          <button
                            type="button"
                            onClick={() => setShowVehicleTypeSearch(!showVehicleTypeSearch)}
                            className="block w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 text-gray-900 font-medium text-left flex items-center justify-between"
                          >
                            <span className={selectedVehicleType || formData.vehicleType ? "text-gray-900" : "text-gray-500"}>
                              {selectedVehicleType || formData.vehicleType || "Select vehicle type"}
                            </span>
                            <svg 
                              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showVehicleTypeSearch ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {showVehicleTypeSearch && (
                            <div className="absolute z-30 mt-2 w-full bg-white shadow-2xl rounded-xl border-2 border-gray-100 overflow-hidden">
                              {/* Search Bar */}
                              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                                <div className="relative">
                                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                  <input
                                    type="text"
                                    value={vehicleTypeSearchTerm}
                                    onChange={handleVehicleTypeSearchChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm text-black"
                                    placeholder="Search vehicle types..."
                                    autoFocus
                                  />
                                  {vehicleTypeSearchTerm && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setVehicleTypeSearchTerm('');
                                        setFilteredVehicleTypes(vehicleTypes);
                                      }}
                                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Vehicle Type List */}
                              <div className="max-h-64 overflow-y-auto">
                                {filteredVehicleTypes.length > 0 ? (
                                  filteredVehicleTypes.map((type, index) => (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => {
                                        handleVehicleTypeSelect(type);
                                        setShowVehicleTypeSearch(false);
                                      }}
                                      className={`w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0 ${
                                        (selectedVehicleType || formData.vehicleType) === type ? 'bg-purple-100 text-purple-700 font-semibold' : 'text-gray-900'
                                      }`}
                                    >
                                      <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2a2 2 0 00-2-2H8z" />
                                        </svg>
                                        <span className="font-medium">{type}</span>
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-4 py-8 text-center text-gray-500">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="font-medium text-gray-600">No vehicle types found</p>
                                    <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {showOtherVehicle && (
                          <div className="mt-4">
                            <input
                              type="text"
                              name="vehicleType"
                              id="otherVehicleType"
                              value={formData.vehicleType}
                              onChange={handleChange}
                              className="block w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 text-gray-900 font-medium"
                              placeholder="Enter custom vehicle type"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setShowOtherVehicle(false);
                                setShowVehicleTypeSearch(true);
                                setFormData(prev => ({ ...prev, vehicleType: '' }));
                              }}
                              className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                              ← Back to vehicle types
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Package Details Section */}
                <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-xl p-6 border border-emerald-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Package Details</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="numberOfPackages" className="flex items-center text-sm font-semibold text-gray-700">
                        <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        Number of Packages
                      </label>
                      <input
                        type="number"
                        name="numberOfPackages"
                        value={formData.numberOfPackages}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 text-gray-900 font-medium"
                        placeholder="Enter number"
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="totalWeight" className="flex items-center text-sm font-semibold text-gray-700">
                        <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-3m-3 3l-3-3" />
                        </svg>
                        Total Weight (kg)
                      </label>
                      <input
                        type="number"
                        name="totalWeight"
                        value={formData.totalWeight}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 text-gray-900 font-medium"
                        placeholder="Enter weight"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="totalVolume" className="flex items-center text-sm font-semibold text-gray-700">
                        <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Total Volume (cbm)
                      </label>
                      <input
                        type="number"
                        name="totalVolume"
                        value={formData.totalVolume}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 text-gray-900 font-medium"
                        placeholder="Enter volume"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Loading Details Section */}
                <div className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 rounded-xl p-6 border border-orange-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Loading Details</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="loadingDate" className="flex items-center text-sm font-semibold text-gray-700">
                        <span className="text-red-500 mr-1">*</span>
                        <svg className="w-4 h-4 mr-1 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m0 0V7a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h4V7z" />
                        </svg>
                        Loading Date
                      </label>
                      <input
                        type="date"
                        name="loadingDate"
                        value={formData.loadingDate}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200 text-gray-900 font-medium"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="loadingTime" className="flex items-center text-sm font-semibold text-gray-700">
                        <span className="text-red-500 mr-1">*</span>
                        <svg className="w-4 h-4 mr-1 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Loading Time
                      </label>
                      <input
                        type="time"
                        name="loadingTime"
                        value={formData.loadingTime}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200 text-gray-900 font-medium"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="bg-gradient-to-br from-slate-50/50 to-gray-50/50 rounded-xl p-6 border border-slate-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Additional Details</h2>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="remark" className="flex items-center text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 mr-1 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Remarks & Special Instructions
                    </label>
                    <textarea
                      id="remark"
                      name="remark"
                      value={formData.remark}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm focus:border-slate-500 focus:ring-4 focus:ring-slate-100 transition-all duration-200 text-gray-900 font-medium resize-none"
                      rows={4}
                      placeholder="Enter any special instructions, handling requirements, or additional notes..."
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-8 border-t-2 border-gray-100">
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 rounded-xl text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all duration-200 shadow-sm"
                    disabled={isSubmitting || isLoading}
                  >
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className={`inline-flex items-center justify-center px-8 py-3 border-2 border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-200 transform hover:scale-105 ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed scale-100' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Shipment...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Shipment
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Select Owners and Brokers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Owners List */}
                  <div className="bg-neutral-50 rounded-xl p-4 border border-gray-100 shadow">
                    <h3 className="text-md font-semibold mb-2 text-gray-800">Owners</h3>
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
                      <ul className="space-y-2 ">
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
                  <div className="bg-neutral-50 rounded-xl p-4 border border-gray-100 shadow">
                    <h3 className="text-md font-semibold mb-2 text-gray-800">Brokers</h3>
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
                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowOwnerBrokerSelection(false)}
                    className="px-5 py-2 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                    disabled={isSubmitting}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleOwnerBrokerSubmit}
                    className={`inline-flex items-center px-5 py-2 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ${
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