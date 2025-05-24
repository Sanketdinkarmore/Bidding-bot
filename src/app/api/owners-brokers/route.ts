import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromCity = searchParams.get('fromCity');
    const toCity = searchParams.get('toCity');
    const vehicleType = searchParams.get('vehicleType');

    if (!fromCity || !toCity || !vehicleType) {
      return NextResponse.json(
        { error: 'Missing required parameters: fromCity, toCity, vehicleType' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Fetch brokers from the 'broker' collection
    const brokerCollection = db.collection('broker');
    const matchingBrokersData = await brokerCollection.find({
      'Challan Origin City': fromCity,
      'Challan Destination City': toCity,
      'FTLType': vehicleType,
    }).toArray();

    // Map broker data to include id, name, and challan amount
    const brokers = matchingBrokersData.map(item => ({
      id: item._id, // Include the unique MongoDB _id
      name: item['Broker Name'],
      amount: item['Challan Amount'] // Assuming 'Challan Amount' is the correct field name
    })).filter(item => item.name);

    // Fetch owners from the 'owner' collection (assuming similar fields)
    const ownerCollection = db.collection('owner');
    const matchingOwnersData = await ownerCollection.find({
      'Challan Origin City': fromCity,
      'Challan Destination City': toCity,
      'FTLType': vehicleType,
    }).toArray();

    // Map owner data to include id, name, and challan amount
    const owners = matchingOwnersData.map(item => ({
      id: item._id, // Include the unique MongoDB _id
      name: item['Owner Saathi Name'], // Using the confirmed field name
      amount: item['Challan Amount'] // Assuming 'Challan Amount' is also in owner collection
    })).filter(item => item.name);

    return NextResponse.json({
      owners,
      brokers,
    });

  } catch (error) {
    console.error('Error fetching owners and brokers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owners and brokers' },
      { status: 500 }
    );
  }
} 