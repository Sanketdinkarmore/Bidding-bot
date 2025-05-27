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
// Mock bids data
const mockBids = [
  {
    id: 1,
    bidder: 'DILIP KUMAR HARIRAM GUPTA',
    phone: '0020506111',
    whatsapp: true,
    rating: 4,
    vehicles: 4,
    bidAmount: 4000,
    bidDiff: -3999,
    bidTime: '18 Mar 02:29 PM',
    primaryBid: 4000,
    secondaryBid: null,
    vehicleNo: '-',
    rank: 1,
    winner: true,
  },
  {
    id: 2,
    bidder: 'RAJESH KUMAR',
    phone: '0020546986',
    whatsapp: true,
    rating: 4,
    vehicles: 4,
    bidAmount: 4050,
    bidDiff: -4049,
    bidTime: '18 Mar 01:14 PM',
    primaryBid: 4050,
    secondaryBid: null,
    vehicleNo: '-',
    rank: 2,
    winner: true,
  },
  {
    id: 3,
    bidder: 'NAGPUR BIHAR ROADWAYS KRISHNA KUMAR TIWARI',
    phone: '0020545896',
    whatsapp: true,
    rating: 3,
    vehicles: 1,
    bidAmount: 4400,
    bidDiff: -4399,
    bidTime: '18 Mar 01:00 PM',
    primaryBid: 4400,
    secondaryBid: null,
    vehicleNo: '-',
    rank: 3,
    winner: false,
  },
];

export default function BiddingDetailsPage() {
  const searchParams = useSearchParams();
  const shipmentId = searchParams.get("id");
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchShipment = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/shipments");
        if (!res.ok) throw new Error("Failed to fetch shipments");
        const data: ShipmentData[] = await res.json();
        const found = data.find((s) => s._id === shipmentId);
        if (!found) throw new Error("Shipment not found");
        setShipment(found);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    if (shipmentId) fetchShipment();
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
              <div className="font-semibold text-gray-800">{shipment.pickupLocation || shipment.selectFrom}</div>
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
              <div className="font-semibold text-gray-800">{shipment.dropLocation || shipment.selectTo}</div>
              <div className="text-xs text-gray-400">04PANA</div>
              <div className="text-xs text-gray-500 mt-2">Req. Truck Type & Qty.</div>
              <div className="font-semibold text-gray-800">{shipment.vehicleType} | {shipment.totalWeight || "-"} kg</div>
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
              <div className="text-lg font-bold text-gray-900 mb-2">{new Date(shipment.loadingDate).toLocaleDateString()}</div>
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
        <div className="flex items-center mb-2">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm w-64"
          />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">Vehicletype</span>
            <button className="border rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">▼</button>
          </div>
        </div>

        {/* Section Header for Vehicle Type */}
        <div className="bg-gray-100 px-3 py-2 rounded-t text-xs font-semibold text-gray-700 border border-b-0 border-gray-200">TRAILER MULTI AXLE</div>

        {/* Bids Table Section */}
        <div className="overflow-x-auto rounded-b-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Bidder</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Rating</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase">No. of Vehicles</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Bid Amount</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Primary Bid</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Vehicle No</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Rank</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Winner</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {mockBids.filter(bid => bid.bidder.toLowerCase().includes(search.toLowerCase())).map((bid) => (
                <tr key={bid.id} className={bid.winner ? 'bg-green-50' : ''}>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{bid.bidder}</span>
                        {bid.whatsapp && (
                          <span title="WhatsApp" className="text-green-500">
                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20.52 3.48A12.07 12.07 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.19-1.62A12.13 12.13 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.23-3.48-8.52zM12 22c-1.77 0-3.5-.46-5.01-1.33l-.36-.21-3.68.97.98-3.59-.23-.37A9.94 9.94 0 0 1 2 12C2 6.48 6.48 2 12 2c2.54 0 4.93.99 6.73 2.77A9.93 9.93 0 0 1 22 12c0 5.52-4.48 10-10 10zm5.2-7.6c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.28.7.9.86 1.08.16.18.32.2.6.07.28-.14-1.18-.44-2.25-1.41-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.62-.47-.16-.01-.36-.01-.56-.01-.19 0-.5.07-.76.34-.26.27-1 1-.99 2.43.01 1.43 1.03 2.81 1.18 3 .15.19 2.03 3.1 4.93 4.23.69.3 1.23.48 1.65.61.69.22 1.32.19 1.81.12.55-.08 1.65-.67 1.89-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.19-.53-.33z"/></svg>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>{bid.phone}</span>
                        <span className="ml-2">{bid.secondaryBid ? 'Secondary' : ''}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">{bid.rating}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">{bid.vehicles}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">
                    <span className="font-semibold text-gray-800">₹ {bid.bidAmount}</span>
                    <span className="text-xs text-red-500 ml-1">({bid.bidDiff})</span>
                    <div className="text-xs text-gray-500">({bid.bidTime})</div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">₹ {bid.primaryBid}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">{bid.vehicleNo}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 bg-white font-bold text-blue-700">{bid.rank}</span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">
                    {bid.winner && <span className="text-green-600 font-bold">WINNER</span>}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">
                    <button className="text-gray-400 hover:text-gray-600"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"/><circle cx="19.5" cy="12" r="1.5"/><circle cx="4.5" cy="12" r="1.5"/></svg></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 