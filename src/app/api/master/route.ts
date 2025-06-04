import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

interface MasterDataDocument {
  _id: ObjectId;
  "Challan No": string;
  "Vehicle Dispatch Time Stamp": string;
  "Route Type": string;
  "Placement Source": string;
  "Vehicle No": string;
  "FTLType": string;
  "Challan Origin Control Branch": string;
  "Challan Destination Control Branch": string;
  "Challan Origin City": string;
  "Challan Destination City": string;
  "Challan Total Distance": number;
  "Challan Amount": number;
  "Broker Name"?: string;
  "Broker Mobile"?: number;
  "Broker Pan No"?: string;
  "Owner Saathi Name"?: string;
  "Owner Saathi Mobile"?: number;
  "Owner Pan No"?: string;
  "Logical Vendor": string;
  "GCNOs": string;
  type: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const search = searchParams.get('search') || '';
    const destinationCity = searchParams.get('destinationCity') || '';
    const vehicleType = searchParams.get('vehicleType') || '';
    const originCity = searchParams.get('originCity') || '';
    const type = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Connect to database
    const client = await clientPromise;
    const db = client.db('bidding-bot'); // Replace with your actual database name
    const brokerCollection = db.collection('broker');
    const ownerCollection = db.collection('owner');

    // Build filter query
    const filter: any = {};

    // Search filter - search across multiple fields
    if (search) {
      filter.$or = [
        { "Challan No": { $regex: search, $options: 'i' } },
        { "Vehicle No": { $regex: search, $options: 'i' } },
        { "GCNOs": { $regex: search, $options: 'i' } },
        { "Broker Name": { $regex: search, $options: 'i' } },
        { "Owner Saathi Name": { $regex: search, $options: 'i' } }
      ];
    }

    // Destination City filter
    if (destinationCity) {
      filter["Challan Destination City"] = destinationCity;
    }

    // Vehicle Type filter (FTLType)
    if (vehicleType) {
      filter["FTLType"] = vehicleType;
    }

    // Origin City filter
    if (originCity) {
      filter["Challan Origin City"] = originCity;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination from both collections
    const brokerTotal = await brokerCollection.countDocuments(filter);
    const ownerTotal = await ownerCollection.countDocuments(filter);
    const total = brokerTotal + ownerTotal;
    const totalPages = Math.ceil(total / limit);

    // Determine how many documents to fetch from each collection
    let brokerData: MasterDataDocument[] = [];
    let ownerData: MasterDataDocument[] = [];
    
    // Filter by type if specified
    if (type === 'broker') {
      // Only fetch broker data
      brokerData = await brokerCollection
        .find(filter)
        .skip(skip)
        .limit(limit)
        .toArray() as MasterDataDocument[];
    } else if (type === 'owner') {
      // Only fetch owner data
      ownerData = await ownerCollection
        .find(filter)
        .skip(skip)
        .limit(limit)
        .toArray() as MasterDataDocument[];
    } else {
      // Fetch both (default behavior)
      const halfLimit = Math.ceil(limit / 2);
      
      brokerData = await brokerCollection
        .find(filter)
        .skip(skip < brokerTotal ? skip : brokerTotal)
        .limit(skip < brokerTotal ? (brokerTotal - skip < halfLimit ? brokerTotal - skip : halfLimit) : 0)
        .toArray() as MasterDataDocument[];
      
      const remainingLimit = limit - brokerData.length;
      const ownerSkip = Math.max(0, skip - brokerTotal);
      
      ownerData = await ownerCollection
        .find(filter)
        .skip(ownerSkip)
        .limit(remainingLimit)
        .toArray() as MasterDataDocument[];
    }

    // Transform broker data for frontend
    const transformedBrokerData = brokerData.map((item) => ({
      id: item._id.toString(),
      routeType: item["Route Type"],
      ftlType: item["FTLType"],
      originBranch: item["Challan Origin Control Branch"],
      destinationBranch: item["Challan Destination Control Branch"],
      originCity: item["Challan Origin City"],
      destinationCity: item["Challan Destination City"],
      distance: item["Challan Total Distance"],
      amount: item["Challan Amount"],
      name: item["Broker Name"],
      number: item["Broker Mobile"],
      type: "broker"
    }));

    // Transform owner data for frontend
    const transformedOwnerData = ownerData.map((item) => ({
      id: item._id.toString(),
      routeType: item["Route Type"],
      ftlType: item["FTLType"],
      originBranch: item["Challan Origin Control Branch"],
      destinationBranch: item["Challan Destination Control Branch"],
      originCity: item["Challan Origin City"],
      destinationCity: item["Challan Destination City"],
      distance: item["Challan Total Distance"],
      amount: item["Challan Amount"],
      name: item["Owner Saathi Name"],
      number: item["Owner Saathi Mobile"],
      type: "owner"
    }));

    // Merge the data
    const transformedData = [...transformedBrokerData, ...transformedOwnerData];

    // Return paginated response
    return NextResponse.json({
      data: transformedData,
      total,
      page,
      limit,
      totalPages,
      success: true
    });

  } catch (error) {
    console.error('Error fetching master data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch master data',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}