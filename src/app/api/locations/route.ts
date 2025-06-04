import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Fetch locations from the 'Location and vehicle type' collection
    const locationAndVehicleData = await db.collection('Location and vehicle type').find({}).toArray();

    // Extract unique locations and vehicle types from the fetched data
    // Map locations to include id and name
    // const locations = Array.from(new Set(locationAndVehicleData.map(item => JSON.stringify({
    //   id: item._id, // Include the unique MongoDB _id
    //   name: item['CITIES NAME']
    // })).filter(item => JSON.parse(item).name))).map(item => JSON.parse(item));

    const locations = locationAndVehicleData.map(item => ({
      id: item._id,
      name: item['CITIES NAME'],
      zone: item['Zone']
    }));

    const uniqueLocations = locations.filter((location, index, self) =>
      index === self.findIndex((t) => t.name === location.name)
    );

    const vehicleTypes = Array.from(new Set(locationAndVehicleData.map(item => item['VEHICLE TYPE']).filter(name => name)));
    
    return NextResponse.json({
      locations: uniqueLocations,
      vehicleTypes: vehicleTypes
    });
  } catch (error) {
    console.error('Error fetching locations and vehicle types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations and vehicle types' },
      { status: 500 }
    );
  }
} 