import { NextResponse } from 'next/server';
import { getScheduledEvents, getInviteeDetails } from '@/app/utils/calendly';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // Verify the missionary password
    if (password !== process.env.NEXT_PUBLIC_MISSIONARY_ACCESS_CODE) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get events for the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const eventsResponse = await getScheduledEvents(
      new Date().toISOString(),
      thirtyDaysFromNow.toISOString()
    );

    if (!eventsResponse?.collection) {
      return NextResponse.json({ appointments: [] });
    }

    // Get invitee details for each event
    const appointments = await Promise.all(
      eventsResponse.collection.map(async (event: any) => {
        try {
          const inviteesResponse = await getInviteeDetails(event.uri);
          const invitee = inviteesResponse?.collection?.[0] || {};
          
          // Find address in questions and answers
          const addressAnswer = invitee.questions_and_answers?.find(
            (qa: any) => qa.question.toLowerCase().includes('address')
          );

          return {
            eventId: event.uri,
            inviteeName: invitee.name || 'Unknown',
            email: invitee.email,
            phoneNumber: invitee.text_reminder_number,
            startTime: event.start_time,
            address: addressAnswer?.answer
          };
        } catch (error) {
          console.error('Error getting invitee details:', error);
          return null;
        }
      })
    );

    // Filter out any null appointments from errors
    const validAppointments = appointments.filter(Boolean);

    // Sort appointments by start time
    validAppointments.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return NextResponse.json({ appointments: validAppointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 