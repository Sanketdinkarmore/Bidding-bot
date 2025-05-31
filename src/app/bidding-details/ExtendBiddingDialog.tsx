"use client";
import React, { useState } from "react";

interface ExtendBiddingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: any;
  onSuccess: () => void;
}

export default function ExtendBiddingDialog({
  isOpen,
  onClose,
  shipment,
  onSuccess
}: ExtendBiddingDialogProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current date as minimum date (can't extend to past)
  const today = new Date().toISOString().split('T')[0];
  // const currentTime = new Date().toTimeString().slice(0, 5);

  // Function to determine auction status
  const getAuctionStatus = () => {
    if (!shipment) return { status: 'Unknown', color: 'gray-700' };

    // Try to find closing date/time from various possible fields
    const closingDateTime = shipment.shipmentDetails.bidClosingDateTime 
      ? new Date(shipment.shipmentDetails.bidClosingDateTime) 
      : null;

    if (!closingDateTime) {
      return { status: 'Unknown', color: 'gray-700' };
    }

    const closingDate = new Date(closingDateTime);
    const now = new Date();

    if (closingDate <= now) {
      return { status: 'Closed', color: 'red-700' };
    } else {
      return { status: 'Active', color: 'green-700' };
    }
  };

  // Function to get formatted closing date/time
  const getFormattedClosingDateTime = () => {
    if (!shipment) return 'Not specified';

    const closingDateTime = shipment.shipmentDetails.bidClosingDateTime 
      ? new Date(shipment.shipmentDetails.bidClosingDateTime ) 
      : null;

    if (!closingDateTime) {
      return 'Not specified';
    }

    try {
      const closingDate = new Date(closingDateTime);
      return closingDate.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const auctionStatus = getAuctionStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      setError("Please select both date and time");
      return;
    }

    // Validate that selected date/time is in the future
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();
    
    if (selectedDateTime <= now) {
      setError("Please select a future date and time");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/brokers/extend-bidding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId: shipment._id,
          newClosingDateTime: selectedDateTime.toISOString()
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Bidding date extended successfully');
        onSuccess();
        handleClose();
      } else {
        setError(data.message || 'Failed to extend bidding date');
      }
    } catch (err: any) {
      console.error('❌ Error extending bidding date:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedDate("");
    setSelectedTime("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Extend Bidding Date & Time</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Current Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Current Auction Info</h3>
              <p className="text-sm text-blue-700">Auction ID: {shipment._id}</p>
              <p className="text-sm text-blue-700">
                Current Status: <span className={`font-semibold ${auctionStatus.status === 'Active' ? 'text-green-700' : auctionStatus.status === 'Closed' ? 'text-red-700' : 'text-gray-700'}`}>
                  {auctionStatus.status === 'Active' ? '🟢 Active' : auctionStatus.status === 'Closed' ? '🔴 Closed' : '⚪ Unknown'}
                </span>
              </p>
              <p className="text-sm text-blue-700">
                Current Closing Time: <span className="font-semibold">{getFormattedClosingDateTime()}</span>
              </p>
              {auctionStatus.status === 'Closed' && (
                <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                  ⚠️ This auction has already closed. Extending will reopen bidding.
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label htmlFor="extend-date" className="block text-sm font-medium text-gray-700 mb-2">
                New Closing Date *
              </label>
              <input
                type="date"
                id="extend-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={today}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                required
              />
            </div>

            {/* Time Selection */}
            <div>
              <label htmlFor="extend-time" className="block text-sm font-medium text-gray-700 mb-2">
                New Closing Time *
              </label>
              <input
                type="time"
                id="extend-time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                required
              />
            </div>

            {/* Preview */}
            {selectedDate && selectedTime && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-900 mb-2">Extension Preview</h3>
                <p className="text-sm text-green-700">
                  New closing date & time: {new Date(`${selectedDate}T${selectedTime}`).toLocaleString('en-IN', {
                    dateStyle: 'full',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm text-yellow-700 font-medium mb-1">Important Note</p>
                  <p className="text-xs text-yellow-600">
                    {auctionStatus.status === 'Closed' 
                      ? 'This auction has already closed. Extending the bidding date will reopen the auction and allow brokers to place new bids until the new closing time. All existing bids will remain valid.'
                      : 'Extending the bidding date will allow brokers to continue placing bids until the new closing time. All existing bids will remain valid.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedDate || !selectedTime}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 flex items-center gap-2 ${
                isSubmitting || !selectedDate || !selectedTime
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 hover:shadow-lg transform hover:scale-105'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Extending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Extend Bidding
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 