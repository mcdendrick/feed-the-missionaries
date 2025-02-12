import { NextResponse } from 'next/server'
import twilio from 'twilio'
import crypto from 'crypto'
import { getInviteeDetails } from '@/app/utils/calendly'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

interface QuestionAndAnswer {
  question: string
  answer: string
}

// Verify Calendly webhook signature
function verifyCalendlyWebhook(body: string, signature: string) {
  const hmac = crypto.createHmac('sha256', process.env.CALENDLY_WEBHOOK_SIGNING_KEY || '')
  const digest = hmac.update(body).digest('hex')
  return signature === digest
}

async function sendSMSNotification(message: string, phoneNumbers: string[]) {
  try {
    const promises = phoneNumbers.map(phoneNumber =>
      twilioClient.messages.create({
        body: message,
        to: phoneNumber,
        from: process.env.TWILIO_FROM_NUMBER,
      })
    )
    await Promise.all(promises)
  } catch (error) {
    console.error('Error sending SMS:', error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('calendly-webhook-signature') || ''

    // Verify webhook signature
    if (!verifyCalendlyWebhook(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const missionaryPhones = (process.env.MISSIONARY_PHONE_NUMBERS || '').split(',')
    
    switch (event.event) {
      case 'invitee.created': {
        const inviteeDetails = await getInviteeDetails(event.payload.uri)
        
        const { invitee, event_type } = event.payload
        const address = inviteeDetails.resource.questions_and_answers?.find(
          (qa: QuestionAndAnswer) => qa.question.toLowerCase().includes('address')
        )?.answer || 'No address provided'
        
        // Send notification to missionaries
        const missionaryMessage = `New dinner appointment scheduled!
Name: ${invitee.name}
Email: ${invitee.email}
Phone: ${invitee.text_reminder_number || 'Not provided'}
Date: ${new Date(event_type.start_time).toLocaleString()}
Duration: ${event_type.duration}min
Address: ${address}`

        await sendSMSNotification(missionaryMessage, missionaryPhones)

        // Send confirmation to invitee
        if (invitee.text_reminder_number) {
          const inviteeMessage = `Your missionary dinner appointment has been scheduled!
Date: ${new Date(event_type.start_time).toLocaleString()}
Duration: ${event_type.duration}min
Address: ${address}

We look forward to meeting you! If you need to reschedule, please use the link in your confirmation email.`

          await sendSMSNotification(inviteeMessage, [invitee.text_reminder_number])
        }
        break
      }
      
      case 'invitee.canceled': {
        const { invitee, event_type } = event.payload
        
        // Notify missionaries of cancellation
        const cancellationMessage = `Dinner appointment canceled
Name: ${invitee.name}
Originally scheduled for: ${new Date(event_type.start_time).toLocaleString()}`

        await sendSMSNotification(cancellationMessage, missionaryPhones)
        break
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 