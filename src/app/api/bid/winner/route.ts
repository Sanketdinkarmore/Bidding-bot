import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from 'mongodb';
// import axios from 'axios';
import WhatsappCloudAPI from "whatsappcloudapi_wrapper";

import clientPromise from '@/lib/mongodb'; 

export async function POST(req: NextRequest) {
    const body = await req.json();
    
    const client = await clientPromise;
    const db = client.db('bidding-bot');
    const collection = db.collection('selectedOwnerBrokers');

    console.log("API Request Body:", body);

    let result;

    if (body.action === 'select') {
        // Add winner to selectedWinners array
        result = await collection.updateOne({
            _id: new ObjectId(body.docId)
        }, {
            $push: {
                selectedWinners: body.selectedWinner
            }
        });

        console.log("✅ Adding winner:", body.selectedWinner);

        if (result.acknowledged && result.modifiedCount > 0) {
            // Send winner notification
            const data = {
                bidAmount: body.selectedWinner.amount,
                ...body.shipmentDetails,
                orderId: body.orderId
            }

            await sendWinnerTemplate(data, body.selectedWinner);

            return NextResponse.json({ success: true, message: "Winner selected successfully" });
        } else {
            console.error("Failed to add winner");
            return NextResponse.json({ success: false, message: "Failed to select winner" }, { status: 500 });
        }

    } else if (body.action === 'unselect') {
        // Remove winner from selectedWinners array
        console.log("🔍 Attempting to remove winner with criteria:", {
            phone: body.selectedWinner.phone,
            amount: body.selectedWinner.amount
        });
        
        // First, let's check what's currently in the document
        const currentDoc = await collection.findOne({ _id: new ObjectId(body.docId) });
        console.log("📄 Current selectedWinners in document:", currentDoc?.selectedWinners);
        
        result = await collection.updateOne({
            _id: new ObjectId(body.docId)
        }, {
            $pull: {
                selectedWinners: {
                    phone: body.selectedWinner.phone,
                    amount: body.selectedWinner.amount
                }
            }
        } as any);

        console.log("❌ Removing winner:", body.selectedWinner);
        console.log("🔧 MongoDB update result:", {
            acknowledged: result.acknowledged,
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount
        });

        if (result.acknowledged && result.modifiedCount > 0) {
            console.log("Winner removed successfully");
            return NextResponse.json({ success: true, message: "Winner unselected successfully" });
        } else {
            console.error("Failed to remove winner - may not exist or no changes made");
            return NextResponse.json({ success: false, message: "Failed to unselect winner or winner not found" }, { status: 500 });
        }

    } else {
        console.error("Invalid action:", body.action);
        return NextResponse.json({ success: false, message: "Invalid action. Use 'select' or 'unselect'" }, { status: 400 });
    }
}

async function sendWinnerTemplate(data: any, broker: any) {
  try {

    const message = `🎉 Congratulations! You have WON the bid for Booking ID: ${data.orderId}
📋 Shipment and Bid Details:
- Bid Amount: ${data.bidAmount}
- Date: ${data.loadingDate}
- From: ${data.fromCity}
- To: ${data.toCity}
- Vehicle Type: ${data.vehicleType}

✅ Next Steps:
Our traffic coordinator will contact you within the next 2-4 hours to discuss:
• Vehicle arrangement details
• Documentation requirements
• Loading schedule confirmation
• Payment terms

Thank you for your competitive bid. We look forward to a successful shipment!

Best regards,
APML
        `

    const response = await sendTextMessage(message, `91${broker.phone}`);
    console.log(response, "response");

    // const json = {
    //     "messaging_product": "whatsapp",
    //     "recipient_type": "individual",
    //     "to": `91${broker.phone}`,
    //     "type": "template",
    //     "template": {
    //         "name": "bidding_winner",
    //         "language": {
    //             "code": "en_US"
    //         },
    //         "components": [
    //             {
    //                 "type": "body",
    //                 "parameters": [
    //                     {
    //                         "type": "text",
    //                         "text": data.uniqueId
    //                     },
    //                     {
    //                         "type": "text",
    //                         "text": data.datetime
    //                     },
    //                     {
    //                         "type": "text",
    //                         "text": data.fromm
    //                     },
    //                     {
    //                         "type": "text",
    //                         "text": data.to
    //                     },
    //                     {
    //                         "type": "text",
    //                         "text": data.vehicleType
    //                     },
    //                     {
    //                         "type": "text",
    //                         "text": data.totalWeight
    //                     },
    //                     {
    //                         "type": "text",
    //                         "text": data.totalVolume
    //                     },
    //                     {
    //                         "type": "text",
    //                         "text": data.loadingTime
    //                     },
    //                     {
    //                         "type": "text",
    //                         "text": data.pickupAdress
    //                     },
    //                     {
    //                         "type": "text",
    //                         "text": data.goodsQuantity
    //                     },
    //                     {
    //                         "type": "text",
    //                         "text": data.deliveryAdress
    //                     },
    //                     {
    //                         "type": "text",
    //                         "text": data.remark
    //                     },
    //                 ]
    //             },
               
    //         ]
    //     }
    // }

    // const response = await axios.post(`https://graph.facebook.com/v21.0/${process.env.Meta_WA_SenderPhoneNumberId}/messages`, json, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.Meta_WA_accessToken}`,
    //     'Content-Type': 'application/json',
    //     'Accept': 'application/json'
    //   }
    // });

    // console.log(response.data, "bidding template sent");
  } catch (error) {
    console.log(error, "error");
  }
}

async function sendTextMessage(message: string, recipientPhone: string) {
    const Whatsapp = new WhatsappCloudAPI({
        accessToken:
            "EAAKL61phcGgBOwlmvZC05Tg66Bp4VBbDVPKPs0xZC4vb7nh2jrJGbCdb9751IIBBgHoE3QZCHKZBlbjZCLEphW5U9loT9WNMtXfRQUekDEMVMWNsUKFYtuYjJdqKEgto6ZCOwWRNkZBKPrDzy7zcD6Ppfesgm87Oq03YooUyvc63iuOZCX3RZB5WWhnrYDCI4IAYZB3Vrk5ZArHKKwuWW4m",
        senderPhoneNumberId: "112960768471848",
        WABA_ID: "108771235561996",
    });

  try {
    await Whatsapp.sendText({
      message,
      recipientPhone,
    });
  } catch (error) {
    console.log(error, "error");
  }
}