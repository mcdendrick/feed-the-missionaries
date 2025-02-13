import { NextResponse } from 'next/server';
import { updateMissionaryOptIn } from '@/app/utils/sms';
import { logConsent } from '@/app/utils/consent-logger';
import twilio from 'twilio';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const body = (formData.get('Body') as string)?.toLowerCase().trim();
    const from = formData.get('From') as string;

    // Handle opt-in/out commands
    if (body === 'start' || body === 'stop') {
      const optIn = body === 'start';
      const updated = await updateMissionaryOptIn(from, optIn);
      
      // Log the consent change
      await logConsent(
        from,
        'unknown', // We don't know the type from SMS commands
        'sms',     // Using 'sms' as IP address for SMS-based changes
        optIn ? 'opted_in' : 'opted_out',
        'sms'
      );
      
      const message = optIn
        ? 'You have successfully opted in to receive SMS notifications. Reply STOP at any time to opt out.'
        : 'You have successfully opted out of SMS notifications. Reply START to opt back in.';

      // Create TwiML response
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(message);

      return new NextResponse(twiml.toString(), {
        headers: {
          'Content-Type': 'text/xml',
        },
      });
    }

    // For any other messages, send a help response
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(
      'To manage your SMS notifications:\n' +
      '- Reply START to opt in\n' +
      '- Reply STOP to opt out'
    );

    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error) {
    console.error('Error in SMS webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 