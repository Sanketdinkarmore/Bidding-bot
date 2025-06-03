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
  "Broker Name": string;
  "Broker Mobile": number;
  "Broker Pan No": string;
  "Logical Vendor": string;
  "GCNOs": string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const search = searchParams.get('search') || '';
    const destinationCity = searchParams.get('destinationCity') || '';
    const vehicleType = searchParams.get('vehicleType') || '';
    const originCity = searchParams.get('originCity') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Connect to database
    const client = await clientPromise;
    const db = client.db('bidding-bot'); // Replace with your actual database name
    const collection = db.collection('broker'); // Replace with your actual collection name

    // Build filter query
    const filter: any = {};

    // Search filter - search across multiple fields
    if (search) {
      filter.$or = [
        { "Challan No": { $regex: search, $options: 'i' } },
        { "Vehicle No": { $regex: search, $options: 'i' } },
        { "Broker Name": { $regex: search, $options: 'i' } },
        { "GCNOs": { $regex: search, $options: 'i' } },
        { "Broker Pan No": { $regex: search, $options: 'i' } }
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

    // Get total count for pagination
    const total = await collection.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Fetch paginated data
    const data = await collection
      .find(filter)
      .skip(skip)
      .limit(limit)
      .toArray() as MasterDataDocument[];

    // Transform data for frontend
    const transformedData = data.map((item) => ({
      id: item._id.toString(),
      challanNo: item["Challan No"],
      dispatchTime: item["Vehicle Dispatch Time Stamp"],
      routeType: item["Route Type"],
      placementSource: item["Placement Source"],
      vehicleNo: item["Vehicle No"],
      ftlType: item["FTLType"],
      originBranch: item["Challan Origin Control Branch"],
      destinationBranch: item["Challan Destination Control Branch"],
      originCity: item["Challan Origin City"],
      destinationCity: item["Challan Destination City"],
      distance: item["Challan Total Distance"],
      amount: item["Challan Amount"],
      brokerName: item["Broker Name"],
      brokerMobile: item["Broker Mobile"],
      brokerPan: item["Broker Pan No"],
      logicalVendor: item["Logical Vendor"],
      gcnos: item["GCNOs"]
    }));

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