const CALENDLY_API_URL = 'https://api.calendly.com'

// Using dynamic import for dotenv in ESM
import { config } from 'dotenv'
import { sendSMSNotification } from './sms'
config({ path: '.env.local' })

interface CalendlyEvent {
  uri: string
  name: string
  status: string
  start_time: string
  end_time: string
  event_type: string
  location: {
    type: string
    location: string
  }
  invitees_counter: {
    total: number
    active: number
    limit: number
  }
  created_at: string
  updated_at: string
}

interface QuestionAndAnswer {
  question: string
  answer: string
}

interface CalendlyInvitee {
  name: string
  email: string
  text_reminder_number: string | null
  questions_and_answers: QuestionAndAnswer[]
}

// Track processed appointments to avoid duplicates
const processedAppointments = new Set<string>();

export async function getCurrentUser() {
  const response = await fetch(`${CALENDLY_API_URL}/users/me`, {
    headers: {
      'Authorization': `Bearer ${process.env.CALENDLY_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })
  const data = await response.json()
  return data
}

export async function getScheduledEvents(minTime?: string, maxTime?: string) {
  const params = new URLSearchParams({
    status: 'active',
    sort: 'start_time:desc',
    user: 'https://api.calendly.com/users/a39ca8c6-b9b4-4227-9c7a-df7768ee57d7'
  })
  
  if (minTime) params.append('min_start_time', minTime)
  if (maxTime) params.append('max_start_time', maxTime)

  console.log('Fetching events with params:', params.toString())
  
  const response = await fetch(`${CALENDLY_API_URL}/scheduled_events?${params}`, {
    headers: {
      'Authorization': `Bearer ${process.env.CALENDLY_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })
  
  // Log the full request URL and response for debugging
  console.log('Request URL:', `${CALENDLY_API_URL}/scheduled_events?${params}`)
  const data = await response.json()
  console.log('Response data:', JSON.stringify(data))
  
  return data
}

export async function getEventDetails(eventUri: string) {
  const response = await fetch(eventUri, {
    headers: {
      'Authorization': `Bearer ${process.env.CALENDLY_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })
  const data = await response.json()
  return data
}

export async function getInviteeDetails(eventUri: string) {
  const response = await fetch(`${eventUri}/invitees`, {
    headers: {
      'Authorization': `Bearer ${process.env.CALENDLY_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })
  const data = await response.json()
  return data
}

export async function processNewAppointments(lastCheckTime: string) {
  try {
    console.log('Starting appointment check at:', new Date().toISOString());
    console.log('Checking for appointments since:', lastCheckTime);
    
    // Get all events since last check
    const eventsResponse = await getScheduledEvents(lastCheckTime);
    console.log('Events response:', JSON.stringify(eventsResponse));
    
    // Check if we have a valid response with collection
    if (!eventsResponse?.collection) {
      console.log('No new appointments found');
      return { processed: 0, events: [] };
    }
    
    const events = eventsResponse.collection as CalendlyEvent[];
    const missionaryPhones = (process.env.MISSIONARY_PHONE_NUMBERS || '').split(',');
    const processedEvents = [];

    for (const event of events) {
      try {
        // Skip if we've already processed this event
        if (processedAppointments.has(event.uri)) {
          console.log('Skipping already processed event:', event.uri);
          continue;
        }

        // Get invitee details for each event
        const inviteesResponse = await getInviteeDetails(event.uri);
        
        // Check if we have valid invitees
        if (!inviteesResponse?.collection) {
          console.log('No invitees found for event:', event.uri);
          continue;
        }
        
        const invitees = inviteesResponse.collection as CalendlyInvitee[];

        for (const invitee of invitees) {
          try {
            // Prepare message for missionaries
            const missionaryMessage = `New dinner appointment scheduled!
Name: ${invitee.name}
Email: ${invitee.email}
Date: ${new Date(event.start_time).toLocaleString()}
Duration: ${Math.round((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000)}min`;

            console.log('Sending SMS to missionaries:', missionaryMessage);
            
            // Send notification to missionaries
            const sent = await sendSMSNotification(missionaryMessage);
            
            if (sent) {
              // Only track as processed if SMS was sent successfully
              processedAppointments.add(event.uri);
              processedEvents.push({
                eventId: event.uri,
                inviteeName: invitee.name,
                startTime: event.start_time
              });
            }
          } catch (inviteeError) {
            console.error('Error processing invitee:', inviteeError);
          }
        }
      } catch (eventError) {
        console.error('Error processing event:', eventError);
      }
    }

    // Keep only the last 1000 processed appointments to prevent memory growth
    if (processedAppointments.size > 1000) {
      const entries = Array.from(processedAppointments);
      entries.slice(0, entries.length - 1000).forEach(uri => processedAppointments.delete(uri));
    }

    return {
      processed: processedEvents.length,
      events: processedEvents,
      totalTracked: processedAppointments.size
    };
  } catch (error) {
    console.error('Error processing appointments:', error);
    return { 
      processed: 0, 
      events: [], 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      totalTracked: processedAppointments.size
    };
  }
} 