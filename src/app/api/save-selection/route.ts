import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb'; 
import WhatsappCloudAPI from "whatsappcloudapi_wrapper";

const Whatsapp = new WhatsappCloudAPI({
  accessToken: process.env.Meta_WA_accessToken,
  senderPhoneNumberId: process.env.Meta_WA_SenderPhoneNumberId,
  WABA_ID: process.env.Meta_WA_wabaId,
});

export async function POST(request: Request) {
  try {
    const selectionData = await request.json();
    const { shipmentDetails, selectedOwnerIds, selectedBrokerIds } = selectionData;

    console.log('Received selection data for saving:', selectionData);

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('bidding-bot'); // Replace with your actual database name if different
    const collection = db.collection('selectedOwnerBrokers'); // Name for the new collection

    const date = new Date();
    const uniqueId = `${date.toLocaleString("default", { month: "short" }).toUpperCase()}${date.getDate()}${Math.floor(1000 + Math.random() * 9000)}`;

    // Insert the selection data into the collection
    const result = await collection.insertOne({
      ...selectionData,
      uniqueId,
      createdAt: new Date(),
    });

    console.log('Selection saved to MongoDB:', result);

    if (result.acknowledged) {
      const matchingBrokers = [...selectionData.selectedOwners, ...selectionData.selectedBrokers];

      const dateObjectt = Number(selectionData.shipmentDetails.loadingDate);
      const dateObject = new Date(dateObjectt);
      const day = dateObject.getDate();
      const month = dateObject.getMonth() + 1; // Months are zero-based, so we add 1
      const year = dateObject.getFullYear();
      const finaldate = `${day}/${month}/${year}`;

      const dataz = {
        datetime: new Date().toLocaleString("en-GB", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        fromm: selectionData.shipmentDetails.fromCity,
        to: selectionData.shipmentDetails.toCity,
        vehicleType: selectionData.shipmentDetails.vehicleType,
        totalWeight: selectionData.shipmentDetails.totalWeight,
        totalVolume: selectionData.shipmentDetails.totalVolume,
        loadingDate: finaldate,
        loadingTime: selectionData.shipmentDetails.loadingTime,
        pickupAdress: selectionData.shipmentDetails.pickupLocation,
        goodsQuantity: selectionData.shipmentDetails.totalVolume,
        deliveryAdress: selectionData.shipmentDetails.dropLocation,
        remark: selectionData.shipmentDetails.remark,
        uniqueId: uniqueId,
      };

      for (const broker of matchingBrokers) {
        const message = `
    *New Booking Request* 📝

    🆔 *Booking ID:* ${dataz.uniqueId}
    📅 *Date:* ${dataz.datetime}
    🚚 *From:* ${dataz.fromm}
    📍 *To:* ${dataz.to}
    🚛 *Vehicle Type:* ${dataz.vehicleType}
    ⚖️ *Total Weight:* ${dataz.totalWeight}
    📦 *Total Volume:* ${dataz.totalVolume}
    ⏰ *Loading Time:* ${dataz.loadingTime}
    🏢 *Pickup Address:* ${dataz.pickupAdress}
    📦 *Goods Quantity:* ${dataz.goodsQuantity}
    🏢 *Delivery Address:* ${dataz.deliveryAdress}
    📝 *Remarks:* ${dataz.remark}

      Please select your response:`;

          const listOfButtons = [
            {
              title: "Bid",
              id: `avail-${uniqueId}-${broker.brokerNo}`,
            },
            {
              title: "Not Interested",
              id: `notavail-${uniqueId}-${broker.brokerNo}`,
            },
            {
              title: "Need More Info",
              id: `info-${uniqueId}-${broker.brokerNo}`,
            },
          ];

          await sendSimpleButtons(
            message,
            listOfButtons,
            `91${broker.phone}`,
          );
      }

      return NextResponse.json({ message: 'Selection saved successfully', insertedId: result.insertedId }, { status: 200 });
    } else {
      throw new Error('MongoDB insertion not acknowledged');
    }

  } catch (error) {
    console.error('Error saving selection to MongoDB:', error);
    return NextResponse.json({ message: 'Failed to save selection', error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
  }
}

async function sendSimpleButtons(message: string, listOfButtons: any[], recipientPhone: string) {
  try {
    await Whatsapp.sendSimpleButtons({
      message,
      recipientPhone,
      listOfButtons,
    });
  } catch (error) {
    console.log(error, "error");
  }
}


// You might also want to add handlers for other HTTP methods if needed, e.g., GET, PUT, DELETE
// export async function GET(request: Request) {}



