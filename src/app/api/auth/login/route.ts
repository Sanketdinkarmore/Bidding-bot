import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(request: Request) {
  await dbConnect();

  try {
    const body = await request.json();
    const { phoneNumber, password } = body;

    // Check if the user exists in the database
    const user = await User.findOne({ phoneNumber, password });

    if (user) {
      return NextResponse.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          phoneNumber: user.phoneNumber,
        },
      });
    }

    return NextResponse.json(
      { message: "Invalid phone number or password" },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: error.message || "An error occurred during login" },
      { status: 500 }
    );
  }
} 