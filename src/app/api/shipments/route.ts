import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('bidding-bot'); // Your database name from .env.local
    const body = await request.json();
    
    // Insert data into the 'bidding_info' collection
    const result = await db.collection('bidding_info').insertOne(body);

    if (!result.acknowledged) {
      throw new Error('Failed to insert bidding info');
    }

    // Optionally fetch and return the inserted document
    const insertedDocument = await db.collection('bidding_info').findOne({ _id: new ObjectId(result.insertedId) });

    return NextResponse.json(insertedDocument, { status: 201 });
  } catch (error) {
    console.error('Error creating bidding info:', error);
    return NextResponse.json({ error: 'Failed to create bidding info' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('bidding-bot'); // Your database name from .env.local
    
    // Fetch data from the 'bidding_info' collection
    const biddingInfo = await db.collection('bidding_info').find({}).toArray();
    
    return NextResponse.json(biddingInfo);
  } catch (error) {
    console.error('Error fetching bidding info:', error);
    return NextResponse.json({ error: 'Failed to fetch bidding info' }, { status: 500 });
  }
} 