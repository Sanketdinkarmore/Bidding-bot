"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface ShipmentData {
  _id: string;
  numberOfPackages: number;
  loadingDate: string;
  loadingTime: string;
  pickupLocation: string;
  selectFrom: string;
  selectTo: string;
  vehicleType: string;
  totalWeight?: number;
  totalVolume?: number;
  dropLocation: string;
  remark?: string;
  createdAt: string;
  customerName?: string;
  material?: string;
  minimumBids?: string;
  bidToleranceAmount?: string;
  refPrice?: string;
  orderInfo?: string;
}

export default function BiddingDetailsPage() {
  const searchParams = useSearchParams();
  const shipmentId = searchParams.get("id");
  const [shipment, setShipment] = useState<any | null>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchShipmentAndBids = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch everything from selectedOwnerBrokers by _id
        const res = await fetch(`/api/selectedOwnerBrokers?id=${shipmentId}`);
        const data = await res.json();
        if (!data) {
          setError("Shipment not found");
          setLoading(false);
          return;
        }
        setShipment(data); // Use for upper container
        setBids(data.bids || []); // Use for bids table
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    if (shipmentId) fetchShipmentAndBids();
  }, [shipmentId]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-[250px] bg-gray-50 py-10">Loading...</div>;
  }
  if (error || !shipment) {
    return <div className="flex justify-center items-center min-h-[250px] bg-gray-50 py-10 text-red-600">{error || "Shipment not found"}</div>;
  }

  // Mock extra fields for top section
  const customerName = shipment.customerName || "HINDUSTAN PETROLEUM CORPORATION LIMITED";
  const material = shipment.material || "BITUMEN VG 30";
  const minimumBids = shipment.minimumBids || "5 (3)";
  const bidToleranceAmount = shipment.bidToleranceAmount || "₹ 500";
  const refPrice = shipment.refPrice || "REF. PRICE ₹ 1 perMT";
  const orderInfo = shipment.orderInfo || "1 Order, 8 Loads";

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

  return (
    <div className="bg-gray-50 min-h-[250px]  w-full">
      <div className=" px-2 sm:px-4 w-full flex flex-col items-stretch">
        {/* Top Bar: Back Arrow, Auction Number, Bid Detail Button */} 
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button className="text-blue-600 hover:bg-blue-50 rounded-full p-1 mr-2" onClick={() => window.history.back()}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span className="text-lg font-semibold text-gray-800">Auction:- {shipment._id}</span>
          </div>
          <button className="border border-blue-500 text-blue-600 font-semibold rounded px-4 py-1 hover:bg-blue-50">Bid Detail <svg className="inline ml-1" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg></button>
        </div>

        {/* Flex Top Info Section */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white mb-4">
          <div className="flex flex-row flex-wrap items-start gap-8">
            {/* Order Info Block */}
            <div className="flex flex-col min-w-[180px]">
              <div className="text-xs text-gray-500">Order ID</div>
              <div className="font-semibold text-gray-800">{shipment._id}</div>
              <div className="text-xs text-gray-500 mt-2">Customer Name</div>
              <div className="font-semibold text-gray-800">{customerName}</div>
              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                Order Info <a href="#" className="text-blue-600 hover:underline text-xs ml-1">Show detail</a>
              </div>
              <div className="text-gray-700 text-xs">{orderInfo}</div>
            </div>
            {/* Pickup Block */}
            <div className="flex flex-col min-w-[140px]">
              <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                <span className="inline-block w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
                </span>
                Pickup
              </div>
              <div className="font-semibold text-gray-800">{pickup}</div>
              <div className="text-xs text-gray-400">13KHLP</div>
              <div className="text-xs text-gray-500 mt-2">Material</div>
              <div className="font-semibold text-gray-800">{material}</div>
            </div>
            {/* Delivery Block */}
            <div className="flex flex-col min-w-[140px]">
              <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                <span className="inline-block w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
                </span>
                Delivery
              </div>
              <div className="font-semibold text-gray-800">{delivery}</div>
              <div className="text-xs text-gray-400">04PANA</div>
              <div className="text-xs text-gray-500 mt-2">Req. Truck Type & Qty.</div>
              <div className="font-semibold text-gray-800">{reqTruckType} | {reqQty}</div>
            </div>
            {/* Minimum Bids & Bid Tolerance */}
            <div className="flex flex-col min-w-[140px]">
              <div className="text-xs text-gray-500">Minimum bids (With price)</div>
              <div className="font-semibold text-gray-800">{minimumBids}</div>
              <div className="text-xs text-gray-500 mt-2">Bid Tolerance Amount</div>
              <input type="text" value={bidToleranceAmount} readOnly className="border border-gray-300 rounded px-2 py-1 w-24 text-sm mt-1" />
            </div>
            {/* Placement Date & Ref Price */}
            <div className="flex flex-col items-end min-w-[200px] ml-auto">
              <div className="text-xs text-gray-500">Placement Date</div>
              <div className="text-lg font-bold text-gray-900 mb-2">{placementDate}</div>
              <div className="inline-block mt-1 px-3 py-1 bg-blue-500 text-white rounded font-semibold text-sm shadow-sm">
                {refPrice}
              </div>
              <div className="text-xs text-gray-400 mt-2">| 290 / 290.00 MT</div>
            </div>
          </div>
        </div>

        {/* Remarks Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-700">Remarks: <span className="text-gray-500">{shipment.remark || 'N/A'}</span> <button className="ml-1 text-xs text-blue-600 hover:underline">✎</button></div>
          <div className="text-xs text-blue-600 cursor-pointer hover:underline">View Term</div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center mb-2 ">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm w-64 text-gray-800"
          />
          {/* <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">Vehicletype</span>
            <button className="border rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">▼</button>
          </div>*/}
        </div> 

        {/* Section Header for Vehicle Type */}
        {/* <div className="bg-gray-100 px-3 py-2 rounded-t text-xs font-semibold text-gray-700 border border-b-0 border-gray-200">TRAILER MULTI AXLE</div> */}

        {/* Bids Table Section */}
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Bidding Details</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Current bids for this shipment.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bidder Phone
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bids.map((bid, idx) => (
                  <tr key={bid._id || idx} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{bid.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        ₹ {bid.amount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {bid.timestamp ? new Date(bid.timestamp).toLocaleString() : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
