import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import axios from 'axios';

import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      auctionId, 
      brokers, 
      shipmentDetails
    } = body;

    if (!auctionId || !brokers || brokers.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: auctionId and brokers' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('bidding-bot');
    const collection = db.collection('selectedOwnerBrokers');

    const result = await collection.updateOne(
      { _id: new ObjectId(auctionId) },
      { $push: { selectedBrokers: { $each: brokers } } } as any,
    );

    if (result.modifiedCount > 0) {
      const dateObjectt = shipmentDetails.loadingDate;
      const dateObject = new Date(dateObjectt);

      const day = dateObject.getDate();
      const month = dateObject.getMonth() + 1;
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
        fromm: shipmentDetails.fromCity,
        to: shipmentDetails.toCity,
        vehicleType: shipmentDetails.vehicleType,
        totalWeight: shipmentDetails.totalWeight,
        totalVolume: shipmentDetails.totalVolume,
        loadingDate: finaldate,
        loadingTime: shipmentDetails.loadingTime,
        pickupAdress: shipmentDetails.pickupLocation,
        goodsQuantity: shipmentDetails.totalVolume,
        deliveryAdress: shipmentDetails.dropLocation,
        remark: shipmentDetails.remark,
        uniqueId: auctionId,
      };

      for (const broker of brokers) {
        await sendBiddingTemplate(dataz, broker.phone)
      }

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false });
    }
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

async function sendBiddingTemplate(data: any, broker: any) {
  try {
    const json = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": `91${broker}`,
        "type": "template",
        "template": {
            "name": "broker_biddings",
            "language": {
                "code": "en_US"
            },
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {
                            "type": "text",
                            "text": data.uniqueId.toString() ?? "-"
                        },
                        {
                            "type": "text",
                            "text": data.datetime
                        },
                        {
                            "type": "text",
                            "text": data.fromm
                        },
                        {
                            "type": "text",
                            "text": data.to
                        },
                        {
                            "type": "text",
                            "text": data.vehicleType
                        },
                        {
                            "type": "text",
                            "text": data.totalWeight === "" ? "-" : data.totalWeight
                        },
                        {
                            "type": "text",
                            "text": data.totalVolume === "" ? "-" : data.totalVolume
                        },
                        {
                            "type": "text",
                            "text": data.loadingTime
                        },
                        {
                            "type": "text",
                            "text": data.pickupAdress
                        },
                        {
                            "type": "text",
                            "text": data.goodsQuantity === "" ? "-" : data.goodsQuantity
                        },
                        {
                            "type": "text",
                            "text": data.deliveryAdress
                        },
                        {
                            "type": "text",
                            "text": data.remark === "" ? "-" : data.remark
                        },
                    ]
                },
                {
                    "type": "button",
                    "sub_type": "quick_reply",
                    "index": "0",
                    "parameters": [
                        {
                            "type": "payload",
                            "payload": `bid-${data.uniqueId}`
                        }
                    ]
                },
                {
                    "type": "button",
                    "sub_type": "quick_reply",
                    "index": "1",
                    "parameters": [
                        {
                            "type": "payload",
                            "payload": `notbid-${data.uniqueId}`
                        }
                    ]
                },
            ]
        }
    }

    const response = await axios.post(`https://graph.facebook.com/v21.0/${process.env.Meta_WA_SenderPhoneNumberId}/messages`, json, {
      headers: {
        'Authorization': `Bearer ${process.env.Meta_WA_accessToken}`
      }
    });

    console.log(response.data, "bidding template sent");
  } catch (error: any) {
    console.log(error?.response?.data, "error");
  }
}

