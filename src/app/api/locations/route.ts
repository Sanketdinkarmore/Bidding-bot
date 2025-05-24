import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Fetch data from the 'Location and vehicle type' collection
    const locationAndVehicleData = await db.collection('Location and vehicle type').find({}).toArray();
    
    // Extract locations and vehicle types from the fetched data
    const locations = locationAndVehicleData.map(item => item['CITIES NAME']).filter((value, index, self) => self.indexOf(value) === index);
    const vehicleTypes = locationAndVehicleData.map(item => item['VEHICLE TYPE']).filter((value, index, self) => self.indexOf(value) === index);
    
    return NextResponse.json({
      locations: locations,
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