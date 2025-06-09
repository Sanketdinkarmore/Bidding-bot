/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AddBrokerDialog from "./AddBrokerDialog";
import ExtendBiddingDialog from "./ExtendBiddingDialog";

function BiddingDetailsContent() {
  const searchParams = useSearchParams();
  const shipmentId = searchParams.get("id");
  const [shipment, setShipment] = useState<any | null>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [, setPreviousBids] = useState<any[]>([]); // Track previous bids for comparison
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Default ascending
  const [updatingBidId, setUpdatingBidId] = useState<string | null>(null); // Track which specific bid is being updated
  const [isPolling, setIsPolling] = useState(false); // Track polling status
  const [newBidsCount, setNewBidsCount] = useState(0); // Track new bids
  const [recentBidIds, setRecentBidIds] = useState<Set<string>>(new Set()); // Track recently arrived bid IDs
  const [isRefreshing, setIsRefreshing] = useState(false); // Track manual refresh status
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null); // Track last refresh time
  const [isAddBrokerDialogOpen, setIsAddBrokerDialogOpen] = useState(false); // Track dialog state
  const [selectedBrokerIds, setSelectedBrokerIds] = useState<string[]>([]); // Track selected broker IDs
  const [isExtendBiddingDialogOpen, setIsExtendBiddingDialogOpen] = useState(false); // Track extend bidding dialog state
  const [activeTab, setActiveTab] = useState<'brokers' | 'owners'>('brokers'); // Track active tab

  // Create consistent unique IDs for bids
  const getBidId = (bid: any, originalIndex: number) => {
    return bid._id || bid.id || `${bid.phone}-${bid.amount}-${bid.timestamp}` || `bid-${originalIndex}`;
  };

  // Function to fetch latest bids and shipment data
  const fetchLatestData = async (isPollingCall = false, isManualRefresh = false) => {
    if (isPollingCall) setIsPolling(true);
    if (isManualRefresh) setIsRefreshing(true);
    
    try {
      const res = await fetch(`/api/selectedOwnerBrokers?id=${shipmentId}&timestamp=${Date.now()}`);
      const data = await res.json();
      
      if (data) {
        // const newBids = data.bids || [];

        setShipment(data)
        
        // Check for new bids by comparing with previous bids
        // if ((isPollingCall || isManualRefresh) && previousBids.length > 0) {
        //   const actualNewBids = findNewBids(newBids, previousBids);
          
        //   console.log('🔄 Polling Debug Info:', {
        //     isPollingCall,
        //     isManualRefresh,
        //     previousBidsCount: previousBids.length,
        //     currentBidsCount: newBids.length,
        //     newBidsFound: actualNewBids.length,
        //     previousBidIdentifiers: previousBids.map((bid: any) => createBidIdentifier(bid)),
        //     currentBidIdentifiers: newBids.map((bid: any) => createBidIdentifier(bid)),
        //     newBidIdentifiers: actualNewBids.map((bid: any) => createBidIdentifier(bid))
        //   });
          
        //   if (actualNewBids.length > 0) {
        //     setNewBidsCount(prev => prev + actualNewBids.length);
            
        //     console.log(`📊 Bid comparison: Previous bids: ${previousBids.length}, Current bids: ${newBids.length}, New bids found: ${actualNewBids.length}`);
        //     console.log('🆕 New bids detected:', actualNewBids.map(bid => `${bid.brokerName} - ₹${bid.amount}`));
            
        //     // Generate IDs for new bids and mark them as recent
        //     const newBidIds = actualNewBids.map((bid: any, index: number) => 
        //       getBidId(bid, newBids.indexOf(bid))
        //     );
            
        //     setRecentBidIds(new Set(newBidIds));
            
        //     // Clear recent bids highlighting after 10 seconds
        //     setTimeout(() => {
        //       setRecentBidIds(new Set());
        //     }, 10000);
            
        //     // Show notification for new bids
        //     console.log(`🎉 ${actualNewBids.length} new bid(s) received!`);
        //   } else {
        //     console.log(`📊 No new bids detected. Previous: ${previousBids.length}, Current: ${newBids.length}`);
        //   }
        // }
        
        // Update state with latest data
        // setShipment(data);
        setBids(data.bids);
        
        // // Update previous bids only if we have new data
        // if (newBids.length > 0) {
        //   setPreviousBids(newBids);
        // }
        
        setLastRefreshTime(new Date());
        
        if (isManualRefresh) {
          console.log('✅ Data refreshed successfully');
        }
      }
    } catch (err: any) {
      console.error('Error fetching latest data:', err);
      if (isManualRefresh) {
      }
    } finally {
      if (isPollingCall) setIsPolling(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchShipmentAndBids = async () => {
      setLoading(true);
      setError(null);
      try {
        // Initial fetch - don't check for new bids on first load
        const res = await fetch(`/api/selectedOwnerBrokers?id=${shipmentId}&timestamp=${Date.now()}`);
        const data = await res.json();
        
        if (data) {
          const newBids = data.bids || [];
          setShipment(data);
          setBids(newBids);
          setPreviousBids(newBids);
          setLastRefreshTime(new Date());
          console.log(`🔄 Initial load: ${newBids.length} bids found`);
        }
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    
    if (shipmentId) {
      fetchShipmentAndBids();
    }
  }, [shipmentId]);

  // Polling effect - runs every 60 seconds
  useEffect(() => {
    if (!shipmentId || loading) return; // Don't start polling until initial load is complete
    
    const pollInterval = setInterval(() => {
      fetchLatestData(true); // true indicates this is a polling call
    }, 60000); // 60 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(pollInterval);
  }, [shipmentId, loading]); // Only depend on shipmentId and loading

  // Reset new bids counter when user acknowledges
  const acknowledgeNewBids = () => {
    setNewBidsCount(0);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[250px] bg-gray-50 py-10">Loading...</div>;
  }

  if (error || !shipment) {
    return <div className="flex justify-center items-center min-h-[250px] bg-gray-50 py-10 text-red-600">{error || "Shipment not found"}</div>;
  }

  // Get selected winners from shipment data
  const selectedWinnersFromAPI = shipment.selectedWinners || [];
  
  // Function to check if a bid is a selected winner by matching phone and amount
  const isBidSelectedWinner = (bid: any) => {
    return selectedWinnersFromAPI.some((winner: any) => 
      winner.phone === bid.phone && winner.amount === bid.amount
    );
  };

  // Mock extra fields for top section
  const refPrice = shipment.refPrice || "REF. PRICE ₹ 1 perMT";

  // Add these computed values after fetching shipment
  const pickup = shipment?.shipmentDetails?.pickupLocation || shipment?.pickupLocation || shipment?.selectFrom || '';
  const delivery = shipment?.shipmentDetails?.dropLocation || shipment?.dropLocation || shipment?.selectTo || '';
  const reqTruckType = shipment?.shipmentDetails?.vehicleType || shipment?.vehicleType || '';
  const reqQty = shipment?.shipmentDetails?.totalWeight
    ? `${shipment.shipmentDetails.totalWeight} kg`
    : shipment?.shipmentDetails?.totalVolume
      ? `${shipment.shipmentDetails.totalVolume} CFT`
      : '-';
  const placementDate = shipment?.shipmentDetails?.loadingDate
    ? new Date(shipment.shipmentDetails.loadingDate).toLocaleDateString()
    : shipment?.loadingDate
      ? new Date(shipment.loadingDate).toLocaleDateString()
      : shipment?.createdAt
        ? new Date(shipment.createdAt).toLocaleDateString()
        : 'N/A';

  // Filter and sort bids
  const filteredBids = Array.isArray(bids) ? bids.filter(bid => 
    String(bid.phone)?.toLowerCase().includes(search.toLowerCase()) ||
    bid.brokerName?.toLowerCase().includes(search.toLowerCase()) ||
    String(bid.amount)?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const sortedBids = [...filteredBids].sort((a, b) => {
    const amountA = parseFloat(a.amount) || 0;
    const amountB = parseFloat(b.amount) || 0;
    return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
  });

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getRankBadge = (index: number, amount: number, currentBid: any) => {
    // Always show rankings for the 3 lowest bids regardless of sort order
    const allBidAmounts = sortedBids.map(bid => parseFloat(bid.amount) || 0).sort((a, b) => a - b);
    const lowestThree = allBidAmounts.slice(0, 3);
    const currentAmount = parseFloat(currentBid.amount) || 0;
    
    // Check if current bid is one of the 3 lowest
    const rankIndex = lowestThree.indexOf(currentAmount);
    if (rankIndex === -1) return null;
    
    // Handle ties - if there are multiple bids with same amount, only show badge for first occurrence
    const sameAmountBids = sortedBids.filter(bid => parseFloat(bid.amount) === currentAmount);
    const isFirstOccurrence = sameAmountBids.indexOf(currentBid) === 0;
    if (!isFirstOccurrence) return null;
    
    const badges = [
      { rank: '1', color: 'from-yellow-400 to-yellow-600', textColor: 'text-yellow-900' },
      { rank: '2', color: 'from-gray-300 to-gray-500', textColor: 'text-gray-900' },
      { rank: '3', color: 'from-amber-600 to-amber-800', textColor: 'text-amber-100' }
    ];
    
    const badge = badges[rankIndex];
    return (
      <div className={`absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br ${badge.color} rounded-full flex items-center justify-center shadow-xl border-3 border-white text-lg font-black ${badge.textColor}`}>
        {badge.rank}
      </div>
    );
  };

  const getRowStyling = (bidId: string, bid: any) => {
    // If this bid is selected as winner, use special winner styling
    if (isBidSelectedWinner(bid)) {
      return "bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 shadow-lg transform scale-[1.02] transition-all duration-200";
    }
    
    // If this is a recently arrived bid, use special new bid styling
    if (recentBidIds.has(bidId)) {
      return "bg-gradient-to-r from-blue-50 to-indigo-100 border-2 border-blue-300 shadow-md animate-pulse transition-all duration-200";
    }
    
    return "hover:bg-blue-50 transition-all duration-200";
  };

  const handleSelectWinner = async (bidId: string, brokerName: string, amount: string) => {
    const selectedBid = bids.find(bid => getBidId(bid, bids.indexOf(bid)) === bidId);
    if (!selectedBid) {
      console.error('Selected bid not found');
      return;
    }

    setUpdatingBidId(bidId);

    try {
      console.log('🔄 Attempting to select winner:', selectedBid);
      
      const response = await fetch('/api/bid/winner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'select',
          docId: shipment._id,
          selectedWinner: {
            brokerName: selectedBid.brokerName,
            phone: selectedBid.phone,
            amount: selectedBid.amount
          },
          shipmentDetails: shipment.shipmentDetails,
          orderId: shipment.orderId
        }),
      });

      console.log('API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);

        if (data.success) {
          // Refresh the shipment data to get updated selected winners
          console.log('🔄 Refreshing shipment data...');
          const refreshRes = await fetch(`/api/selectedOwnerBrokers?id=${shipmentId}&timestamp=${Date.now()}`);
          const refreshedData = await refreshRes.json();
          if (refreshedData) {
            setShipment(refreshedData);
            console.log('✅ Shipment data refreshed successfully');
          }
          
          console.log(`✅ Winner selected successfully: ${brokerName} with bid ₹${amount}`);
          
        } else {
          console.error('❌ API returned success: false:', data.message);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API request failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Network error selecting winner:', error);
    } finally {
      setUpdatingBidId(null);
    }
  };

  const handleUnselectWinner = async (bidId: string) => {
    const winnerToRemove = bids.find(bid => getBidId(bid, bids.indexOf(bid)) === bidId);
    
    if (!winnerToRemove) {
      console.error('Winner to remove not found');
      return;
    }
    
    setUpdatingBidId(bidId);
    try {
      console.log('🔄 Attempting to unselect winner:', winnerToRemove);
      
      const response = await fetch('/api/bid/winner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unselect',
          docId: shipment._id,
          selectedWinner: {
            brokerName: winnerToRemove?.brokerName,
            phone: winnerToRemove?.phone,
            amount: winnerToRemove?.amount
          },
          shipmentDetails: shipment.shipmentDetails
        }),
      });

      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);

        if (data.success) {
          // Refresh the shipment data to get updated selected winners
          console.log('🔄 Refreshing shipment data...');
          const refreshRes = await fetch(`/api/selectedOwnerBrokers?id=${shipmentId}&timestamp=${Date.now()}`);
          const refreshedData = await refreshRes.json();
          if (refreshedData) {
            setShipment(refreshedData);
            console.log('✅ Shipment data refreshed successfully');
          }
          
          console.log(`✅ Winner unselected successfully: ${winnerToRemove.brokerName}`);
          
        } else {
          console.error('❌ API returned success: false:', data.message);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API request failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Network error unselecting winner:', error);
    } finally {
      setUpdatingBidId(null);
    }
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    setNewBidsCount(0); // Reset new bid counter on manual refresh
    setRecentBidIds(new Set()); // Clear recent bid highlights
    fetchLatestData(false, true);
  };

  // Handle opening add broker dialog
  const handleOpenAddBrokerDialog = () => {
    setIsAddBrokerDialogOpen(true);
  };

  // Handle closing add broker dialog
  const handleCloseAddBrokerDialog = () => {
    setIsAddBrokerDialogOpen(false);
    setSelectedBrokerIds([]);
  };

  // Handle broker selection from dropdown
  const handleBrokerSelect = (brokerIds: string[]) => {
    setSelectedBrokerIds(brokerIds);
  };

  // Handle opening extend bidding dialog
  const handleOpenExtendBiddingDialog = () => {
    setIsExtendBiddingDialogOpen(true);
  };

  // Handle closing extend bidding dialog
  const handleCloseExtendBiddingDialog = () => {
    setIsExtendBiddingDialogOpen(false);
  };

  // Handle successful extension
  const handleExtendSuccess = () => {
    // Refresh the data after successful extension
    fetchLatestData(false, true);
  };
  

  return (
    <>
      <div className="bg-gray-50 min-h-[250px]  w-full">
        <div className=" px-2 sm:px-4 w-full flex flex-col items-stretch">
          {/* Top Bar: Back Arrow, Auction Number, Bid Detail Button */} 
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button className="text-blue-600 hover:bg-blue-50 rounded-full p-1 mr-2" onClick={() => window.history.back()}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span className="text-lg font-semibold text-gray-800">Auction:- {shipment?.orderId}</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button 
                onClick={handleManualRefresh}
                disabled={isRefreshing || isPolling}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md ${
                  isRefreshing || isPolling
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
                }`}
              >
                <svg 
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
              
              {/* Add Broker Button */}
              <button 
                onClick={handleOpenAddBrokerDialog}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:scale-105"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Broker
              </button>
              
              {/* Extend Bidding Button */}
              <button 
                onClick={handleOpenExtendBiddingDialog}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg transform hover:scale-105"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Extend Bidding
              </button>
              
              {/* Last Refresh Time */}
              {lastRefreshTime && !isRefreshing && (
                <div className="text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Updated: {lastRefreshTime.toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Flex Top Info Section */}
          <div className="border border-gray-200 rounded-lg p-6 bg-white mb-4">
            <div className="flex flex-row flex-wrap items-start gap-8">
              {/* Order Info Block */}
              <div className="flex flex-col min-w-[180px]">
                <div className="text-xs text-gray-500">Order ID</div>
                <div className="font-semibold text-gray-800">{shipment?.orderId}</div>
                <div className="text-xs text-gray-500 mt-2">Req. Truck Type & Qty.</div>
                <div className="font-semibold text-gray-800">{reqTruckType} | {reqQty}</div>
              </div>

              {/* Pickup Block */}
              <div className="flex flex-col min-w-[140px]">
                <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                  <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
                  </span>
                  Pickup
                </div>
                <div className="font-semibold text-gray-800">{pickup}</div>
              </div>

              {/* Delivery Block */}
              <div className="flex flex-col min-w-[140px]">
                <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                  <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
                  </span>
                  Delivery
                </div>
                <div className="font-semibold text-gray-800">{delivery}</div>
                
              </div>

              {/* Placement Date & Ref Price */}
              <div className="flex flex-col items-end min-w-[200px] ml-auto">
                <div className="text-xs text-gray-500">Placement Date</div>
                <div className="text-lg font-bold text-gray-900 mb-2">{placementDate}</div>
              </div>
            </div>
          </div>

          {/* Remarks Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-700">Remarks: <span className="text-gray-500">{shipment.remark || 'N/A'}</span> <button className="ml-1 text-xs text-blue-600 hover:underline">✎</button></div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center mb-4 gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by broker name or phone or bid amount..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-black"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{sortedBids.length}</span> of <span className="font-semibold">{bids?.length}</span> bids
            </div>
          </div>

          {/* Bids Table Section */}
          <div className="overflow-hidden bg-white shadow-lg sm:rounded-lg border border-gray-200">
            <div className="px-6 py-5 sm:px-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <h3 className="text-xl font-bold leading-6 text-gray-900">Bidding Details</h3>
              <p className="mt-2 max-w-2xl text-sm text-gray-600">Current bids for this shipment auction</p>
              <div className="mt-3 flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Total Bids:</span>
                  <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                    {filteredBids.length}
                  </span>
                </div>

                <div className="text-sm">
                  <span className="font-medium text-gray-700">Selected Winners:</span>
                  <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    {shipment.selectedWinners?.length || 0}
                  </span>
                </div>

                {newBidsCount > 0 && (
                  <div className="text-sm">
                    <button 
                      onClick={acknowledgeNewBids}
                      className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold hover:bg-orange-200 transition-colors animate-pulse"
                    >
                      🆕 {newBidsCount} New Bid{newBidsCount > 1 ? 's' : ''}!
                    </button>
                  </div>
                )}

                {isPolling && (
                  <div className="text-sm flex items-center gap-1 text-blue-600">
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs">Refreshing...</span>
                  </div>
                )}

                {filteredBids.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Lowest Bid:</span>
                    <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      ₹ {Math.min(...filteredBids.map(bid => parseFloat(bid.amount) || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                
                {filteredBids.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Highest Bid:</span>
                    <span className="ml-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                      ₹ {Math.max(...filteredBids.map(bid => parseFloat(bid.amount) || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {bids?.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bids yet</h3>
                  <p className="text-gray-500">Be the first to place a bid on this shipment.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Bidder Information
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          Bid Amount
                          <button 
                            onClick={toggleSortOrder}
                            className="ml-1 p-1 hover:bg-gray-200 rounded transition-colors"
                            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                          >
                            {sortOrder === 'asc' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Bid Time
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Action
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100 overflow-y-auto">
                    {sortedBids.map((bid, idx) => {
                      const bidId = getBidId(bid, bids.indexOf(bid)); // Use original array index for stable ID
                      return (
                        <tr key={bidId} className={getRowStyling(bidId, bid)}>
                          <td className="px-6 py-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg relative">
                                {recentBidIds.has(bidId) && (
                                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center animate-bounce">
                                    <span className="text-white text-xs font-bold">NEW</span>
                                  </div>
                                )}
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {getRankBadge(idx, parseFloat(bid.amount) || 0, bid)}
                                {isBidSelectedWinner(bid) && (
                                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-base font-bold text-gray-900 flex items-center gap-2">
                                  {bid.brokerName || 'Unknown Broker'}
                                  {recentBidIds.has(bidId) && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full animate-pulse">
                                      🆕 NEW BID
                                    </span>
                                  )}
                                  {isBidSelectedWinner(bid) && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                      🏆 SELECTED WINNER
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {bid.phone || 'No phone'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {bidId} | Phone: {bid.phone} | Amount: ₹{bid.amount}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap text-center">
                            <div className="flex flex-col items-center">
                              <span className="px-4 py-2 inline-flex text-lg leading-5 font-bold rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-sm border border-green-200">
                                ₹ {parseFloat(bid.amount || 0).toLocaleString('en-IN')}
                              </span>
                              <span className="text-xs text-gray-500 mt-1">per MT</span>
                            </div>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap text-center">
                            <div className="flex flex-col items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {bid.timestamp ? new Date(bid.timestamp).toLocaleDateString('en-IN') : 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {bid.timestamp ? new Date(bid.timestamp).toLocaleTimeString('en-IN', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                }) : ''}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap text-center">
                            {isBidSelectedWinner(bid) ? (
                              <div className="flex flex-col items-center gap-2">
                                <span className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm shadow-lg flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  WINNER
                                </span>
                                <button
                                  onClick={() => handleUnselectWinner(bidId)}
                                  disabled={updatingBidId === bidId}
                                  className={`px-3 py-1 text-white rounded text-xs transition-colors flex items-center gap-1 ${
                                    updatingBidId === bidId
                                      ? 'bg-gray-400 cursor-not-allowed' 
                                      : 'bg-gray-500 hover:bg-gray-600'
                                  }`}
                                >
                                  {updatingBidId === bidId ? (
                                    <>
                                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Updating...
                                    </>
                                  ) : (
                                    'Unselect'
                                  )}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleSelectWinner(bidId, bid.brokerName || 'Unknown', bid.amount || '0')}
                                disabled={updatingBidId === bidId}
                                className={`px-4 py-2 text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md flex items-center gap-2 mx-auto ${
                                  updatingBidId === bidId
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
                                }`}
                              >
                                {updatingBidId === bidId ? (
                                  <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Selecting...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Select Winner
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Selected Owners and Brokers Tabbed Component */}
          <div className="mt-8">
            <div className="overflow-hidden bg-white shadow-lg sm:rounded-lg border border-gray-200">
              {/* Tabs Header */}
              <div className="flex border-b border-gray-200">
                <button 
                  onClick={() => setActiveTab('brokers')}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'brokers' 
                      ? 'border-b-2 border-blue-500 text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Selected Brokers {shipment.selectedBrokers?.length ? `(${shipment.selectedBrokers.length})` : '(0)'}
                </button>
                <button 
                  onClick={() => setActiveTab('owners')}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'owners' 
                      ? 'border-b-2 border-blue-500 text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Selected Owners {shipment.selectedOwners?.length ? `(${shipment.selectedOwners.length})` : '(0)'}
                </button>
              </div>
              
              {/* Tab Content with Vertical Scroll */}
              <div className="max-h-72 overflow-y-auto">
                {activeTab === 'brokers' && (
                  <div className="overflow-x-auto">
                    {shipment.selectedBrokers && shipment.selectedBrokers.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Phone</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">From</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">To</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Vehicle Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {shipment.selectedBrokers.map((broker: any, index: number) => (
                            <tr key={`broker-${index}`} className="hover:bg-blue-50 transition-all duration-200">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{broker.name || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{broker.phone || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{broker.from || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{broker.to || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{broker.vehicleType || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {broker.amounts ? `₹ ${broker.amounts.toLocaleString('en-IN')}` : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">No brokers selected</div>
                    )}
                  </div>
                )}

                {activeTab === 'owners' && (
                  <div className="overflow-x-auto">
                    {shipment.selectedOwners && shipment.selectedOwners.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Phone</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">From</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">To</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Vehicle Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {shipment.selectedOwners.map((owner: any, index: number) => (
                            <tr key={`owner-${index}`} className="hover:bg-blue-50 transition-all duration-200">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{owner.name || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{owner.phone || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{owner.from || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{owner.to || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{owner.vehicleType || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {owner.amounts ? `₹ ${owner.amounts.toLocaleString('en-IN')}` : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">No owners selected</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AddBrokerDialog
        isOpen={isAddBrokerDialogOpen}
        onClose={handleCloseAddBrokerDialog}
        selectedBrokerIds={selectedBrokerIds}
        onBrokerSelect={handleBrokerSelect}
        shipment={shipment}
        handleCloseAddBrokerDialog={handleCloseAddBrokerDialog}
      />

      <ExtendBiddingDialog
        isOpen={isExtendBiddingDialogOpen}
        onClose={handleCloseExtendBiddingDialog}
        shipment={shipment}
        onSuccess={handleExtendSuccess}
      />
    </>
  );
}

export default function BiddingDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BiddingDetailsContent />
    </Suspense>
  );
}
