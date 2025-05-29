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
    const db = client.db('bidding-bot');

    // Fetch from bidding_info for create shipment flow
    const biddingInfo = await db.collection('bidding_info').find({
      'shipmentDetails.fromCity': fromCity,
      'shipmentDetails.toCity': toCity,
      'shipmentDetails.vehicleType': vehicleType,
    }).toArray();

    // Extract unique owners and brokers from the matching bidding_info documents
    let owners: any[] = [];
    let brokers: any[] = [];
    biddingInfo.forEach(doc => {
      if (doc.selectedOwners && Array.isArray(doc.selectedOwners)) {
        owners.push(...doc.selectedOwners);
      }
      if (doc.selectedBrokers && Array.isArray(doc.selectedBrokers)) {
        brokers.push(...doc.selectedBrokers);
      }
    });
    // Remove duplicates by id
    const uniqueOwners = Object.values(
      owners.reduce((acc, owner) => {
        if (owner && owner.id) acc[owner.id] = owner;
        return acc;
      }, {})
    );
    const uniqueBrokers = Object.values(
      brokers.reduce((acc, broker) => {
        if (broker && broker.id) acc[broker.id] = broker;
        return acc;
      }, {})
    );

    // Fallback: If no owners or brokers found, fetch from owner and broker collections
    if (uniqueOwners.length === 0 && uniqueBrokers.length === 0) {
      // Fetch brokers from the 'broker' collection
      const brokerCollection = db.collection('broker');
      const matchingBrokersData = await brokerCollection.find({
        'Challan Origin City': fromCity,
        'Challan Destination City': toCity,
        'FTLType': vehicleType,
      }).toArray();
      const fallbackBrokers = matchingBrokersData.map(item => ({
        id: item._id,
        name: item['Broker Name'],
        amount: item['Challan Amount'],
        phone: item['Broker Mobile']
      })).filter(item => item.name);

      // Fetch owners from the 'owner' collection
      const ownerCollection = db.collection('owner');
      const matchingOwnersData = await ownerCollection.find({
        'Challan Origin City': fromCity,
        'Challan Destination City': toCity,
        'FTLType': vehicleType,
      }).toArray();
      const fallbackOwners = matchingOwnersData.map(item => ({
        id: item._id,
        name: item['Owner Saathi Name'],
        amount: item['Challan Amount'],
        phone: item['Owner Saathi Mobile']
      })).filter(item => item.name);

      return NextResponse.json({
        owners: fallbackOwners,
        brokers: fallbackBrokers,
      });
    }

    return NextResponse.json({
      owners: uniqueOwners,
      brokers: uniqueBrokers,
    });
  } catch (error) {
    console.error('Error fetching owners and brokers from bidding_info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owners and brokers from bidding_info' },
      { status: 500 }
    );
  }
} 