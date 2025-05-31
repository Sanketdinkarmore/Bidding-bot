import { NextRequest, NextResponse } from "next/server";

import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fromCity = searchParams.get("fromCity");
        const toCity = searchParams.get("toCity");
        const vehicleType = searchParams.get("vehicleType");

        const client = await clientPromise;
        const db = client.db('bidding-bot');

        // Fetch brokers from the 'broker' collection
        const brokerCollection = db.collection('broker');

        const matchingBrokersData = await brokerCollection.find({
            'Challan Origin City': fromCity,
            'Challan Destination City': toCity,
            'FTLType': vehicleType,
        }, {projection: { _id: 1, "Broker Name": 1, "Broker Mobile": 1, "Challan Amount": 1}}).toArray();

        const brokers = matchingBrokersData.map(item => ({
            id: item._id,
            name: item['Broker Name'],
            amount: item['Challan Amount'],
            phone: item['Broker Mobile']
        })).filter(item => item.name);


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
                id: broker.id
                });
            }
        }
        
        return NextResponse.json(Array.from(uniqueBrokers.values()).map(broker => ({...broker, amounts: getAverage(broker.amounts) })));
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch brokers" }, { status: 500 });
    }
}

function getAverage(arr: number[]) {
  if (!arr.length) return 0;
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return sum / arr.length;
}