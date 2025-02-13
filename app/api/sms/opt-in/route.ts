import { NextResponse } from 'next/server';
import { updateMissionaryOptIn } from '@/app/utils/sms';
import { logConsent } from '@/app/utils/consent-logger';
import twilio from 'twilio';
import { headers } from 'next/headers';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const VALID_TYPES = ['Elders', 'Sisters', 'Taylor McKendrick'];

export async function POST(request: Request) {
  try {
    const { phoneNumber, type } = await request.json();
    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown';

    // Validate phone number format
    if (!phoneNumber.match(/^\+1\d{10}$/)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate missionary type
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid missionary type' },
        { status: 400 }
      );
    }

    // Update the missionary's opt-in status
    const updated = await updateMissionaryOptIn(phoneNumber, true);

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update opt-in status' },
        { status: 500 }
      );
    }

    // Log the consent record
    await logConsent(phoneNumber, type, ipAddress);

    // Send confirmation message
    try {
      await twilioClient.messages.create({
        body: 'You have successfully signed up for dinner appointment notifications. Reply STOP at any time to opt out.',
        to: phoneNumber,
        from: process.env.TWILIO_FROM_NUMBER,
      });
    } catch (error) {
      console.error('Error sending confirmation SMS:', error);
      // Don't fail the request if SMS fails, just log it
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in opt-in endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 