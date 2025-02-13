import { NextResponse } from 'next/server';
import { isValidSession } from '@/app/utils/session';

export async function POST(request: Request) {
  try {
    const { sessionToken, eventId } = await request.json();
    
    // Verify the session token
    if (!isValidSession(sessionToken)) {
      return NextResponse.json(
        { error: 'Session expired. Please log in again.' },
        { status: 401 }
      );
    }

    // Store deleted appointment IDs to filter them out later
    if (typeof window !== 'undefined') {
      const deletedAppointments = JSON.parse(localStorage.getItem('deletedAppointments') || '[]');
      deletedAppointments.push(eventId);
      localStorage.setItem('deletedAppointments', JSON.stringify(deletedAppointments));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 