import { getCurrentUser } from '../app/utils/calendly.js'

async function setupWebhook() {
  try {
    // Get current user info
    const userResponse = await getCurrentUser()
    console.log('Current user:', userResponse)
    
    console.log('\nWebhook setup is not needed for the polling-based approach.')
    console.log('The system will check for new appointments every 5 minutes using the Vercel cron job.')
  } catch (error) {
    console.error('Error:', error)
  }
}

setupWebhook() 