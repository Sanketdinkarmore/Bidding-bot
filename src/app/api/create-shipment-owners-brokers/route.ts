import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromCity = searchParams.get('fromCity');
    const toCity = searchParams.get('toCity');
    const vehicleType = searchParams.get('vehicleType');
    const zone = searchParams.get('zone');

    if (!fromCity || !toCity || !vehicleType) {
      return NextResponse.json(
        { error: 'Missing required parameters: fromCity, toCity, vehicleType' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('bidding-bot');

    // Fetch brokers from the 'broker' collection
    const brokerCollection = db.collection('broker');

    let matchingBrokersData: any[] = [];

    if (zone) {
      matchingBrokersData = await brokerCollection.find({
        'Challan Destination City': toCity,
        'FTLType': vehicleType,
        'Group': zone
      }).toArray();
    } else {
      matchingBrokersData = await brokerCollection.find({
        'Challan Origin City': fromCity,
        'Challan Destination City': toCity,
        'FTLType': vehicleType,
      }).toArray();
    }

    const brokers = matchingBrokersData.map(item => ({
      id: item._id, 
      name: item['Broker Name'],
      amount: item['Challan Amount'],
      phone: item['Broker Mobile'],
      from: item['Challan Origin City'],
      to: item['Challan Destination City'],
      vehicleType: item['FTLType']
    })).filter(item => item.name);

    // Fetch owners from the 'owner' collection
    const ownerCollection = db.collection('owner');
    const matchingOwnersData = await ownerCollection.find({
      'Challan Origin City': fromCity,
      'Challan Destination City': toCity,
      'FTLType': vehicleType,
    }, {projection: { _id: 1, "Owner Saathi Name": 1, "Owner Saathi Mobile": 1, "Challan Amount": 1}}).toArray();
    
    const owners = matchingOwnersData.map(item => ({
      id: item._id,
      name: item['Owner Saathi Name'],
      amount: item['Challan Amount'],
      phone: item['Owner Saathi Mobile']
    })).filter(item => item.name);

    // Calculate challan averages for unique owners/brokers
    
    // For brokers - group by broker name and take first amount for each unique broker
    const uniqueBrokers = new Map();

    for (const broker of brokers) {
      if (uniqueBrokers.has(broker.name)) {
        uniqueBrokers.get(broker.name).amounts.push(broker.amount);
      } else {
        uniqueBrokers.set(broker.name, {
          name: broker.name,
          amounts: [broker.amount],
          phone: broker.phone,
          id: broker.id,
          from: broker.from,
          to: broker.to,
          vehicleType: broker.vehicleType
        });
      }
    }

    const uniqueOwners = new Map();

    for (const owner of owners) {
      if (uniqueOwners.has(owner.name)) {
        uniqueOwners.get(owner.name).amounts.push(owner.amount);
      } else {
        uniqueOwners.set(owner.name, {
          name: owner.name,
          amounts: [owner.amount],
          phone: owner.phone,
          id: owner.id
        });
      }
    }

    return NextResponse.json({
      owners: Array.from(uniqueOwners.values()).map(owner => ({...owner, amounts: getAverage(owner.amounts) })),
      brokers: Array.from(uniqueBrokers.values()).map(broker => ({...broker, amounts: getAverage(broker.amounts) })),
    });
  } catch (error) {
    console.error('Error fetching owners and brokers from bidding_info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owners and brokers from bidding_info' },
      { status: 500 }
    );
  }
} 

function getAverage(arr: number[]) {
  if (!arr.length) return 0;
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return sum / arr.length;
}