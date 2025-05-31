import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      shipmentDetails, 
      selectedBrokers, 
      selectedOwners,
      notificationMethod = 'database' // Options: 'database', 'sms', 'email', 'whatsapp'
    } = body;

    if (!shipmentDetails || !selectedBrokers || selectedBrokers.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: shipmentDetails and selectedBrokers' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('bidding-bot');

    // Create a unique shipment ID
    const shipmentId = new Date().getTime().toString();
    const createdAt = new Date();

    // Prepare shipment data for database
    const shipmentData = {
      shipmentId,
      ...shipmentDetails,
      selectedBrokers: selectedBrokers.map((broker: any) => ({
        id: broker.id,
        name: broker.name,
        phone: broker.phone,
        averageAmount: broker.amounts,
        notificationStatus: 'pending'
      })),
      selectedOwners: selectedOwners?.map((owner: any) => ({
        id: owner.id,
        name: owner.name,
        phone: owner.phone,
        averageAmount: owner.amounts,
        notificationStatus: 'pending'
      })) || [],
      status: 'active',
      bidStatus: 'open',
      createdAt,
      updatedAt: createdAt,
      bidClosingDateTime: new Date(shipmentDetails.bidClosingDateTime),
      notifications: []
    };

    // Save shipment to database
    const shipmentsCollection = db.collection('active_shipments');
    await shipmentsCollection.insertOne(shipmentData);

    // Prepare notification data for brokers
    const notificationPromises = [];
    const notificationResults = [];

    for (const broker of selectedBrokers) {
      try {
        // Create notification record
        const notification = {
          notificationId: `${shipmentId}_${broker.id}_${Date.now()}`,
          shipmentId,
          recipientType: 'broker',
          recipientId: broker.id,
          recipientName: broker.name,
          recipientPhone: broker.phone,
          message: generateNotificationMessage(shipmentDetails, 'broker'),
          method: notificationMethod,
          status: 'sent',
          sentAt: new Date(),
          shipmentDetails: {
            fromCity: shipmentDetails.fromCity,
            toCity: shipmentDetails.toCity,
            vehicleType: shipmentDetails.vehicleType,
            loadingDate: shipmentDetails.loadingDate,
            loadingTime: shipmentDetails.loadingTime,
            bidClosingDateTime: shipmentDetails.bidClosingDateTime,
            pickupLocation: shipmentDetails.pickupLocation,
            dropLocation: shipmentDetails.dropLocation,
            averageRate: broker.amounts
          }
        };

        // Store notification in database
        const notificationsCollection = db.collection('broker_notifications');
        await notificationsCollection.insertOne(notification);

        // Add to notification results
        notificationResults.push({
          brokerId: broker.id,
          brokerName: broker.name,
          status: 'success',
          notificationId: notification.notificationId,
          method: notificationMethod
        });

        // If SMS or other external notification methods are required, add them here
        if (notificationMethod === 'sms' && broker.phone) {
          // TODO: Integrate with SMS service (Twilio, etc.)
          console.log(`SMS would be sent to ${broker.phone}: ${notification.message}`);
        }

        if (notificationMethod === 'whatsapp' && broker.phone) {
          // TODO: Integrate with WhatsApp Business API
          console.log(`WhatsApp would be sent to ${broker.phone}: ${notification.message}`);
        }

      } catch (brokerError) {
        console.error(`Error notifying broker ${broker.id}:`, brokerError);
        notificationResults.push({
          brokerId: broker.id,
          brokerName: broker.name,
          status: 'failed',
          error: brokerError instanceof Error ? brokerError.message : 'Unknown error',
          method: notificationMethod
        });
      }
    }

    // Also notify selected owners if any
    for (const owner of selectedOwners || []) {
      try {
        const notification = {
          notificationId: `${shipmentId}_${owner.id}_${Date.now()}`,
          shipmentId,
          recipientType: 'owner',
          recipientId: owner.id,
          recipientName: owner.name,
          recipientPhone: owner.phone,
          message: generateNotificationMessage(shipmentDetails, 'owner'),
          method: notificationMethod,
          status: 'sent',
          sentAt: new Date(),
          shipmentDetails: {
            fromCity: shipmentDetails.fromCity,
            toCity: shipmentDetails.toCity,
            vehicleType: shipmentDetails.vehicleType,
            loadingDate: shipmentDetails.loadingDate,
            loadingTime: shipmentDetails.loadingTime,
            bidClosingDateTime: shipmentDetails.bidClosingDateTime,
            pickupLocation: shipmentDetails.pickupLocation,
            dropLocation: shipmentDetails.dropLocation,
            averageRate: owner.amounts
          }
        };

        const notificationsCollection = db.collection('owner_notifications');
        await notificationsCollection.insertOne(notification);

        notificationResults.push({
          ownerId: owner.id,
          ownerName: owner.name,
          status: 'success',
          notificationId: notification.notificationId,
          method: notificationMethod
        });

      } catch (ownerError) {
        console.error(`Error notifying owner ${owner.id}:`, ownerError);
        notificationResults.push({
          ownerId: owner.id,
          ownerName: owner.name,
          status: 'failed',
          error: ownerError instanceof Error ? ownerError.message : 'Unknown error',
          method: notificationMethod
        });
      }
    }

    // Update shipment with notification results
    await shipmentsCollection.updateOne(
      { shipmentId },
      { 
        $set: { 
          notifications: notificationResults,
          updatedAt: new Date()
        }
      }
    );

    // Prepare summary statistics
    const successfulBrokerNotifications = notificationResults.filter(r => r.brokerId && r.status === 'success').length;
    const failedBrokerNotifications = notificationResults.filter(r => r.brokerId && r.status === 'failed').length;
    const successfulOwnerNotifications = notificationResults.filter(r => r.ownerId && r.status === 'success').length;
    const failedOwnerNotifications = notificationResults.filter(r => r.ownerId && r.status === 'failed').length;

    return NextResponse.json({
      success: true,
      shipmentId,
      message: 'Shipment details pushed to selected brokers and owners successfully',
      summary: {
        totalBrokers: selectedBrokers.length,
        successfulBrokerNotifications,
        failedBrokerNotifications,
        totalOwners: selectedOwners?.length || 0,
        successfulOwnerNotifications,
        failedOwnerNotifications,
        notificationMethod
      },
      results: notificationResults,
      shipmentData: {
        shipmentId,
        status: shipmentData.status,
        bidStatus: shipmentData.bidStatus,
        createdAt: shipmentData.createdAt,
        bidClosingDateTime: shipmentData.bidClosingDateTime
      }
    });

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