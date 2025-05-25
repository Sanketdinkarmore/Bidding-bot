import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb'; // Import your MongoDB client promise

export async function POST(request: Request) {
  try {
    const selectionData = await request.json();
    const { shipmentDetails, selectedOwnerIds, selectedBrokerIds } = selectionData;

    console.log('Received selection data for saving:', selectionData);

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('bidding-bot'); // Replace with your actual database name if different
    const collection = db.collection('selectedOwnerBrokers'); // Name for the new collection

    // Insert the selection data into the collection
    const result = await collection.insertOne({
      ...selectionData,
      createdAt: new Date(), // Optional: Add a timestamp
    });

    console.log('Selection saved to MongoDB:', result);

    if (result.acknowledged) {
      return NextResponse.json({ message: 'Selection saved successfully', insertedId: result.insertedId }, { status: 200 });
    } else {
      throw new Error('MongoDB insertion not acknowledged');
    }

  } catch (error) {
    console.error('Error saving selection to MongoDB:', error);
    return NextResponse.json({ message: 'Failed to save selection', error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
  }
}

// You might also want to add handlers for other HTTP methods if needed, e.g., GET, PUT, DELETE
// export async function GET(request: Request) {}