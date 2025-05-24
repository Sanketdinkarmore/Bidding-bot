import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('bidding-bot'); // Replace with your database name
    const users = await db.collection('users').find({}).toArray();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('bidding-bot'); // Replace with your database name
    const body = await request.json();
    
    const result = await db.collection('users').insertOne(body);

    if (!result.acknowledged) {
      throw new Error('Failed to insert user');
    }

    const insertedUser = await db.collection('users').findOne({ _id: new ObjectId(result.insertedId) });

    return NextResponse.json(insertedUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
} 