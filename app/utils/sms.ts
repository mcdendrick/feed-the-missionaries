import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function sendSMSNotification(message: string, phoneNumbers: string[]) {
  try {
    const promises = phoneNumbers.map(phoneNumber =>
      twilioClient.messages.create({
        body: message,
        to: phoneNumber,
        from: process.env.TWILIO_FROM_NUMBER,
      })
    )
    await Promise.all(promises)
    return true
  } catch (error) {
    console.error('Error sending SMS:', error)
    return false
  }
} 