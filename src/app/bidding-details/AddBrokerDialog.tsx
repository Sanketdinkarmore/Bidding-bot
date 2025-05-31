import React, { useEffect, useState } from 'react';
import {toast} from "@/lib/toast"

interface Broker {
  id: string;
  name: string;
  phone: string;
  amounts?: number;
}

interface AddBrokerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBrokerIds: string[];
  onBrokerSelect: (brokerIds: string[]) => void;
  handleCloseAddBrokerDialog: () => void
  shipment: any
}

const AddBrokerDialog: React.FC<AddBrokerDialogProps> = ({
  isOpen,
  onClose,
  selectedBrokerIds,
  onBrokerSelect,
  shipment,
  handleCloseAddBrokerDialog
}) => {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch brokers when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchBrokers();
    }
  }, [isOpen]);

  const fetchBrokers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`/api/brokers?fromCity=${shipment.shipmentDetails.fromCity}&toCity=${shipment.shipmentDetails.toCity}&vehicleType=${shipment.shipmentDetails.vehicleType}`);

      if (!response.ok) {
        throw new Error('Failed to fetch brokers');
      }

      const data = await response.json();

      let brokers = data.brokers || data || []
      const includedBrokers = [shipment.selectedOwners?.map((b: any) => b.id), shipment.selectedBrokers?.map((b: any) => b.id)].flat(2)

      brokers  = brokers.filter((broker: any) => !includedBrokers.includes(broker.id))

      setBrokers(brokers);
    } catch (err: any) {
      setError(err.message || 'Failed to load brokers');
      console.error('Error fetching brokers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBrokerToggle = (brokerId: string) => {
    const currentSelection = [...selectedBrokerIds];
    const isSelected = currentSelection.includes(brokerId);
    
    if (isSelected) {
      // Remove from selection
      const newSelection = currentSelection.filter(id => id !== brokerId);
      onBrokerSelect(newSelection);
    } else {
      // Add to selection
      onBrokerSelect([...currentSelection, brokerId]);
    }
  };

  const handleAddBroker = async () => {
    if (selectedBrokerIds.length === 0) {
      alert('Please select at least one broker');
      return;
    }

    try {
      setSending(true)

      // Here you would typically make an API call to add the brokers to the auction
      console.log('Adding brokers to auction:', selectedBrokerIds);
      
      // TODO: Implement actual API call to add brokers to auction
      // Example API call:
      const response = await fetch('/api/brokers/add-brokers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          auctionId: shipment._id, 
          shipmentDetails: shipment.shipmentDetails,
          brokers: brokers.filter(broker => selectedBrokerIds.includes(broker.id)) 
        })
      });

      if (!response) {
        toast.error("failed to add broker")
        return
      }

      toast.success("brokers successfully added")

      handleCloseAddBrokerDialog()
    } catch (error) {
      console.error('❌ Error adding brokers to auction:', error);
    } finally {
      setSending(false)
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full h-[85vh] overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <div className="p-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Broker to Auction
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-6 pt-4 pb-4 flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Brokers <span className="text-red-500">*</span>
              {selectedBrokerIds.length > 0 && (
                <span className="ml-2 text-green-600 font-semibold">
                  ({selectedBrokerIds.length} selected)
                </span>
              )}
            </label>
            
            {/* Route Info */}
            <div className="mb-4 text-xs text-gray-500 text-center p-2 bg-blue-50 rounded-lg">
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Route: {shipment?.fromCity} → {shipment?.toCity} | Vehicle: {shipment?.vehicleType}
            </div>
          </div>

          {/* Brokers List - Scrollable */}
          <div className="flex-1 px-6 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-2 text-gray-600">Loading brokers...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
                <button 
                  onClick={fetchBrokers}
                  className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : brokers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-sm">No brokers available for this route</p>
                <p className="text-xs text-gray-400 mt-1">
                  {shipment?.fromCity} → {shipment?.toCity} | {shipment?.vehicleType}
                </p>
              </div>
            ) : (
              <div className="h-full overflow-y-auto px-2 space-y-3">
                {brokers.map((broker) => (
                  <div
                    key={broker.id}
                    onClick={() => !sending && handleBrokerToggle(broker.id)}
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedBrokerIds.includes(broker.id)
                        ? 'border-green-500 bg-green-50 shadow-md transform scale-[1.01]'
                        : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-25 hover:shadow-sm'
                    }`}
                  >
                    {/* Selection Indicator - Checkbox Style */}
                    <div className="absolute top-3 right-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedBrokerIds.includes(broker.id)
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {selectedBrokerIds.includes(broker.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Broker Info */}
                    <div className="pr-8">
                      {/* Name */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedBrokerIds.includes(broker.id)
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                        }`}>
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className={`font-semibold text-lg ${
                            selectedBrokerIds.includes(broker.id) ? 'text-green-800' : 'text-gray-900'
                          }`}>
                            {broker.name}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {broker.phone}
                          </div>
                        </div>
                      </div>

                      {/* Average Amount */}
                      {broker.amounts && (
                        <div className="flex items-center gap-x-2">
                          <span className="text-sm text-gray-600">Average</span>
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            selectedBrokerIds.includes(broker.id)
                              ? 'bg-green-200 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            ₹ {broker.amounts.toLocaleString('en-IN')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Action Buttons */}
        <div className="p-6 pt-3 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddBroker}
              disabled={selectedBrokerIds.length === 0 || loading}
              className={`px-6 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ${
                selectedBrokerIds.length === 0 || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 hover:shadow-lg transform hover:scale-105'
              }`}
            >
              {sending ? 'Loading...' :  'Add Brokers'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBrokerDialog; 