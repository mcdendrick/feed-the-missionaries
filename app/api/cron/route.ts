import { NextResponse } from 'next/server';
import { processNewAppointments } from '@/app/utils/calendly';

export async function GET(request: Request) {
  // Verify the cron secret
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Get time 5 minutes ago to match the cron interval
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Process new appointments from the last 5 minutes
    const result = await processNewAppointments(fiveMinutesAgo.toISOString());
    
    // Log the result for debugging
    console.log('Appointment processing result:', result);
    
    return NextResponse.json({ 
      success: true, 
      result,
      checkTime: new Date().toISOString(),
      lookbackTime: fiveMinutesAgo.toISOString()
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 