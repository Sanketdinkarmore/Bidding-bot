import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipmentId, newClosingDate, newClosingTime, newClosingDateTime } = body;

    // Validate required fields
    if (!shipmentId || !newClosingDate || !newClosingTime || !newClosingDateTime) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields: shipmentId, newClosingDate, newClosingTime, newClosingDateTime' 
      }, { status: 400 });
    }

    // Validate that the new date/time is in the future
    const newDateTime = new Date(newClosingDateTime);
    const now = new Date();
    
    if (newDateTime <= now) {
      return NextResponse.json({ 
        success: false, 
        message: 'New closing date and time must be in the future' 
      }, { status: 400 });
    }

    console.log('📅 Extending bidding for shipment:', shipmentId);
    console.log('📅 New closing date/time:', newClosingDateTime);

    // TODO: Replace this with your actual database update logic
    // For now, we'll simulate a successful response
    // 
    // Example MongoDB update operation:
    // await db.collection('shipments').updateOne(
    //   { _id: ObjectId(shipmentId) },
    //   { 
    //     $set: { 
    //       closingDate: newClosingDate,
    //       closingTime: newClosingTime,
    //       closingDateTime: newDateTime,
    //       updatedAt: new Date()
    //     } 
    //   }
    // );

    // For now, simulate a successful response
    return NextResponse.json({
      success: true,
      message: 'Bidding date extended successfully',
      data: {
        shipmentId,
        newClosingDate,
        newClosingTime,
        newClosingDateTime,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error extending bidding date:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 