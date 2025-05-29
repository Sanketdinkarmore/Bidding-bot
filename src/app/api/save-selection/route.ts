import { NextResponse } from 'next/server';
import axios from 'axios';

import clientPromise from '@/lib/mongodb'; 

export async function POST(request: Request) {
  try {
    const selectionData = await request.json();

    const client = await clientPromise;
    const db = client.db('bidding-bot');
    const collection = db.collection('selectedOwnerBrokers');

    const date = new Date();
    const uniqueId = `${date.toLocaleString("default", { month: "short" }).toUpperCase()}${date.getDate()}${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await collection.insertOne({
      ...selectionData,
      uniqueId,
      createdAt: new Date(),
    });

    if (result.acknowledged) {
      const matchingBrokers = [...selectionData.selectedOwners, ...selectionData.selectedBrokers];

      const dateObjectt = Number(selectionData.shipmentDetails.loadingDate);
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
        uniqueId: result.insertedId,
      };

      for (const broker of matchingBrokers) {
        await sendBiddingTemplate(dataz, broker.phone)
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

async function sendBiddingTemplate(data: any, broker: any) {
  try {
    const json = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": `91${broker.phone}`,
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
                            "text": data.uniqueId
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
                            "text": data.totalWeight
                        },
                        {
                            "type": "text",
                            "text": data.totalVolume
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
                            "text": data.goodsQuantity
                        },
                        {
                            "type": "text",
                            "text": data.deliveryAdress
                        },
                        {
                            "type": "text",
                            "text": data.remark
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
                            "payload": "full-day@1234567890"
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
                            "payload": `bid-${data.uniqueId}-${broker.brokerNo}`
                        }
                    ]
                },
                {
                    "type": "button",
                    "sub_type": "quick_reply",
                    "index": "2",
                    "parameters": [
                        {
                            "type": "payload",
                            "payload": `notavail-${data.uniqueId}-${broker.brokerNo}`
                        }
                    ]
                }
            ]
        }
    }

    const response = await axios.post(`https://graph.facebook.com/v21.0/${process.env.Meta_WA_SenderPhoneNumberId}/messages`, json, {
      headers: {
        'Authorization': `Bearer ${process.env.Meta_WA_accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(response.data, "bidding template sent");
  } catch (error) {
    console.log(error, "error");
  }
}

