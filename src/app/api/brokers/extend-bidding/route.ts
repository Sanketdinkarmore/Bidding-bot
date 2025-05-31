import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { shipmentId, newClosingDateTime } = body;

        if (!shipmentId || !newClosingDateTime) {
        return NextResponse.json({ error: 'Shipment ID and new closing date are required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('bidding-bot');
        const collection = db.collection('selectedOwnerBrokers');

        const result = await collection.updateOne(
            { _id: new ObjectId(shipmentId) },
            { $set: { "shipmentDetails.bidClosingDateTime": new Date(newClosingDateTime) } }
        );

        if (result.modifiedCount > 0) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Failed to extend bidding time' }, { status: 500 });
        }
    } catch (error) {
    console.error('Error updating bidding time:', error);

    return NextResponse.json(
      { 
        error: 'Failed to extend bidding time',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    }
}
