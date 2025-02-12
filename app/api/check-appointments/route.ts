import { NextResponse } from 'next/server'
import { processNewAppointments } from '@/app/utils/calendly'

// Store the last check time in memory (will reset on server restart)
let lastCheckTime = new Date().toISOString()

// Check required environment variables
const requiredEnvVars = [
  'CALENDLY_ACCESS_TOKEN',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER',
  'MISSIONARY_PHONE_NUMBERS'
]

function checkEnvironmentVariables() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

export async function GET() {
  try {
    // Check environment variables first
    checkEnvironmentVariables()

    // Process new appointments since last check
    await processNewAppointments(lastCheckTime)
    
    // Update last check time
    lastCheckTime = new Date().toISOString()
    
    return NextResponse.json({ success: true, lastCheckTime })
  } catch (error) {
    console.error('Error checking appointments:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
} 