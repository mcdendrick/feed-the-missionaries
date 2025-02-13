import { NextResponse } from 'next/server';
import { updateMissionaryOptIn } from '@/app/utils/sms';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const body = (formData.get('Body') as string).trim().toLowerCase();

    // Handle opt-in/out commands
    if (body === 'start' || body === 'stop') {
      const optIn = body === 'start';
      const updated = await updateMissionaryOptIn(from, optIn);
      
      if (updated) {
        const message = optIn 
          ? 'You have successfully opted in to dinner appointment notifications.'
          : 'You have successfully opted out of dinner appointment notifications.';
        
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
          {
            status: 200,
            headers: {
              'Content-Type': 'text/xml',
            },
          }
        );
      }
    }

    // For any other messages, send help text
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Text START to receive dinner appointment notifications, or STOP to opt out.</Message></Response>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/xml',
        },
      }
    );
  } catch (error) {
    console.error('Twilio webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 