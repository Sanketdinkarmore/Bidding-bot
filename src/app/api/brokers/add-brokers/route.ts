import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      auctionId, 
      brokers, 
    } = body;

    if (!auctionId || !brokers || brokers.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: auctionId and brokers' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('bidding-bot');
    const collection = db.collection('selectedOwnerBroekr')

  } catch (error) {
    console.error('Error pushing to brokers:', error);
    return NextResponse.json(
      { 
        error: 'Failed to push shipment details to brokers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to generate notification messages
function generateNotificationMessage(shipmentDetails: any, recipientType: 'broker' | 'owner'): string {
  const { fromCity, toCity, vehicleType, loadingDate, loadingTime, bidClosingDateTime } = shipmentDetails;
  
  const loadingDateTime = new Date(`${loadingDate}T${loadingTime}`).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  
  const bidClosingTime = new Date(bidClosingDateTime).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  if (recipientType === 'broker') {
    return `🚛 NEW SHIPMENT OPPORTUNITY!

📍 Route: ${fromCity} → ${toCity}
🚚 Vehicle: ${vehicleType}
📅 Loading: ${loadingDateTime}
⏰ Bid Closes: ${bidClosingTime}

💰 Submit your best rate to win this shipment!
🔗 Login to bid now: [Bidding Portal Link]

#Transport #Logistics #BiddingOpportunity`;
  } else {
    return `🚛 NEW SHIPMENT REQUEST!

📍 Route: ${fromCity} → ${toCity}
🚚 Vehicle Needed: ${vehicleType}
📅 Loading: ${loadingDateTime}
⏰ Bid Closes: ${bidClosingTime}

💰 Quote your rate to secure this load!
🔗 Login to submit bid: [Owner Portal Link]

#VehicleOwner #Transport #LoadOpportunity`;
  }
}

// GET endpoint to fetch shipment notifications
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shipmentId = searchParams.get('shipmentId');
    const recipientType = searchParams.get('type'); // 'broker' or 'owner'
    const status = searchParams.get('status'); // 'pending', 'sent', 'failed'

    const client = await clientPromise;
    const db = client.db('bidding-bot');

    let query: any = {};
    
    if (shipmentId) query.shipmentId = shipmentId;
    if (recipientType) query.recipientType = recipientType;
    if (status) query.status = status;

    const notifications = await db.collection('broker_notifications')
      .find(query)
      .sort({ sentAt: -1 })
      .limit(100)
      .toArray();

    const ownerNotifications = await db.collection('owner_notifications')
      .find(query)
      .sort({ sentAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      success: true,
      brokerNotifications: notifications,
      ownerNotifications: ownerNotifications,
      total: notifications.length + ownerNotifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}