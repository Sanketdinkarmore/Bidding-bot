import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('bidding-bot');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      const doc = await db.collection('selectedOwnerBrokers').findOne({ _id: new ObjectId(id) });
      return NextResponse.json(doc);
    } else {
      const docs = await db.collection('selectedOwnerBrokers').find({}).toArray();
      return NextResponse.json(docs);
    }
  } catch (error) {
    console.error('Error fetching selectedOwnerBrokers:', error);
    return NextResponse.json({ error: 'Failed to fetch selectedOwnerBrokers' }, { status: 500 });
  }
} 