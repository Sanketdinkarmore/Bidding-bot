import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from 'mongodb';

import clientPromise from '@/lib/mongodb'; 

export async function POST(req: NextRequest, res: NextResponse) {
    const body = await req.json();
    
    const client = await clientPromise;
    const db = client.db('bidding-bot');
    const collection = db.collection('selectedOwnerBrokers');

    console.log(body)

    const result = await collection.updateOne({
        _id: new ObjectId(body.docId)
    }, {
        $push: {
            selectedWinners: body.selectedWinner
        }
    });

    console.log(result)

    if (result.acknowledged) {
        return NextResponse.json({ success: true, message: "Bid winner updated" });
    } else {
        return NextResponse.json({ success: false, message: "Failed to update bid winner" }, { status: 500 });
    }
}